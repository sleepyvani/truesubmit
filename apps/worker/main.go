package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"

	"truesubmit/worker/internal/pb"
	"truesubmit/worker/internal/queue"
	"truesubmit/worker/internal/sandbox"

	"github.com/joho/godotenv"
	"github.com/nats-io/nats.go"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

func main() {
	log.Println("Starting TrueSubmit Go Worker...")

	if err := godotenv.Load(); err != nil {
		log.Println("Warning: No .env file found, using defaults and OS environment variables")
	}

	natsURL := getEnv("APP_NATS_URL", "nats://127.0.0.1:4222")
	backendGrpcUrl := getEnv("APP_BACKEND_GRPC_URL", "127.0.0.1:50051")
	internalAuthToken := getEnv("APP_INTERNAL_AUTH_TOKEN", "secure_internal_token_for_communication")
	
	maxConcurrentStr := getEnv("SANDBOX_MAX_CONCURRENT", "8")
	maxConcurrent, err := strconv.Atoi(maxConcurrentStr)
	if err != nil || maxConcurrent <= 0 {
		maxConcurrent = 8
	}

	log.Printf("Configuration:\n - NATS URL: %s\n - gRPC Backend: %s\n - Max Concurrent Sandboxes: %d\n", 
		natsURL, backendGrpcUrl, maxConcurrent)

	runner, err := sandbox.NewDockerRunner()
	if err != nil {
		log.Fatalf("Failed to initialize Docker runner (Ensure Docker Desktop is running): %v", err)
	}
	log.Println("Docker runner initialized successfully.")

	listener, err := queue.NewQueueListener(natsURL, "submissions.created", "TRUESUBMIT", "worker-group")
	if err != nil {
		log.Fatalf("Failed to initialize NATS JetStream queue listener: %v", err)
	}
	defer listener.Close()
	log.Println("NATS JetStream queue listener connected.")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	conn, err := grpc.DialContext(ctx, backendGrpcUrl, 
		grpc.WithTransportCredentials(insecure.NewCredentials()),
		grpc.WithBlock(),
	)
	cancel()

	var grpcClient pb.SubmissionServiceClient
	if err != nil {
		log.Printf("Warning: Failed to connect to gRPC backend at %s: %v. Running in offline/log-only mode.\n", backendGrpcUrl, err)
	} else {
		defer conn.Close()
		grpcClient = pb.NewSubmissionServiceClient(conn)
		log.Println("gRPC client successfully connected to backend.")
	}

	sem := make(chan struct{}, maxConcurrent)

	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	workerCtx, workerCancel := context.WithCancel(context.Background())
	defer workerCancel()

	go func() {
		sig := <-sigChan
		log.Printf("Received signal %v. Initiating graceful shutdown...\n", sig)
		workerCancel()
	}()

	log.Println("Worker loop started, polling for jobs...")

	for {
		select {
		case <-workerCtx.Done():
			log.Println("Worker loop terminated. Goodbye!")
			return
		default:
			job, msg, err := listener.PopJob(workerCtx)
			if err != nil {
				if workerCtx.Err() != nil {
					return
				}
				log.Printf("Error popping job from NATS JetStream: %v. Retrying in 2 seconds...\n", err)
				time.Sleep(2 * time.Second)
				continue
			}

			if job == nil {
				continue
			}

			log.Printf("Received Submission #%s (%s)\n", job.SubmissionID, job.Language)

			sem <- struct{}{}
			go func(payload *queue.JobPayload, natsMsg *nats.Msg) {
				defer func() { <-sem }()
				processSubmission(workerCtx, runner, grpcClient, payload, natsMsg, internalAuthToken)
			}(job, msg)
		}
	}
}

func processSubmission(ctx context.Context, runner *sandbox.DockerRunner, grpcClient pb.SubmissionServiceClient, job *queue.JobPayload, natsMsg *nats.Msg, token string) {
	log.Printf("[Sub #%s] Processing starting...\n", job.SubmissionID)

	defer func() {
		if natsMsg != nil {
			if err := natsMsg.Ack(); err != nil {
				log.Printf("[Sub #%s] Failed to Ack message in NATS: %v\n", job.SubmissionID, err)
			} else {
				log.Printf("[Sub #%s] Successfully Acked NATS message.\n", job.SubmissionID)
			}
		}
	}()

	var finalStatus string = "AC"
	var totalTimeTaken time.Duration
	var detailedErrorLog string

	timeLimit := time.Duration(job.TimeLimitMs) * time.Millisecond
	if timeLimit <= 0 {
		timeLimit = 2000 * time.Millisecond
	}

	for idx, tc := range job.Testcases {
		sub := sandbox.Submission{
			ID:          job.SubmissionID,
			Code:        job.Code,
			Language:    sandbox.Language(job.Language),
			TimeLimit:   timeLimit,
			MemoryLimit: job.MemoryLimit,
			Input:       tc.Input,
			ExpectedOut: tc.Output,
		}

		res, err := runner.Execute(ctx, sub)
		if err != nil {
			log.Printf("[Sub #%s] Sandbox execution system error on testcase #%d: %v\n", job.SubmissionID, idx+1, err)
			finalStatus = "RE"
			detailedErrorLog = fmt.Sprintf("Sandbox runner error: %v", err)
			break
		}

		totalTimeTaken += res.TimeTaken

		log.Printf("[Sub #%s] Testcase #%d: Status=%s, TimeTaken=%v\n", job.SubmissionID, idx+1, res.Status, res.TimeTaken)

		if res.Status != "AC" {
			finalStatus = res.Status
			detailedErrorLog = res.ErrorLog
			break
		}
	}

	log.Printf("[Sub #%s] Final Verdict: Status=%s, TotalTime=%v\n", job.SubmissionID, finalStatus, totalTimeTaken)

	if grpcClient != nil {
		req := &pb.ReportResultRequest{
			SubmissionId: job.SubmissionID,
			Status:       finalStatus,
			TimeTakenMs:  totalTimeTaken.Milliseconds(),
			ErrorLog:     detailedErrorLog,
			Token:        token,
		}

		for retry := 1; retry <= 3; retry++ {
			resp, err := grpcClient.ReportResult(ctx, req)
			if err == nil && resp.Success {
				log.Printf("[Sub #%s] Successfully reported result to backend: %s\n", job.SubmissionID, resp.Message)
				break
			}
			log.Printf("[Sub #%s] Failed reporting result to backend (Attempt %d/3): %v\n", job.SubmissionID, retry, err)
			time.Sleep(1 * time.Second)
		}
	} else {
		log.Printf("[Sub #%s] Offline mode: Skipping gRPC report. Detailed Error Log (if any):\n%s\n", job.SubmissionID, detailedErrorLog)
	}
}

func getEnv(key, fallback string) string {
	if val, ok := os.LookupEnv(key); ok {
		return val
	}
	return fallback
}
