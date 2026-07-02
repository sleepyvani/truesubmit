package sandbox

import (
	"archive/tar"
	"bytes"
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"io"
	"log"
	"os"
	"strconv"
	"strings"
	"sync"
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
	Status     string
	TimeTaken  time.Duration
	Output     string
	ErrorLog   string
}

type Submission struct {
	ID          string
	Code        string
	Language    Language
	TimeLimit   time.Duration
	MemoryLimit int64
	Input       string
	ExpectedOut string
}

type WarmContainer struct {
	ID          string
	Language    Language
	MemoryLimit int64
}

type DockerRunner struct {
	cli           *client.Client
	pools         map[Language]chan WarmContainer
	maxPoolSize   int
	mu            sync.Mutex
}

func NewDockerRunner() (*DockerRunner, error) {
	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		return nil, err
	}

	maxConcurrentStr := os.Getenv("SANDBOX_MAX_CONCURRENT")
	maxConcurrent := 8
	if maxConcurrentStr != "" {
		if val, err := strconv.Atoi(maxConcurrentStr); err == nil && val > 0 {
			maxConcurrent = val
		}
	}

	pools := make(map[Language]chan WarmContainer)
	languages := []Language{LangC, LangCPP, LangCS, LangJava, LangPython, LangGo, LangZig}
	for _, lang := range languages {
		pools[lang] = make(chan WarmContainer, maxConcurrent)
	}

	return &DockerRunner{
		cli:         cli,
		pools:       pools,
		maxPoolSize: maxConcurrent,
	}, nil
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

func (dr *DockerRunner) createWarmContainer(ctx context.Context, lang Language, memLimitMb int64) (WarmContainer, error) {
	imageName := GetImageForLanguage(lang)

	_, _, err := dr.cli.ImageInspectWithRaw(ctx, imageName)
	if err != nil {
		log.Printf("[Pool] Image %s not found locally. Pulling...\n", imageName)
		reader, err := dr.cli.ImagePull(ctx, imageName, types.ImagePullOptions{})
		if err != nil {
			return WarmContainer{}, fmt.Errorf("failed to pull image %s: %w", imageName, err)
		}
		defer reader.Close()
		_, _ = io.Copy(io.Discard, reader)
	}

	memLimit := memLimitMb * 1024 * 1024
	if memLimit <= 0 {
		memLimit = 256 * 1024 * 1024
	}

	config := &container.Config{
		Image:           imageName,
		Cmd:             []string{"sleep", "infinity"},
		NetworkDisabled: true,
		WorkingDir:      "/workspace",
	}

	hostConfig := &container.HostConfig{
		Resources: container.Resources{
			Memory:    memLimit,
			CPUShares: 512,
		},
		Tmpfs: map[string]string{
			"/workspace": "rw,noexec,nosuid,size=64m",
		},
	}

	randomName := fmt.Sprintf("truesubmit-warm-%s-%s", string(lang), generateRandomHex(8))
	resp, err := dr.cli.ContainerCreate(ctx, config, hostConfig, nil, nil, randomName)
	if err != nil {
		return WarmContainer{}, fmt.Errorf("failed to create warm container: %w", err)
	}

	err = dr.cli.ContainerStart(ctx, resp.ID, types.ContainerStartOptions{})
	if err != nil {
		_ = dr.cli.ContainerRemove(ctx, resp.ID, types.ContainerRemoveOptions{Force: true})
		return WarmContainer{}, fmt.Errorf("failed to start warm container: %w", err)
	}

	log.Printf("[Pool] Created new warm container for %s (ID: %s, Mem: %d MB)\n", lang, resp.ID[:12], memLimitMb)
	return WarmContainer{
		ID:          resp.ID,
		Language:    lang,
		MemoryLimit: memLimitMb,
	}, nil
}

