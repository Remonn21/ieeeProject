import catchAsync from "../utils/catchAsync";
import { NextFunction, Request, Response } from "express";

import AppError from "../utils/appError";
import { prisma } from "../lib/prisma";
import { handleNormalUploads } from "../utils/handleNormalUpload";

interface createSponsorOptions {
  name: string;
  image: Express.Multer.File;
  isSeasonSponsor?: boolean;
  isSeasonPartner?: boolean;
}

export const getSeasonSponsors = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const [sponsors, partners] = await Promise.all([
      prisma.sponsor.findMany({
        where: {
          isSeasonSponsor: true,
        },
        include: {
          images: {
            select: {
              id: true,
              url: true,
            },
          },
        },
      }),
      prisma.sponsor.findMany({
        where: {
          isSeasonPartner: true,
        },
        include: {
          images: {
            select: {
              id: true,
              url: true,
            },
          },
        },
      }),
    ]);

    res.status(200).json({
      status: "success",
      data: {
        sponsors,
        partners,
      },
    });
  }
);

export const createSponsorCore = async (options: createSponsorOptions) => {
  const { name, isSeasonSponsor, isSeasonPartner, image } = options;

  if (!name) {
    throw new AppError("Sponsor name is required", 400);
  }

  if (!image) {
    throw new AppError("Photo is required", 400);
  }

  const sponsor = await prisma.sponsor.create({
    data: {
      name,
      isSeasonSponsor: !!isSeasonSponsor || false,
      isSeasonPartner: !!isSeasonPartner || false,
    },
  });

  const photoUrl = await handleNormalUploads([image], {
    entityName: `sponsor-${Date.now()}`,
    folderName: `sponsors/${sponsor.id}`,
  });

  const updatedSponsor = await prisma.sponsor.update({
    where: { id: sponsor.id },
    data: {
      images: {
        create: {
          url: photoUrl[0],
        },
      },
    },
    include: {
      images: {
        select: {
          id: true,
          url: true,
        },
      },
    },
  });

  return updatedSponsor;
};

export const createSponsor = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const sponsor = await createSponsorCore({
      name: req.body.name,
      image: req.file as Express.Multer.File,
      isSeasonSponsor: req.body.isSeasonSponsor,
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
        images: {
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
          images: {
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
        images: {
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
