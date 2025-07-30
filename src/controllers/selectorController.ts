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

export const getMembersSelector = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { query, paginated } = req.query;

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 15;
    const skip = (page - 1) * limit;

    const filters: any = {
      // role: {
      //   not: "ATTENDEE",
      // },
    };

    if (query) {
      filters.OR = [
        {
          name: {
            contains: query,
            mode: "insensitive",
          },
        },
      ];
    }

    const members = await prisma.user.findMany({
      where: filters,
      select: {
        id: true,
        name: true,
      },
      skip,
      take: limit,
    });

    res.status(200).json({
      status: "success",
      data: {
        members,
      },
    });
  }
);
