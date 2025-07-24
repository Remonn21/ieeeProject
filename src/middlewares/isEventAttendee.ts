// middlewares/isAcceptedForEventAccess.ts
import { Request, Response, NextFunction } from "express";
import AppError from "../utils/appError";
import { prisma } from "../lib/prisma";
import catchAsync from "../utils/catchAsync";

export const isAcceptedForEventAccess = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;

    const { eventId } = req.params;

    // if (!eventId && req.body.menuId) {
    //   const menu = await prisma.foodMenu.findUnique({
    //     where: { id: req.body.menuId },
    //   });
    //   if (!menu) {
    //     return next(new AppError("Invalid food menu", 400));
    //   }
    //   eventId = menu.eventId;
    // }

    // if (!eventId) {
    //   return next(new AppError("Event ID is required for this action", 400));
    // }

    const registration = await prisma.eventRegistration.findFirst({
      where: {
        userId,
        eventId,
        status: "accepted",
      },
    });

    if (!registration) {
      return next(
        new AppError(
          "Access denied. You must be registered and accepted for this event.",
          403
        )
      );
    }

    next();
  }
);
