package sandbox

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/client"
	"github.com/docker/docker/pkg/stdcopy"
)

type Language string

const (
	LangC      Language = "c"
	LangCPP    Language = "cpp"
	LangCS     Language = "csharp"
	LangJava   Language = "java"
	LangPython Language = "python"
	LangGo     Language = "go"
	LangZig    Language = "zig"
)

type ExecutionResult struct {
	Status     string        // AC (Accepted), WA (Wrong Answer), TLE (Time Limit Exceeded), MLE (Memory Limit Exceeded), RE (Runtime Error), CE (Compile Error)
	TimeTaken  time.Duration // Execution duration
	Output     string        // Capture stdout
	ErrorLog   string        // Capture stderr / compilation error
}

type Submission struct {
	ID          string
	Code        string
	Language    Language
	TimeLimit   time.Duration // Time limit per testcase
	MemoryLimit int64         // Memory limit in MB
	Input       string        // Input for testcase
	ExpectedOut string        // Expected output to match
}

type DockerRunner struct {
	cli *client.Client
}

func NewDockerRunner() (*DockerRunner, error) {
	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		return nil, err
	}
	return &DockerRunner{cli: cli}, nil
}

func GetImageForLanguage(lang Language) string {
	switch lang {
	case LangC, LangCPP:
		return "gcc:latest"
	case LangCS:
		return "mcr.microsoft.com/dotnet/sdk:latest"
	case LangJava:
		return "openjdk:latest"
	case LangPython:
		return "python:latest"
	case LangGo:
		return "golang:latest"
	case LangZig:
		return "ziglang/zig:latest"
	default:
		return "ubuntu:latest"
	}
}

