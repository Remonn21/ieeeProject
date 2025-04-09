import catchAsync from "../utils/catchAsync";
import { NextFunction, Request, Response } from "express";

import AppError from "../utils/appError";
import { prisma } from "../lib/prisma";
import { handleNormalUploads } from "../utils/handleNormalUpload";

export const getSpeakers = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { search } = req.query;

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 1;
    const skip = (page - 1) * limit;

    const filters: any = {};

    if (search) filters.name = { contains: search, mode: "insensitive" };

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where: filters,
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.post.count({
        where: filters,
      }),
    ]);

    res.status(200).json({
      status: "success",
      data: {
        total,
        page,
        pages: Math.ceil(total / limit),
        events,
      },
    });
  }
);
