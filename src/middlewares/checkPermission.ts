import { Request, Response, NextFunction } from "express";
import AppError from "../utils/appError";
import { prisma } from "../lib/prisma";
import { getCurrentSeason } from "../lib/season";

type UserType = "internal" | "company";

export const checkPermission = (requiredPermission: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return next(new AppError("Unauthorized", 403));
      }

      const currentSeason = await getCurrentSeason();

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          seasonMemberships: {
            where: {
              seasonId: currentSeason.id,
            },
          },
          internalRole: {
            include: {
              permissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      });

      if (!user) {
        return next(new AppError("User not found", 404));
      }

      if (
        (user.seasonMemberships[0].role !== "HEAD" &&
          user.seasonMemberships[0].role !== "EXCOM") ||
        !user.internalRole
      ) {
        return next(new AppError("Access denied. this link is only for admins", 403));
      }

      const permissions = user.internalRole.permissions.map((p) => p.permission.name);
      if (!permissions.includes(requiredPermission)) {
        return next(new AppError("Forbidden (missing permission)", 403));
      }

      next();
    } catch (error) {
      console.error("checkPermission error:", error);
      return next(new AppError("Internal Server Error", 500));
    }
  };
};
