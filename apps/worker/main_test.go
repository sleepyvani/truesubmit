package main

import (
	"context"
	"testing"
	"time"

	"truesubmit/worker/internal/sandbox"
)

func TestDockerRunnerCPP(t *testing.T) {
	runner, err := sandbox.NewDockerRunner()
	if err != nil {
		t.Skip("Docker is not available: skipping Docker execution test")
	}

	ctx := context.Background()
	if _, err := runner.Ping(ctx); err != nil {
		t.Skip("Docker daemon is not running: skipping Docker execution test")
	}

	sub := sandbox.Submission{
		ID:          "test-cpp-1",
		Code:        `#include <iostream>
using namespace std;
int main() {
    int a, b;
    if (cin >> a >> b) {
        cout << a + b << endl;
    }
    return 0;
}`,
		Language:    sandbox.LangCPP,
		TimeLimit:   2 * time.Second,
		MemoryLimit: 256,
		Input:       "15 25",
		ExpectedOut: "40",
	}

	res, err := runner.Execute(ctx, sub)
	if err != nil {
		t.Fatalf("Failed to execute submission: %v", err)
	}

	if res.Status != "AC" {
		t.Errorf("Expected status AC, got %s. Stderr/Error Log:\n%s", res.Status, res.ErrorLog)
	}
}

func TestDockerRunnerPython(t *testing.T) {
	runner, err := sandbox.NewDockerRunner()
	if err != nil {
		t.Skip("Docker is not available: skipping Docker execution test")
	}

	ctx := context.Background()
	if _, err := runner.Ping(ctx); err != nil {
		t.Skip("Docker daemon is not running: skipping Docker execution test")
	}

	sub := sandbox.Submission{
		ID:          "test-py-1",
		Code:        `import sys
input_data = sys.stdin.read().split()
if len(input_data) >= 2:
    print(int(input_data[0]) * int(input_data[1]))
`,
		Language:    sandbox.LangPython,
		TimeLimit:   2 * time.Second,
		MemoryLimit: 256,
		Input:       "6 7",
		ExpectedOut: "42",
	}

	res, err := runner.Execute(ctx, sub)
	if err != nil {
		t.Fatalf("Failed to execute submission: %v", err)
	}

	if res.Status != "AC" {
		t.Errorf("Expected status AC, got %s. Stderr/Error Log:\n%s", res.Status, res.ErrorLog)
	}
}
