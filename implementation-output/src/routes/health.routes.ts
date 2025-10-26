import express, { Router } from "express";
import { HealthController } from "../controllers/health.controller";
import { logger } from "../utils/logger";
import { rateLimit } from "../middleware/rate-limiter.middleware";

const router: Router = express.Router();
const healthController = new HealthController();

router.get(
  "/health",
  rateLimit({ max: 120, windowMs: 60000 }), // 120 requests per minute
  async (req, res) => {
    try {
      const healthStatus = await healthController.getHealthStatus();

      if (healthStatus.status === "UP" || healthStatus.status === "DEGRADED") {
        res.status(200).json(healthStatus);
      } else {
        res.status(503).json(healthStatus);
      }

      logger.info("Health check executed", {
        status: healthStatus.status,
        timestamp: healthStatus.timestamp,
      });
    } catch (error) {
      logger.error("Health check failed", { error });
      res.status(500).json({
        status: "DOWN",
        timestamp: new Date().toISOString(),
        error: "Health check failed",
      });
    }
  },
);

export default router;
