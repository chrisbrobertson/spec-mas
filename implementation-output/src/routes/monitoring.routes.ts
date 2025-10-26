import express, { Router } from "express";
import { body, validationResult } from "express-validator";
import { MonitoringController } from "../controllers/monitoring.controller";
import { rateLimit } from "../middleware/rate-limiter.middleware";
import { AppError } from "../utils/errors";
import { logger } from "../utils/logger";

const router: Router = express.Router();
const monitoringController = new MonitoringController();

// Get monitoring service status
router.get(
  "/monitoring/services",
  rateLimit({ max: 60, windowMs: 60000 }), // 60 requests per minute
  async (req, res, next) => {
    try {
      const serviceStatus = await monitoringController.getServicesStatus();

      logger.info("Retrieved monitoring service status");

      res.status(200).json({
        success: true,
        data: serviceStatus,
      });
    } catch (error) {
      next(error);
    }
  },
);

// Toggle monitoring service
router.post(
  "/monitoring/services/:service/toggle",
  rateLimit({ max: 10, windowMs: 60000 }), // 10 requests per minute
  [body("enabled").isBoolean().withMessage("enabled must be a boolean value")],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError("Validation failed", 400, errors.array());
      }

      const { service } = req.params;
      const { enabled } = req.body;

      const result = await monitoringController.toggleService(service, enabled);

      logger.info("Toggled monitoring service", {
        service,
        enabled,
        success: result.success,
      });

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },
);

export default router;
