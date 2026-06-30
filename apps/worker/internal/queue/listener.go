package queue

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

type Testcase struct {
	Input  string `json:"input"`
	Output string `json:"output"`
}

type JobPayload struct {
	SubmissionID string     `json:"submissionId"`
	Code         string     `json:"code"`
	Language     string     `json:"language"`
	TimeLimitMs  int64      `json:"timeLimitMs"`
	MemoryLimit  int64      `json:"memoryLimitMb"`
	Testcases    []Testcase `json:"testcases"`
}

type QueueListener struct {
	rdb      *redis.Client
	queueKey string
}

func NewQueueListener(connStr string, queueKey string) (*QueueListener, error) {
	opts, err := redis.ParseURL(connStr)
	if err != nil {
		return nil, fmt.Errorf("failed to parse redis url: %w", err)
	}

	rdb := redis.NewClient(opts)
	return &QueueListener{
		rdb:      rdb,
		queueKey: queueKey,
	}, nil
}

func (ql *QueueListener) Close() error {
	return ql.rdb.Close()
}

func (ql *QueueListener) PopJob(ctx context.Context) (*JobPayload, error) {
	results, err := ql.rdb.BRPop(ctx, 5*time.Second, ql.queueKey).Result()
	if err != nil {
		if err == redis.Nil {
			return nil, nil
		}
		return nil, err
	}

	if len(results) < 2 {
		return nil, fmt.Errorf("unexpected brpop response length")
	}

	var payload JobPayload
	if err := json.Unmarshal([]byte(results[1]), &payload); err != nil {
		return nil, fmt.Errorf("failed to parse job json: %w", err)
	}

	return &payload, nil
}
