import catchAsync from "../utils/catchAsync";
import { NextFunction, Request, Response } from "express";

import AppError from "../utils/appError";
import { prisma } from "../lib/prisma";
import { getCurrentSeason } from "../lib/season";

export const createCommittee = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { name, description, topics, headIds } = req.body;

    const topicsArray = Array.isArray(topics) ? topics : JSON.parse(topics);

    console.log("HEADS", headIds);

    const user = await prisma.board.findMany({
      where: {
        id: {
          in: headIds,
        },
      },
    });

    if (user.length !== headIds) {
      return next(
        new AppError(
          "Some leaders werent found, make sure that you provide a valid leader id",
          404
        )
      );
    }

    const committee = await prisma.committee.create({
      data: {
        name,
        description,
        topics: JSON.stringify(topicsArray),
        leaders: {
          connect: headIds.map((id: string) => ({ id })),
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
    const { name, description, topics, headId } = req.body;

    let topicsArray = [];

    if (topics) {
      topicsArray = Array.isArray(topics) ? topics : JSON.parse(topics);
    }

    const committeeId = req.params.id;

    const committe = await prisma.committee.findUnique({
      where: {
        id: committeeId,
      },
    });

    if (!committe) {
      return next(new AppError("Committee not found", 404));
    }

    await prisma.committee.update({
      where: {
        id: committeeId,
      },
      data: {
        name,
        topics: topics ? JSON.stringify(topicsArray) : JSON.stringify(committe.topics),
        description,
        leaders: {
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
    const currentSeason = await getCurrentSeason();

    console.log(currentSeason);
    const [committees, count] = await prisma.$transaction([
      prisma.committee.findMany({
        include: {
          leaders: {
            where: {
              seasonId: currentSeason.id,
            },
            select: {
              name: true,
              image: true,
              title: true,
            },
          },
          // members: {
          //   select: {
          //     firstName: true,
          //     lastName: true,
          //     status: true,
          //   },
          // },
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

    const currentSeason = await getCurrentSeason();

    const committe = prisma.committee.findUnique({
      where: {
        id: committeeId,
      },
      include: {
        leaders: {
          where: {
            seasonId: currentSeason.id,
          },
        },
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
