package queue

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/nats-io/nats.go"
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
	nc  *nats.Conn
	js  nats.JetStreamContext
	sub *nats.Subscription
}

func NewQueueListener(natsURL string, subject string, streamName string, durableName string) (*QueueListener, error) {
	nc, err := nats.Connect(natsURL)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to NATS: %w", err)
	}

	js, err := nc.JetStream()
	if err != nil {
		nc.Close()
		return nil, fmt.Errorf("failed to get JetStream context: %w", err)
	}

	sub, err := js.PullSubscribe(subject, durableName, nats.BindStream(streamName))
	if err != nil {
		nc.Close()
		return nil, fmt.Errorf("failed to subscribe to NATS JetStream: %w", err)
	}

	return &QueueListener{
		nc:  nc,
		js:  js,
		sub: sub,
	}, nil
}

func (ql *QueueListener) Close() error {
	ql.nc.Close()
	return nil
}

func (ql *QueueListener) PopJob(ctx context.Context) (*JobPayload, *nats.Msg, error) {
	msgs, err := ql.sub.Fetch(1, nats.Context(ctx))
	if err != nil {
		if err == context.Canceled || err == context.DeadlineExceeded || err == nats.ErrTimeout {
			return nil, nil, nil
		}
		return nil, nil, err
	}

	if len(msgs) == 0 {
		return nil, nil, nil
	}

	msg := msgs[0]
	var payload JobPayload
	if err := json.Unmarshal(msg.Data, &payload); err != nil {
		msg.Nak()
		return nil, nil, fmt.Errorf("failed to parse job json: %w", err)
	}

	return &payload, msg, nil
}
