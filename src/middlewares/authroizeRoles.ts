import { NextFunction, Request, Response } from "express";
import AppError from "../utils/appError";
import { Role } from "@prisma/client";

export const authorizeRoles = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user || !allowedRoles.includes(user.seasonMemberships?.at(-1)?.role as string)) {
      return next(new AppError("access denied", 403));
    }

    next();
  };
};
