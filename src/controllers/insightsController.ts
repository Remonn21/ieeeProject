import catchAsync from "../utils/catchAsync";
import { NextFunction, Request, Response } from "express";

import AppError from "../utils/appError";
import { prisma } from "../lib/prisma";

export const getInsights = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const insights = await prisma.insight.findMany();

    res.status(200).json({
      status: "success",
      data: {
        total: insights.length,
        insights,
      },
    });
  }
);

export const createInsight = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { title, content, icon } = req.body;

    const existing = await prisma.insight.findFirst({
      where: {
        title,
      },
    });

    if (existing) {
      return next(new AppError("insight already exists", 400));
    }

    const insight = await prisma.insight.create({
      data: {
        content: content,
        title: title,
        icon: icon,
      },
    });

    res.status(201).json({
      status: "success",
      data: {
        insight,
      },
    });
  }
);

export const updateInsight = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const { title, content, icon } = req.body;

    const insight = await prisma.insight.findUnique({
      where: {
        id,
      },
    });

    if (!insight) {
      return next(new AppError("insight not found", 404));
    }

    const updatedInsight = await prisma.insight.update({
      where: {
        id,
      },
      data: {
        title,
        content,
        icon,
      },
    });

    res.status(201).json({
      status: "success",
      data: {
        updatedInsight,
      },
    });
  }
);

export const deleteInsight = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const insight = await prisma.insight.findUnique({
      where: {
        id,
      },
    });

    if (!insight) {
      return next(new AppError("insight not found", 404));
    }

    await prisma.insight.delete({
      where: {
        id,
      },
    });

    res.status(200).json({
      status: "success",
      message: "insight has been deleted successfully",
    });
  }
);
