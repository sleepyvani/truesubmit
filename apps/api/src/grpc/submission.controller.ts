import { Controller, Inject } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { POSTGRES_DB } from '../database/database.provider';
import * as schemas from '../database/schemas';

interface TestcaseResult {
  testcaseId: string;
  status: string;
  timeSpent: number;
  memorySpent: number;
}

interface ResultRequest {
  submissionId: string;
  status: string;
  score: number;
  totalTestcases: number;
  passedTestcases: number;
  testcaseResults: TestcaseResult[];
}

interface ResultResponse {
  success: boolean;
  message: string;
}

@Controller()
export class SubmissionController {
  constructor(
    @Inject(POSTGRES_DB) private readonly db: NodePgDatabase<typeof schemas>
  ) {}

  @GrpcMethod('SubmissionService', 'ReportResult')
  async reportResult(data: ResultRequest): Promise<ResultResponse> {
    const { submissionId, status, score } = data;

    try {
      // Mock logic cập nhật kết quả chấm bài vào PostgreSQL bằng Drizzle
      // và broadcast realtime cho sinh viên qua SSE
      console.log(`[gRPC] Received report for submission ${submissionId}: ${status} with score ${score}`);

      return {
        success: true,
        message: 'Result reported successfully to backend database',
      };
    } catch (error) {
      console.error('[gRPC] Failed to report submission result:', error);
      return {
        success: false,
        message: `Error reporting result: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }
}
