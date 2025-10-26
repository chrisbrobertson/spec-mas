import express, { Router, Request, Response, NextFunction } from "express";
import { body, query, validationResult } from "express-validator";
import { JobController } from "../controllers/job.controller";
import { rateLimiter } from "../middleware/rate-limiter.middleware";
import { AppError } from "../utils/errors";
import { logger } from "../utils/logger";

const router: Router = express.Router();
const jobController = new JobController();

/**
 * GET /api/jobs
 * Retrieve jobs with filtering and pagination
 */
router.get(
  "/jobs",
  rateLimiter({ max: 100, windowMs: 60000 }),
  [
    query("status")
      .optional()
      .isIn(["pending", "processing", "completed", "failed"])
      .withMessage("Invalid status value"),
    query("source_type")
      .optional()
      .isIn(["email", "slack", "zoom"])
      .withMessage("Invalid source type"),
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be between 1 and 100"),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError("Validation failed", 400, errors.array());
      }

      const { status, source_type } = req.query;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit
        ? parseInt(req.query.limit as string, 10)
        : 20;

      const result = await jobController.getJobs({
        status: status as string | undefined,
        source_type: source_type as string | undefined,
        page,
        limit,
      });

      logger.info("Jobs retrieved", {
        filters: { status, source_type },
        page,
        limit,
        resultCount: result.data.length,
      });

      res.status(200).json({
        success: true,
        data: result.data,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * POST /api/jobs/retry
 * Retry a failed job
 */
router.post(
  "/jobs/:id/retry",
  rateLimiter({ max: 20, windowMs: 60000 }),
  [body("id").isUUID().withMessage("Invalid job ID format")],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError("Validation failed", 400, errors.array());
      }

      const jobId = req.params.id;
      const job = await jobController.retryJob(jobId);

      logger.info("Job retry initiated", {
        jobId,
        source_type: job.job_type,
      });

      res.status(200).json({
        success: true,
        data: job,
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * GET /api/health/jobs
 * Get job queue health metrics
 */
router.get(
  "/health/jobs",
  rateLimiter({ max: 60, windowMs: 60000 }),
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const health = await jobController.getQueueHealth();

      res.status(200).json({
        success: true,
        data: {
          queue_stats: health.queue_stats,
          job_latencies: health.job_latencies,
          retry_counts: health.retry_counts,
          component_status: health.status === "healthy" ? "UP" : "DEGRADED",
          last_check: health.last_check,
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
