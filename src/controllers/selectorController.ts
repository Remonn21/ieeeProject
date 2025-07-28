import catchAsync from "../utils/catchAsync";
import { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import AppError from "../utils/appError";

export const getSeasonSelector = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { query } = req.query;

    const seasons = await prisma.season.findMany({
      where: {
        name: {
          contains: String(query || ""),
        },
      },
      select: {
        id: true,
        name: true,
      },
    });

    res.status(200).json({
      status: "success",
      data: {
        seasons,
      },
    });
  }
);
