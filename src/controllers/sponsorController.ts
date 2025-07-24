import catchAsync from "../utils/catchAsync";
import { NextFunction, Request, Response } from "express";

import AppError from "../utils/appError";
import { prisma } from "../lib/prisma";
import { handleNormalUploads } from "../utils/handleNormalUpload";

export const createSponsor = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { name, isSeasonSponsor } = req.body;

    if (!name) {
      return next(new AppError("Sponsor name is required", 400));
    }

    if (!req.file) {
      return next(new AppError("Photo is required", 400));
    }

    const sponsor = await prisma.sponsor.create({
      data: {
        name,
        isSeasonSponsor: !!isSeasonSponsor || false,
      },
    });

    const photoUrl = await handleNormalUploads([req.file], {
      entityName: `sponsor-${Date.now()}`,
      folderName: `sponsors/${sponsor.id}`,
    });

    await prisma.sponsor.update({
      where: { id: sponsor.id },
      data: {
        photos: {
          create: {
            url: photoUrl[0],
          },
        },
      },
    });

    res.status(201).json({
      status: "success",
      data: {
        sponsor,
      },
    });
  }
);

export const addSponsorPhoto = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { caption } = req.body;

    if (!req.file) {
      return next(new AppError("Photo is required", 400));
    }

    const sponsor = await prisma.sponsor.findUnique({
      where: { id },
    });

    if (!sponsor) {
      return next(new AppError("sponsor not found", 404));
    }

    const photoUrl = await handleNormalUploads([req.file], {
      entityName: `sponsor-${Date.now()}`,
      folderName: `sponsors/${id}`,
    });

    const updatedSponsor = await prisma.sponsor.update({
      where: { id: id },
      data: {
        photos: {
          create: {
            url: photoUrl[0],
          },
        },
      },
    });

    res.status(200).json({
      status: "success",
      data: {
        sponsor: updatedSponsor,
      },
    });
  }
);

export const searchSponsors = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { search, paginated } = req.query;

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const filters: any = {};

    if (search) filters.name = { contains: search, mode: "insensitive" };

    const [sponsors, total] = await Promise.all([
      prisma.sponsor.findMany({
        where: filters,
        include: {
          photos: {
            select: {
              id: true,
              url: true,
            },
          },
        },
        orderBy: { name: "asc" },
        take: paginated === "true" ? limit : undefined,
        skip: paginated === "true" ? skip : undefined,
      }),
      prisma.sponsor.count({ where: filters }),
    ]);

    res.status(200).json({
      status: "success",
      data: {
        sponsors,
        ...(paginated === "true" && { total }),
        ...(paginated === "true" && { page }),
        ...(paginated === "true" && { pages: Math.ceil(total / limit) }),
      },
    });
  }
);

export const getSponsorData = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const sponsorId = req.params.id;

    if (!sponsorId) {
      return next(new AppError("Sponsor ID is required", 400));
    }

    const sponsor = await prisma.sponsor.findUnique({
      where: { id: sponsorId },
      include: {
        photos: {
          select: {
            url: true,
            id: true,
          },
        },
      },
    });

    if (!sponsor) {
      return next(new AppError("sponsor not found", 404));
    }

    res.status(200).json({
      status: "success",
      data: {
        sponsor,
      },
    });
  }
);

export const deleteSponsor = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const sponsor = await prisma.sponsor.findUnique({
      where: { id },
    });
    if (!sponsor) {
      return next(new AppError("Sponsor not found", 404));
    }
    await prisma.sponsor.delete({
      where: { id },
    });
    await prisma.sponsorPhoto.deleteMany({
      where: { sponsorId: id },
    });
    res.status(200).json({
      status: "success",
      data: null,
    });
  }
);