func (dr *DockerRunner) getContainer(ctx context.Context, lang Language, memLimit int64) (WarmContainer, error) {
	pool, exists := dr.pools[lang]
	if !exists {
		return dr.createWarmContainer(ctx, lang, memLimit)
	}

	for {
		select {
		case wc := <-pool:
			if wc.MemoryLimit == memLimit {
				inspect, err := dr.cli.ContainerInspect(ctx, wc.ID)
				if err == nil && inspect.State.Running {
					return wc, nil
				}
			}
			log.Printf("[Pool] Discarding stale/mismatched container %s\n", wc.ID[:12])
			_ = dr.destroyContainer(ctx, wc.ID)
		default:
			return dr.createWarmContainer(ctx, lang, memLimit)
		}
	}
}

func (dr *DockerRunner) returnContainer(ctx context.Context, wc WarmContainer) {
	pool, exists := dr.pools[wc.Language]
	if !exists {
		_ = dr.destroyContainer(ctx, wc.ID)
		return
	}

	cleanupCmd := []string{"sh", "-c", "rm -rf /workspace/*"}
	execConfig := types.ExecConfig{
		AttachStdout: false,
		AttachStderr: false,
		Cmd:          cleanupCmd,
	}
	execID, err := dr.cli.ContainerExecCreate(ctx, wc.ID, execConfig)
	if err == nil {
		_ = dr.cli.ContainerExecStart(ctx, execID.ID, types.ExecStartCheck{})
	}

	select {
	case pool <- wc:
	default:
		log.Printf("[Pool] Pool full for %s, destroying container %s\n", wc.Language, wc.ID[:12])
		_ = dr.destroyContainer(ctx, wc.ID)
	}
}

func (dr *DockerRunner) destroyContainer(ctx context.Context, id string) error {
	stopTimeout := 0
	_ = dr.cli.ContainerStop(ctx, id, container.StopOptions{Timeout: &stopTimeout})
	return dr.cli.ContainerRemove(ctx, id, types.ContainerRemoveOptions{Force: true})
}

func createTarArchive(fileName, codeContent, inputContent string) (io.Reader, error) {
	var buf bytes.Buffer
	tw := tar.NewWriter(&buf)

	hdr := &tar.Header{
		Name: fileName,
		Mode: 0644,
		Size: int64(len(codeContent)),
	}
	if err := tw.WriteHeader(hdr); err != nil {
		return nil, err
	}
	if _, err := tw.Write([]byte(codeContent)); err != nil {
		return nil, err
	}

	hdrInput := &tar.Header{
		Name: "input.txt",
		Mode: 0644,
		Size: int64(len(inputContent)),
	}
	if err := tw.WriteHeader(hdrInput); err != nil {
		return nil, err
	}
	if _, err := tw.Write([]byte(inputContent)); err != nil {
		return nil, err
	}

	if err := tw.Close(); err != nil {
		return nil, err
	}

	return &buf, nil
}