func (dr *DockerRunner) Execute(ctx context.Context, sub Submission) (ExecutionResult, error) {
	imageName := GetImageForLanguage(sub.Language)

	_, _, err := dr.cli.ImageInspectWithRaw(ctx, imageName)
	if err != nil {
		fmt.Printf("Image %s not found locally. Pulling image...\n", imageName)
		reader, err := dr.cli.ImagePull(ctx, imageName, types.ImagePullOptions{})
		if err != nil {
			return ExecutionResult{}, fmt.Errorf("failed to pull image %s: %w", imageName, err)
		}
		defer reader.Close()
		_, _ = io.Copy(os.Stdout, reader)
	}

	tempDir, err := os.MkdirTemp("", "truesubmit-run-*")
	if err != nil {
		return ExecutionResult{}, fmt.Errorf("failed to create temp dir: %w", err)
	}
	defer os.RemoveAll(tempDir)

	fileName := "source"
	var runCmd []string

	switch sub.Language {
	case LangC:
		fileName = "main.c"
		runCmd = []string{"sh", "-c", "gcc -O3 /workspace/main.c -o /workspace/main && /workspace/main"}
	case LangCPP:
		fileName = "main.cpp"
		runCmd = []string{"sh", "-c", "g++ -O3 /workspace/main.cpp -o /workspace/main && /workspace/main"}
	case LangCS:
		fileName = "Program.cs"
		runCmd = []string{"sh", "-c", "dotnet new console -o /workspace/app --no-restore && cp /workspace/Program.cs /workspace/app/Program.cs && dotnet run --project /workspace/app"}
	case LangJava:
		fileName = "Main.java"
		runCmd = []string{"sh", "-c", "javac /workspace/Main.java -d /workspace && java -cp /workspace Main"}
	case LangPython:
		fileName = "main.py"
		runCmd = []string{"python", "/workspace/main.py"}
	case LangGo:
		fileName = "main.go"
		runCmd = []string{"sh", "-c", "go build -o /workspace/main /workspace/main.go && /workspace/main"}
	case LangZig:
		fileName = "main.zig"
		runCmd = []string{"sh", "-c", "zig build-exe -O ReleaseSafe --name /workspace/main /workspace/main.zig && /workspace/main"}
	default:
		return ExecutionResult{}, fmt.Errorf("unsupported language: %s", sub.Language)
	}

	codePath := filepath.Join(tempDir, fileName)
	if err := os.WriteFile(codePath, []byte(sub.Code), 0644); err != nil {
		return ExecutionResult{}, fmt.Errorf("failed to write source code: %w", err)
	}

	inputPath := filepath.Join(tempDir, "input.txt")
	if err := os.WriteFile(inputPath, []byte(sub.Input), 0644); err != nil {
		return ExecutionResult{}, fmt.Errorf("failed to write input file: %w", err)
	}

	memLimit := sub.MemoryLimit * 1024 * 1024
	if memLimit <= 0 {
		memLimit = 256 * 1024 * 1024
	}

	config := &container.Config{
		Image:           imageName,
		Cmd:             runCmd,
		NetworkDisabled: true,
		WorkingDir:      "/workspace",
		OpenStdin:       true,
		StdinOnce:       true,
		AttachStdin:     true,
		AttachStdout:    true,
		AttachStderr:    true,
	}

	hostConfig := &container.HostConfig{
		Resources: container.Resources{
			Memory:    memLimit,
			CPUShares: 512,
		},
		Tmpfs: map[string]string{
			"/workspace": "rw,noexec,nosuid,size=64m",
		},
		Binds: []string{
			fmt.Sprintf("%s:/workspace_host:ro", tempDir),
		},
	}

	if len(runCmd) > 1 && runCmd[0] == "sh" {
		runCmd[2] = fmt.Sprintf("cp /workspace_host/%s /workspace/%s && cp /workspace_host/input.txt /workspace/input.txt && %s < /workspace/input.txt", fileName, fileName, runCmd[2][strings.LastIndex(runCmd[2], "&&")+2:])
	} else {
		config.Cmd = []string{"sh", "-c", fmt.Sprintf("cp /workspace_host/%s /workspace/%s && cp /workspace_host/input.txt /workspace/input.txt && %s < /workspace/input.txt", fileName, fileName, strings.Join(runCmd, " "))}
	}

	resp, err := dr.cli.ContainerCreate(ctx, config, hostConfig, nil, nil, "")
	if err != nil {
		return ExecutionResult{Status: "RE", ErrorLog: fmt.Sprintf("failed to create container: %v", err)}, nil
	}
	defer func() {
		stopTimeout := 2
		_ = dr.cli.ContainerStop(ctx, resp.ID, container.StopOptions{Timeout: &stopTimeout})
		_ = dr.cli.ContainerRemove(ctx, resp.ID, types.ContainerRemoveOptions{Force: true})
	}()

	err = dr.cli.ContainerStart(ctx, resp.ID, types.ContainerStartOptions{})
	if err != nil {
		return ExecutionResult{Status: "RE", ErrorLog: fmt.Sprintf("failed to start container: %v", err)}, nil
	}

	startTime := time.Now()

	timeout := sub.TimeLimit
	if timeout <= 0 {
		timeout = 2 * time.Second
	}

	type waitResult struct {
		exitCode int64
		err      error
	}

	waitChan := make(chan waitResult, 1)
	go func() {
		statusCh, errCh := dr.cli.ContainerWait(ctx, resp.ID, container.WaitConditionNotRunning)
		select {
		case err := <-errCh:
			waitChan <- waitResult{err: err}
		case status := <-statusCh:
			waitChan <- waitResult{exitCode: status.StatusCode}
		}
	}()

	var status string
	var timeTaken time.Duration

	select {
	case <-time.After(timeout):
		status = "TLE"
		timeTaken = timeout
		stopTimeout := 0
		_ = dr.cli.ContainerStop(ctx, resp.ID, container.StopOptions{Timeout: &stopTimeout})
	case res := <-waitChan:
		timeTaken = time.Since(startTime)
		if res.err != nil {
			status = "RE"
		} else if res.exitCode != 0 {
			status = "RE"
		} else {
			status = "RUN_SUCCESS"
		}
	}

	out, err := dr.cli.ContainerLogs(ctx, resp.ID, types.ContainerLogsOptions{ShowStdout: true, ShowStderr: true})
	if err != nil {
		return ExecutionResult{Status: "RE", ErrorLog: fmt.Sprintf("failed to read container logs: %v", err)}, nil
	}
	defer out.Close()

	var stdoutBuf, stderrBuf bytes.Buffer
	_, _ = stdcopy.StdCopy(&stdoutBuf, &stderrBuf, out)

	stdoutStr := strings.TrimSpace(stdoutBuf.String())
	stderrStr := strings.TrimSpace(stderrBuf.String())

	if status == "TLE" {
		return ExecutionResult{
			Status:    "TLE",
			TimeTaken: timeTaken,
			ErrorLog:  "Time Limit Exceeded",
		}, nil
	}

	if status == "RE" {
		isCE := strings.Contains(stderrStr, "error:") || strings.Contains(stderrStr, "Compile Error") || strings.Contains(stderrStr, "Compilation failed")
		if isCE {
			return ExecutionResult{
				Status:    "CE",
				TimeTaken: timeTaken,
				ErrorLog:  stderrStr,
			}, nil
		}
		return ExecutionResult{
			Status:    "RE",
			TimeTaken: timeTaken,
			ErrorLog:  stderrStr,
		}, nil
	}

	expected := strings.TrimSpace(sub.ExpectedOut)
	if stdoutStr == expected {
		return ExecutionResult{
			Status:    "AC",
			TimeTaken: timeTaken,
			Output:    stdoutStr,
		}, nil
	}

	return ExecutionResult{
		Status:    "WA",
		TimeTaken: timeTaken,
		Output:    stdoutStr,
		ErrorLog:  fmt.Sprintf("Expected:\n%s\n\nGot:\n%s", expected, stdoutStr),
	}, nil
}

func (dr *DockerRunner) Ping(ctx context.Context) (types.Ping, error) {
	return dr.cli.Ping(ctx)
}
