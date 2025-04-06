// src/middlewares/validate.ts
import { NextFunction, Request, Response } from "express";
import { ZodSchema, ZodError } from "zod";
import AppError from "../utils/appError";

export const validate =
  (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const message = err.errors
          .map((e) => `${e.path.join(".")}: ${e.message}`)
          .join(", ");
        return next(new AppError(message, 400));
      }
      next(err);
    }
  };
