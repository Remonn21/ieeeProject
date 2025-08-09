import { NextFunction, Request, Response } from "express";
import AppError from "../utils/appError";

export const isSuperAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = req.user;

  if (
    !user ||
    !user.internalRoleId ||
    (user.seasonMemberships[0].role !== "HEAD" &&
      user.seasonMemberships[0].role !== "EXCOM")
  ) {
    return next(new AppError("Access restricted to internal users only", 403));
  }

  next();
};
