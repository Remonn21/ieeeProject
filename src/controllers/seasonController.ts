import { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import AppError from "../utils/appError";
import catchAsync from "../utils/catchAsync";

export const createSeason = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { startDate, endDate, name } = req.body;

    const isOverlapping = await prisma.season.findFirst({
      where: {
        AND: [
          { startDate: { lte: new Date(endDate) } },
          { endDate: { gte: new Date(startDate) } },
        ],
      },
    });

    if (isOverlapping) {
      return next(new AppError("Season time overlaps with another season.", 400));
    }

    const season = await prisma.season.create({
      data: {
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      },
    });

    res.status(201).json({
      status: "success",
      data: { season },
    });
  }
);

export const getAllSeasons = catchAsync(async (_req: Request, res: Response) => {
  const seasons = await prisma.season.findMany({
    orderBy: { startDate: "desc" },
  });

  res.status(200).json({
    status: "success",
    results: seasons.length,
    data: { seasons },
  });
});

export const getSeason = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const season = await prisma.season.findUnique({
      where: { id },
      include: {
        board: true,
      },
    });

    if (!season) {
      return next(new AppError("Season not found.", 404));
    }

    res.status(200).json({
      status: "success",
      data: { season },
    });
  }
);

export const updateSeason = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { name, startDate, endDate } = req.body;

    const existing = await prisma.season.findUnique({ where: { id } });
    if (!existing) {
      return next(new AppError("Season not found.", 404));
    }

    const isOverlapping = await prisma.season.findFirst({
      where: {
        AND: [
          { id: { not: id } },
          { startDate: { lte: new Date(endDate) } },
          { endDate: { gte: new Date(startDate) } },
        ],
      },
    });

    if (isOverlapping) {
      return next(new AppError("Updated season overlaps with another season.", 400));
    }

    const updatedSeason = await prisma.season.update({
      where: { id },
      data: {
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      },
    });

    res.status(200).json({
      status: "success",
      data: { season: updatedSeason },
    });
  }
);

export const deleteSeason = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const existing = await prisma.season.findUnique({ where: { id } });
    if (!existing) {
      return next(new AppError("Season not found.", 404));
    }

    await prisma.season.delete({ where: { id } });

    res.status(204).json({ status: "success", data: null });
  }
);
