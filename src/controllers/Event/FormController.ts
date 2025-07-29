import catchAsync from "../../utils/catchAsync";
import { NextFunction, Request, Response } from "express";

import AppError from "../../utils/appError";

import { prisma } from "../../lib/prisma";

export const getEventForms = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const forms = await prisma.customForm.findMany({
      where: {
        eventId: id,
      },
      include: {
        fields: true,
      },
    });

    res.status(200).json({
      status: "success",
      data: { forms },
    });
  }
);

export const getFormDetails = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { formId } = req.params;

    const form = await prisma.customForm.findUnique({
      where: {
        id: formId,
      },
      include: {
        fields: true,
      },
    });

    if (!form) {
      return next(new AppError("form not found", 400));
    }

    res.status(200).json({
      status: "success",
      data: {
        form,
      },
    });
  }
);