func (dr *DockerRunner) Execute(ctx context.Context, sub Submission) (ExecutionResult, error) {
	wc, err := dr.getContainer(ctx, sub.Language, sub.MemoryLimit)
	if err != nil {
		return ExecutionResult{Status: "RE", ErrorLog: fmt.Sprintf("failed to acquire container: %v", err)}, nil
	}

	fileName := "source"
	var compileAndRunCmd string

	switch sub.Language {
	case LangC:
		fileName = "main.c"
		compileAndRunCmd = "gcc -O3 /workspace/main.c -o /workspace/main && /workspace/main < /workspace/input.txt"
	case LangCPP:
		fileName = "main.cpp"
		compileAndRunCmd = "g++ -O3 /workspace/main.cpp -o /workspace/main && /workspace/main < /workspace/input.txt"
	case LangCS:
		fileName = "Program.cs"
		compileAndRunCmd = "dotnet new console -o /workspace/app --no-restore && cp /workspace/Program.cs /workspace/app/Program.cs && dotnet run --project /workspace/app < /workspace/input.txt"
	case LangJava:
		fileName = "Main.java"
		compileAndRunCmd = "javac /workspace/Main.java -d /workspace && java -cp /workspace Main < /workspace/input.txt"
	case LangPython:
		fileName = "main.py"
		compileAndRunCmd = "python /workspace/main.py < /workspace/input.txt"
	case LangGo:
		fileName = "main.go"
		compileAndRunCmd = "go build -o /workspace/main /workspace/main.go && /workspace/main < /workspace/input.txt"
	case LangZig:
		fileName = "main.zig"
		compileAndRunCmd = "zig build-exe -O ReleaseSafe --name /workspace/main /workspace/main.zig && /workspace/main < /workspace/input.txt"
	default:
		dr.returnContainer(ctx, wc)
		return ExecutionResult{}, fmt.Errorf("unsupported language: %s", sub.Language)
	}

	tarStream, err := createTarArchive(fileName, sub.Code, sub.Input)
	if err != nil {
		dr.returnContainer(ctx, wc)
		return ExecutionResult{}, fmt.Errorf("failed to create tar archive: %w", err)
	}

	err = dr.cli.CopyToContainer(ctx, wc.ID, "/workspace", tarStream, types.CopyToContainerOptions{})
	if err != nil {
		dr.returnContainer(ctx, wc)
		return ExecutionResult{}, fmt.Errorf("failed to copy files to container: %w", err)
	}

	execConfig := types.ExecConfig{
		AttachStdout: true,
		AttachStderr: true,
		Cmd:          []string{"sh", "-c", compileAndRunCmd},
		User:         "nobody",
	}

	execIDResp, err := dr.cli.ContainerExecCreate(ctx, wc.ID, execConfig)
	if err != nil {
		dr.returnContainer(ctx, wc)
		return ExecutionResult{Status: "RE", ErrorLog: fmt.Sprintf("failed to create exec session: %v", err)}, nil
	}

	timeout := sub.TimeLimit
	if timeout <= 0 {
		timeout = 2 * time.Second
	}

	execCtx, execCancel := context.WithTimeout(ctx, timeout)
	defer execCancel()

	startTime := time.Now()
	resp, err := dr.cli.ContainerExecAttach(execCtx, execIDResp.ID, types.ExecStartCheck{})
	if err != nil {
		_ = dr.destroyContainer(ctx, wc.ID)
		if execCtx.Err() == context.DeadlineExceeded {
			return ExecutionResult{
				Status:    "TLE",
				TimeTaken: timeout,
				ErrorLog:  "Time Limit Exceeded",
			}, nil
		}
		return ExecutionResult{Status: "RE", ErrorLog: fmt.Sprintf("exec execution failed: %v", err)}, nil
	}
	defer resp.Close()

	var stdoutBuf, stderrBuf bytes.Buffer
	outputDone := make(chan error, 1)
	go func() {
		_, copyErr := stdcopy.StdCopy(&stdoutBuf, &stderrBuf, resp.Reader)
		outputDone <- copyErr
	}()

	var status string
	var timeTaken time.Duration

	select {
	case <-execCtx.Done():
		_ = dr.destroyContainer(ctx, wc.ID)
		return ExecutionResult{
			Status:    "TLE",
			TimeTaken: timeout,
			ErrorLog:  "Time Limit Exceeded",
		}, nil
	case copyErr := <-outputDone:
		timeTaken = time.Since(startTime)
		if copyErr != nil {
			status = "RE"
		} else {
			inspectResp, inspectErr := dr.cli.ContainerExecInspect(ctx, execIDResp.ID)
			if inspectErr != nil || inspectResp.ExitCode != 0 {
				status = "RE"
			} else {
				status = "RUN_SUCCESS"
			}
		}
	}

	stdoutStr := strings.TrimSpace(stdoutBuf.String())
	stderrStr := strings.TrimSpace(stderrBuf.String())

	if status == "RE" {
		isCE := strings.Contains(stderrStr, "error:") || strings.Contains(stderrStr, "Compile Error") || strings.Contains(stderrStr, "Compilation failed")
		dr.returnContainer(ctx, wc)
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
	dr.returnContainer(ctx, wc)

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

func generateRandomHex(n int) string {
	bytes := make([]byte, n/2)
	if _, err := rand.Read(bytes); err != nil {
		return fmt.Sprintf("%08x", time.Now().UnixNano())
	}
	return hex.EncodeToString(bytes)
}
