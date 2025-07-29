import catchAsync from "../utils/catchAsync";
import { NextFunction, Request, Response } from "express";

import AppError from "../utils/appError";
import { prisma } from "../lib/prisma";
import { handleNormalUploads } from "../utils/handleNormalUpload";
import slugify from "slugify";
import { getCurrentSeason } from "../lib/season";
import { isValid as isValidDate, parseISO } from "date-fns";
// import {
//   deleteUploadedFiles,
//   deleteUploadFolder,
//   handleNormalUploads,
// } from "../utils/handleNormalUpload";

export const getBoard = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { seasonId, allSeasons } = req.query;
    const selectedSeasons: string[] = [];

    if (seasonId && typeof seasonId !== "string") {
      return next(new AppError("season must be a string", 400));
    }

    if (seasonId) {
      // const parsed = new Date(season);
      // console.log(parsed);
      // if (!isValidDate(parsed)) {
      //   return next(new AppError("Invalid date format", 400));
      // }

      const selectedSeason = await prisma.season.findUnique({
        where: {
          id: seasonId,
        },
      });

      if (!selectedSeason) {
        return next(new AppError("Season not found", 404));
      }

      selectedSeasons.push(selectedSeason.id);
    }

    if (!seasonId && !allSeasons) {
      const currentSeason = await getCurrentSeason();
      selectedSeasons.push(currentSeason.id);
    }

    if (allSeasons) {
      const seasons = await prisma.season.findMany({ select: { id: true } });
      selectedSeasons.push(...seasons.map((s) => s.id));
    }

    const boards = await prisma.board.findMany({
      where: {
        seasonId: { in: selectedSeasons },
      },
      include: {
        user: true,
        committee: true,
        season: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const groupedBySeason: Record<string, typeof boards> = {};

    if (allSeasons) {
      for (const board of boards) {
        const seasonName = board.season?.name || "Unknown";

        if (!groupedBySeason[seasonName]) {
          groupedBySeason[seasonName] = [];
        }

        groupedBySeason[seasonName].push(board);
      }
    }

    res.status(200).json({
      status: "success",
      data: { boards: allSeasons ? groupedBySeason : boards },
    });
  }
);

export const createBoardMember = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { position, title, socialLinks, userId, committeeId, name } = req.body;

    let { seasonId } = req.body;

    const [userDoc, committeeDoc, seasonDoc] = await Promise.all([
      userId
        ? prisma.user.findUnique({
            where: { id: userId },
          })
        : null,
      committeeId
        ? prisma.committee.findUnique({
            where: { id: committeeId },
          })
        : null,
      seasonId
        ? prisma.season.findUnique({
            where: { id: seasonId },
          })
        : null,
    ]);

    if (seasonId && !seasonDoc) {
      return next(new AppError("season not found", 400));
    }
    if (!seasonId) {
      seasonId = (await getCurrentSeason()).id;
    }

    const imageFile = req.file as Express.Multer.File;

    if (!imageFile) {
      return next(new AppError("Image file is required", 400));
    }

    const imagePath = await handleNormalUploads([imageFile], {
      folderName: "board-members",
      entityName: `${slugify(`${position}-${title}`)}`,
    });

    const socialLinksArray = socialLinks.map((link: any) => {
      if (!link.url || !link.name || !link.icon) {
        return next(new AppError("Missing fields in social links", 400));
      }

      return {
        name: link.name,
        icon: link.icon,
        url: link.url,
      };
    });

    const boardMember = await prisma.board.create({
      data: {
        season: {
          connect: {
            id: seasonId,
          },
        },
        position,
        title,
        name,
        user: userDoc
          ? {
              connect: {
                id: userDoc.id,
              },
            }
          : undefined,

        committee: committeeDoc
          ? {
              connect: {
                id: committeeDoc.id,
              },
            }
          : undefined,
        image: imagePath[0] as string,
        socialLinks: socialLinksArray,
      },
    });

    res.status(200).json({
      status: "success",
      data: {
        boardMember,
      },
    });
  }
);

export const updateBoardMember = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { position, title, name, socialLinks, userId, committeeId } = req.body;

    const existingBoard = await prisma.board.findUnique({ where: { id } });
    if (!existingBoard) return next(new AppError("Board member not found", 404));

    const [userDoc, committeeDoc] = await Promise.all([
      userId ? prisma.user.findUnique({ where: { id: userId } }) : null,
      committeeId ? prisma.committee.findUnique({ where: { id: committeeId } }) : null,
    ]);

    if ((userId && !userDoc) || (committeeId && !committeeDoc)) {
      return next(new AppError("User or committee not found", 404));
    }

    const imageFile = req.file as Express.Multer.File | undefined;
    let imagePath = existingBoard.image;

    if (imageFile) {
      const uploaded = await handleNormalUploads([imageFile], {
        folderName: "board-members",
        entityName: slugify(`${position}-${title}`),
      });
      imagePath = uploaded[0];
    }

    const socialLinksArray = socialLinks?.map((link: any) => {
      if (!link.url || !link.name || !link.icon) {
        return next(new AppError("Missing fields in social links", 400));
      }

      return {
        name: link.name,
        icon: link.icon,
        url: link.url,
      };
    });

    const updated = await prisma.board.update({
      where: { id },
      data: {
        position,
        title,
        name,
        image: imagePath,
        socialLinks: socialLinksArray ?? existingBoard.socialLinks,
        user: userDoc
          ? { connect: { id: userDoc.id } }
          : userId === null
            ? { disconnect: true }
            : undefined,
        committee: committeeDoc
          ? { connect: { id: committeeDoc.id } }
          : committeeId === null
            ? { disconnect: true }
            : undefined,
        updated: new Date(),
      },
    });

    res.status(200).json({
      status: "success",
      data: { boardMember: updated },
    });
  }
);

export const deleteBoardMember = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const existing = await prisma.board.findUnique({ where: { id } });
    if (!existing) return next(new AppError("Board member not found", 404));

    await prisma.board.delete({ where: { id } });

    res.status(204).json({
      status: "success",
      data: null,
    });
  }
);
