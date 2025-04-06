import catchAsync from "../utils/catchAsync";
import { NextFunction, Request, Response } from "express";

import AppError from "../utils/appError";
import { prisma } from "../lib/prisma";

export const createCommittee = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { name, description, headId } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: headId },
    });

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    const committee = await prisma.committee.create({
      data: {
        name,
        description,
        head: {
          connect: {
            id: headId,
          },
        },
      },
    });

    res.status(201).json({
      status: "success",
      data: {
        committee,
      },
    });
  }
);

export const updateCommittee = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { name, description, headId } = req.body;

    const committeeId = req.params.id;

    const committe = await prisma.committee.update({
      where: {
        id: committeeId,
      },
      data: {
        name,
        description,
        head: {
          connect: {
            id: headId,
          },
        },
      },
    });

    if (!committe) {
      return next(new AppError("Committee not found", 404));
    }

    res.status(200).json({
      status: "success",
      data: {
        committe,
      },
    });
  }
);

export const deleteCommittee = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const committeeId = req.params.id;

    const committe = await prisma.committee.delete({
      where: {
        id: committeeId,
      },
    });

    if (!committe) {
      return next(new AppError("Committee not found", 404));
    }

    res.status(200).json({
      status: "success",
      message: "successfully deleted",
    });
  }
);

export const getCommittees = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const [committees, count] = await prisma.$transaction([
      prisma.committee.findMany({
        include: {
          head: true,
        },
      }),
      prisma.committee.count(),
    ]);

    res.status(200).json({
      status: "success",
      data: {
        total: count,
        committees,
      },
    });
  }
);

export const getCommitteeDetails = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const committeeId = req.params.id;

    const committe = prisma.committee.findUnique({
      where: {
        id: committeeId,
      },
      include: {
        head: true,
        sessions: true,
        members: true,
      },
    });

    if (!committe) {
      return next(new AppError("Committee not found", 404));
    }

    res.status(200).json({
      status: "success",
      data: {
        committe,
      },
    });
  }
);
