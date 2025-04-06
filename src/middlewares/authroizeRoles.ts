import { NextFunction, Request, Response } from "express";
import AppError from "../utils/appError";
import { Role } from "@prisma/client";

export const authorizeRoles = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    console.log("ROLE", req.user?.roles);
    if (!user || !allowedRoles.some((role) => user.roles.includes(role as Role))) {
      return next(new AppError("access denied", 403));
    }

    next();
  };
};
