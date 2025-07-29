import { NextFunction, Request, Response } from "express";

import AppError from "../utils/appError";
import { Prisma } from "@prisma/client";

const handleDuplicateFieldsDB = (target: string) => {
  const message = `"${target}" already exists. please use another valie!`;
  return new AppError(message, 400);
};

const handleJWTError = () => new AppError("Invalid token, please log in again", 401);

const handleJWTExpiredError = () =>
  new AppError("Your token has expired! please log in again.", 401);

const sendErrorProd = (err: AppError, req: Request, res: Response) => {
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }
  console.log("ERROR 💣💣", err);

  return res.status(500).json({
    status: "error",
    message: "Something went wrong!",
  });
};

const sendErrorDev = (err: AppError, req: Request, res: Response) => {
  console.log(err);
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    error: err,
    stack: err.stack,
  });
};

export default function (err: any, req: Request, res: Response, next: NextFunction) {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";
  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === "production") {
    let error = { ...err, message: err.message };

    if (err instanceof Prisma.PrismaClientValidationError) {
      error = new AppError("Invalid data input. Please check your request fields.", 400);
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2002") {
        const target = (err.meta?.target as string[])?.join(", ");
        error = handleDuplicateFieldsDB(target);
      }
      if (err.code === "P2003") {
        const field = err.meta?.field_name || "related record";
        error = new AppError(
          `Invalid reference: ${field} not found or does not exist.`,
          400
        );
      }

      if (err.code === "P2025") {
        error = new AppError(
          `Operation failed: the record you're trying to modify doesn't exist.`,
          404
        );
      }
    }

    if (err.name === "JsonWebTokenError") error = handleJWTError();
    if (err.name === "TokenExpiredError") error = handleJWTExpiredError();

    sendErrorProd(error, req, res);
  }
}
