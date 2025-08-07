import catchAsync from "../utils/catchAsync";
import { NextFunction, Request, Response } from "express";

import AppError from "../utils/appError";
import { prisma } from "../lib/prisma";
import { getCurrentSeason } from "../lib/season";
import { handleNormalUploads } from "../utils/handleNormalUpload";
import { InputJsonValue } from "@prisma/client/runtime/library";

export const createCommittee = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { name, description, topics, headIds } = req.body;

    const topicsArray = Array.isArray(topics) ? topics : JSON.parse(topics);

    console.log("HEADS", headIds);
    console.log("body", req.body);

    if (!req.file) {
      return next(new AppError("Please provide a image file", 400));
    }

    const photosUrl = await handleNormalUploads([req.file] as Express.Multer.File[], {
      folderName: "committees",
      entityName: name,
    });

    const user = await prisma.board.findMany({
      where: {
        id: {
          in: headIds,
        },
      },
    });

    if (user.length !== headIds.length) {
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
        image: photosUrl[0],
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
    const { name, description, topics, headIds } = req.body;

    let topicsArray = [];

    if (topics) {
      topicsArray = Array.isArray(topics) ? topics : JSON.parse(topics);
    }

    const committeeId = req.params.id;

    const committe = await prisma.committee.findUnique({
      where: {
        id: committeeId,
      },
      include: {
        leaders: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!committe) {
      return next(new AppError("Committee not found", 404));
    }

    let photosUrl;

    if (req.file) {
      photosUrl = await handleNormalUploads([req.file] as Express.Multer.File[], {
        folderName: "committees",
        entityName: name,
      });
    }

    const updatedData = await prisma.committee.update({
      where: {
        id: committeeId,
      },
      data: {
        name,
        topics: topics
          ? JSON.stringify(topicsArray)
          : (committe.topics as InputJsonValue),
        description,
        ...(headIds && {
          leaders: {
            set: headIds.map((id: string) => ({ id })),
          },
        }),
        image: photosUrl ? photosUrl[0] : committe.image,
      },
    });

    if (!committe) {
      return next(new AppError("Committee not found", 404));
    }

    res.status(200).json({
      status: "success",
      data: {
        committe: updatedData,
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

    const [committees, count] = await prisma.$transaction([
      prisma.committee.findMany({
        include: {
          leaders: {
            where: {
              seasonId: currentSeason.id,
            },
            select: {
              name: true,
              id: true,
              socialLinks: true,
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

    const committeesJsonUnparsed = committees.map((com) => ({
      ...com,
      topics: typeof com.topics === "string" ? JSON.parse(com.topics) : com.topics,
    }));

    res.status(200).json({
      status: "success",
      data: {
        total: count,
        committees: committeesJsonUnparsed,
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
