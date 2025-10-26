import { JobService } from "../services/job.service";
import { AppError } from "../utils/errors";
import { logger } from "../utils/logger";

interface JobFilters {
  status?: string;
  source_type?: string;
  page: number;
  limit: number;
}

interface QueueHealth {
  status: "healthy" | "degraded";
  queue_stats: {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  };
  job_latencies: {
    p50: number;
    p95: number;
    p99: number;
  };
  retry_counts: {
    total_retries: number;
    success_after_retry: number;
  };
  last_check: Date;
}

export class JobController {
  private jobService: JobService;

  constructor() {
    this.jobService = new JobService();
  }

  async getJobs(filters: JobFilters) {
    try {
      const result = await this.jobService.findJobs(filters);

      return {
        data: result.data,
        page: filters.page,
        limit: filters.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / filters.limit),
      };
    } catch (error) {
      logger.error("Failed to fetch jobs", { error, filters });
      throw new AppError("Failed to fetch jobs", 500);
    }
  }

  async retryJob(jobId: string) {
    try {
      const job = await this.jobService.findById(jobId);

      if (!job) {
        throw new AppError("Job not found", 404);
      }

      if (job.status !== "failed") {
        throw new AppError("Only failed jobs can be retried", 400);
      }

      if (job.retry_count >= 3) {
        throw new AppError("Maximum retry attempts exceeded", 400);
      }

      const updatedJob = await this.jobService.retryJob(job);

      return updatedJob;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error("Failed to retry job", { error, jobId });
      throw new AppError("Failed to retry job", 500);
    }
  }

  async getQueueHealth(): Promise<QueueHealth> {
    try {
      const stats = await this.jobService.getQueueStats();
      const latencies = await this.jobService.getJobLatencies();
      const retries = await this.jobService.getRetryStats();

      const status = this.determineQueueHealth(stats, latencies);

      return {
        status,
        queue_stats: stats,
        job_latencies: latencies,
        retry_counts: retries,
        last_check: new Date(),
      };
    } catch (error) {
      logger.error("Failed to get queue health", { error });
      throw new AppError("Failed to get queue health", 500);
    }
  }

  private determineQueueHealth(
    stats: QueueHealth["queue_stats"],
    latencies: QueueHealth["job_latencies"],
  ): "healthy" | "degraded" {
    // Queue is considered degraded if:
    // 1. More than 100 pending jobs
    // 2. More than 20% of jobs are failed
    // 3. p95 latency > 60 seconds
    const totalJobs =
      stats.pending + stats.processing + stats.completed + stats.failed;
    const failureRate = totalJobs > 0 ? stats.failed / totalJobs : 0;

    return stats.pending > 100 || failureRate > 0.2 || latencies.p95 > 60000
      ? "degraded"
      : "healthy";
  }
}
