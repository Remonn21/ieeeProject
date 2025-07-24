import catchAsync from "../utils/catchAsync";
import { NextFunction, Request, Response } from "express";

import AppError from "../utils/appError";
import { prisma } from "../lib/prisma";
import { handleNormalUploads } from "../utils/handleNormalUpload";
import slugify from "slugify";
// import {
//   deleteUploadedFiles,
//   deleteUploadFolder,
//   handleNormalUploads,
// } from "../utils/handleNormalUpload";

export const getBoard = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const board = await prisma.board.findMany();

    // const groupedByPosition = board.reduce(
    //   (acc, member) => {
    //     const positionKey = member.position;

    //     if (!acc[positionKey]) {
    //       acc[positionKey] = [];
    //     }

    //     acc[positionKey].push(member);

    //     return acc;
    //   },
    //   {} as Record<string, typeof board>
    // );

    res.status(200).json({
      status: "success",
      data: { board },
    });
  }
);

export const createBoardMember = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { position, title, socialLinks, userId, committeeId, name } = req.body;

    const [userDoc, committeeDoc] = await Promise.all([
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
    ]);

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

    console.log("links", socialLinksArray);

    const boardMember = await prisma.board.create({
      data: {
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
  async (req: Request, res: Response, next: NextFunction) => {}
);

export const deleteBoardMember = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {}
);
