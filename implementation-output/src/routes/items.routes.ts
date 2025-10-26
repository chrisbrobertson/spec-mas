import express, { Router, Request, Response, NextFunction } from "express";
import { body, query, validationResult } from "express-validator";
import { ItemController } from "../controllers/item.controller";
import { rateLimiter } from "../middleware/rate-limiter.middleware";
import { AppError } from "../utils/errors";
import { logger } from "../utils/logger";

const router: Router = express.Router();
const itemController = new ItemController();

router.post(
  "/items",
  rateLimiter({ max: 50, windowMs: 60000 }),
  [
    body("type")
      .isIn(["ask", "commitment", "action"])
      .withMessage("type must be ask, commitment, or action"),
    body("title")
      .trim()
      .notEmpty()
      .isLength({ min: 1, max: 200 })
      .withMessage("title must be between 1 and 200 characters"),
    body("description")
      .trim()
      .notEmpty()
      .isLength({ min: 1, max: 2000 })
      .withMessage("description must be between 1 and 2000 characters"),
    body("priority")
      .isIn(["low", "medium", "high"])
      .withMessage("priority must be low, medium, or high"),
    body("responsiblePersonId")
      .notEmpty()
      .withMessage("responsiblePersonId is required"),
    body("sourceType")
      .isIn(["email", "slack", "zoom"])
      .withMessage("sourceType must be email, slack, or zoom"),
    body("sourceId").notEmpty().withMessage("sourceId is required"),
    body("confidenceScore")
      .isFloat({ min: 0, max: 1 })
      .withMessage("confidenceScore must be between 0 and 1"),
    body("dueDate")
      .optional()
      .isISO8601()
      .withMessage("dueDate must be a valid ISO 8601 date"),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError("Validation failed", 400, errors.array());
      }

      const item = await itemController.createItem(req.body);

      logger.info("Item created", {
        itemId: item.id,
        type: item.type,
        confidence: item.confidenceScore,
      });

      res.status(201).json({
        success: true,
        data: item,
      });
    } catch (error) {
      next(error);
    }
  },
);

router.get(
  "/items",
  rateLimiter({ max: 100, windowMs: 60000 }),
  [
    query("status")
      .optional()
      .isIn(["pending", "in_progress", "completed", "cancelled"])
      .withMessage("invalid status"),
    query("priority")
      .optional()
      .isIn(["low", "medium", "high"])
      .withMessage("invalid priority"),
    query("type")
      .optional()
      .isIn(["ask", "commitment", "action"])
      .withMessage("invalid type"),
    query("responsiblePersonId")
      .optional()
      .isString()
      .withMessage("invalid responsiblePersonId"),
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("limit must be between 1 and 100"),
    query("includeArchived")
      .optional()
      .isBoolean()
      .withMessage("includeArchived must be a boolean"),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError("Validation failed", 400, errors.array());
      }

      const filters = {
        status: req.query.status as string | undefined,
        priority: req.query.priority as string | undefined,
        type: req.query.type as string | undefined,
        responsiblePersonId: req.query.responsiblePersonId as
          | string
          | undefined,
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 25,
        includeArchived: req.query.includeArchived === "true",
      };

      const result = await itemController.getItems(filters);

      res.status(200).json({
        success: true,
        data: result.items,
        pagination: {
          page: filters.page,
          limit: filters.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / filters.limit),
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/items/:itemId/relationships",
  rateLimiter({ max: 50, windowMs: 60000 }),
  [
    body("parentItemId").notEmpty().withMessage("parentItemId is required"),
    body("childItemId").notEmpty().withMessage("childItemId is required"),
    body("relationshipType")
      .isIn(["ask_to_commitment", "commitment_to_action"])
      .withMessage(
        "relationshipType must be ask_to_commitment or commitment_to_action",
      ),
    body("confidenceScore")
      .isFloat({ min: 0, max: 1 })
      .withMessage("confidenceScore must be between 0 and 1"),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError("Validation failed", 400, errors.array());
      }

      const relationship = await itemController.createRelationship(req.body);

      logger.info("Relationship created", {
        parentItemId: relationship.parentItemId,
        childItemId: relationship.childItemId,
        type: relationship.relationshipType,
      });

      res.status(201).json({
        success: true,
        data: relationship,
      });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
