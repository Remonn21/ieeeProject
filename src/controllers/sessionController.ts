import catchAsync from "../utils/catchAsync";
import { NextFunction, Request, Response } from "express";

import AppError from "../utils/appError";
import { prisma } from "../lib/prisma";
import { handleNormalUploads } from "../utils/handleNormalUpload";

export const getSessions = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const [sessions, total] = await Promise.all([
      prisma.session.findMany(),
      prisma.session.count(),
    ]);

    res.status(200).json({
      status: "success",
      data: {
        total,
        sessions,
      },
    });
  }
);

export const getSessionDetails = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;
    const committeeId = req.user?.committeeId;

    if (!committeeId) {
      return next(new AppError("Committee not found", 404));
    }

    const session = await prisma.session.findUnique({
      where: { id, committeeId },
    });
    if (!session) {
      return next(new AppError("Session not found or you don't have access to it", 404));
    }
    res.status(200).json({
      status: "success",
      data: {
        session,
      },
    });
  }
);

export const createSession = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { name, description, committeId, createdAt, startedAt } = req.body;

    const selectcommitteId = req.user?.roles.includes("EXCOM")
      ? committeId
      : req.user?.committeeId;

    const committe = await prisma.committee.findUnique({
      where: { id: selectcommitteId },
    });

    if (!committe) {
      return next(new AppError("Committee not found", 404));
    }

    if (committe.headId !== req?.user?.id) {
      if (!req.user?.roles.includes("EXCOM")) {
        return next(
          new AppError(
            "You are not authorized to create a session for this committee",
            403
          )
        );
      }
    }

    const uploadedImages = await handleNormalUploads(req.files as Express.Multer.File[], {
      folderName: `${committe.name}/sessions`,
      entityName: name,
    });

    const session = await prisma.session.create({
      data: {
        name,
        description,
        createdAt: createdAt ? new Date(createdAt).toISOString() : new Date(),
        startedAt: startedAt ? new Date(startedAt).toISOString() : new Date(),
        images: uploadedImages,
        committee: {
          connect: {
            id: selectcommitteId,
          },
        },
      },
    });

    res.status(201).json({
      status: "success",
      data: {
        session,
      },
    });
  }
);

export const updateSession = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { name, description, createdAt, startedAt } = req.body;

    const session = await prisma.session.findUnique({
      where: { id: id },
      include: {
        committee: {
          select: {
            headId: true,
          },
        },
      },
    });

    if (session?.committee.headId !== req?.user?.id) {
      if (!req.user?.roles.includes("EXCOM")) {
        return next(
          new AppError(
            "You are not authorized to create a session for this committee",
            403
          )
        );
      }
    }

    const updatedSession = await prisma.session.update({
      where: { id: id },
      data: {
        name,
        description,
        createdAt: createdAt ? new Date(createdAt).toISOString() : new Date(),
        startedAt: startedAt ? new Date(startedAt).toISOString() : new Date(),
      },
    });

    res.status(200).json({
      status: "success",
      data: {
        session: updatedSession,
      },
    });
  }
);

export const deleteSession = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const session = await prisma.session.findUnique({
      where: { id: id },
      include: {
        committee: {
          select: {
            headId: true,
          },
        },
      },
    });

    if (session?.committee.headId !== req?.user?.id) {
      if (!req.user?.roles.includes("EXCOM")) {
        return next(
          new AppError(
            "You are not authorized to create a session for this committee",
            403
          )
        );
      }
    }

    const deletedSession = await prisma.session.delete({
      where: { id: id },
    });

    if (!deletedSession) {
      return next(new AppError("Session not found", 404));
    }

    res.status(200).json({
      status: "success",
      message: "successfully deleted",
    });
  }
);
