import { DatabaseService } from "../services/database.service";
import { MonitoringService } from "../services/monitoring.service";
import { AppError } from "../utils/errors";
import { logger } from "../utils/logger";

export class HealthController {
  private dbService: DatabaseService;
  private monitoringService: MonitoringService;

  constructor() {
    this.dbService = new DatabaseService();
    this.monitoringService = new MonitoringService();
  }

  async getHealthStatus() {
    try {
      // Check database connection
      const dbStatus = await this.dbService.checkConnection();

      // Check monitoring services
      const serviceStatus = await this.monitoringService.getComponentStatus();

      // Aggregate component statuses
      const allComponents = {
        database: dbStatus ? "UP" : "DOWN",
        email_monitor: serviceStatus.emailMonitor,
        slack_monitor: serviceStatus.slackMonitor,
        zoom_monitor: serviceStatus.zoomMonitor,
        ai_workers: serviceStatus.aiWorkers,
      };

      // Calculate overall status
      const hasDown = Object.values(allComponents).includes("DOWN");
      const hasDegraded = Object.values(allComponents).includes("DEGRADED");
      const status = hasDown ? "DOWN" : hasDegraded ? "DEGRADED" : "UP";

      // Get any error messages
      const errors = Object.entries(serviceStatus.errors).map(
        ([component, error]) => `${component}: ${error}`,
      );

      return {
        status,
        timestamp: new Date().toISOString(),
        components: allComponents,
        version: process.env.APP_VERSION || "1.0.0",
        ...(errors.length > 0 && { errors }),
      };
    } catch (error) {
      logger.error("Failed to check health status", { error });
      throw new AppError("Health check failed", 500);
    }
  }
}
