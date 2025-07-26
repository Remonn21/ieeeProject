import catchAsync from "../utils/catchAsync";
import { NextFunction, Request, Response } from "express";

import AppError from "../utils/appError";
import { prisma } from "../lib/prisma";
import { deleteUploadedFiles, handleNormalUploads } from "../utils/handleNormalUpload";

export const getAwards = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { search, paginated } = req.query;

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const filters: any = {};

    if (search) {
      filters.OR = [
        {
          name: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          description: {
            contains: search,
            mode: "insensitive",
          },
        },
      ];
    }

    const [awards, total] = await Promise.all([
      prisma.awards.findMany({
        where: filters,

        ...(paginated === "true" && { skip, take: limit }),
        orderBy: {
          winningDate: "desc",
        },
      }),
      prisma.event.count({
        where: filters,
      }),
    ]);

    res.status(200).json({
      status: "success",
      data: {
        ...(paginated === "true" && { total }),
        ...(paginated === "true" && { page }),
        ...(paginated === "true" && { pages: Math.ceil(total / limit) }),
        awards,
      },
    });
  }
);

// export const getAwardDetails = catchAsync(
//   async (req: Request, res: Response, next: NextFunction) => {
//     const { id } = req.params;

//     const award = await prisma.awards.findUnique({
//       where: {
//         id,
//       },
//     });

//     if (!award) {
//       return next(new AppError("award not found", 404));
//     }

//     res.status(200).json({
//       status: "success",
//       data: {
//         award,
//       },
//     });
//   }
// );

export const createAward = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { title, place, description, winningDate } = req.body;

    const uploadedImages = await handleNormalUploads(
      [req.file] as Express.Multer.File[],
      {
        folderName: "awards",
        entityName: title,
      }
    );

    const award = await prisma.awards.create({
      data: {
        description,
        winningDate,
        image: uploadedImages[0],
        place,
        title,
      },
    });

    res.status(201).json({
      status: "success",
      data: {
        award,
      },
    });
  }
);

export const updateAward = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const { title, place, description, winningDate } = req.body;

    const existingAward = await prisma.awards.findUnique({
      where: {
        id,
      },
    });

    if (!existingAward) {
      return next(new AppError("award not found", 404));
    }

    let uploadedImages: string[] = [];

    if (req.file) {
      await deleteUploadedFiles([existingAward.image], {
        folderName: "awards",
        entityName: existingAward.title,
      });
      uploadedImages = await handleNormalUploads([req.file] as Express.Multer.File[], {
        folderName: "awards",
        entityName: title,
      });
    }

    const award = await prisma.awards.update({
      where: {
        id,
      },
      data: {
        description,
        winningDate,
        image: req.file ? uploadedImages[0] : existingAward.image,
        place,
        title,
      },
    });

    res.status(200).json({
      status: "success",
      data: {
        award,
      },
    });
  }
);

export const deleteAward = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const award = await prisma.awards.delete({
      where: {
        id,
      },
    });

    await deleteUploadedFiles([award.image], {
      folderName: "awards",
      entityName: award.title,
    });

    res.status(200).json({
      status: "success",
      message: "award has been deleted successfully",
    });
  }
);
