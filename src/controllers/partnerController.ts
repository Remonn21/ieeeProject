import catchAsync from "../utils/catchAsync";
import { NextFunction, Request, Response } from "express";

import AppError from "../utils/appError";
import { prisma } from "../lib/prisma";
import { handleNormalUploads } from "../utils/handleNormalUpload";

export const createPartner = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { name, isSeasonPartner } = req.body;

    if (!name) {
      return next(new AppError("Sponsor name is required", 400));
    }

    if (!req.file) {
      return next(new AppError("Photo is required", 400));
    }

    const partner = await prisma.partner.create({
      data: {
        name,
        isSeasonPartner: isSeasonPartner ? true : false,
      },
    });

    const photoUrl = await handleNormalUploads([req.file], {
      entityName: `partner-${Date.now()}`,
      folderName: `partners/${partner.id}`,
    });

    await prisma.partner.update({
      where: { id: partner.id },
      data: {
        images: {
          create: {
            url: photoUrl[0],
          },
        },
      },
    });

    res.status(201).json({
      status: "success",
      data: {
        partner,
      },
    });
  }
);

export const updatePartner = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { name, isSeasonPartner } = req.body;

    const partner = await prisma.partner.findUnique({ where: { id } });

    if (!partner) {
      return next(new AppError("Partner not found", 404));
    }

    const updates: any = {
      name: name ?? partner.name,
      isSeasonPartner:
        typeof isSeasonPartner === "boolean" ? isSeasonPartner : partner.isSeasonPartner,
    };

    if (req.file) {
      const photoUrl = await handleNormalUploads([req.file], {
        entityName: `partner-${Date.now()}`,
        folderName: `partners/${id}`,
      });

      updates.images = {
        create: {
          url: photoUrl[0],
        },
      };
    }

    const updatedPartner = await prisma.partner.update({
      where: { id },
      data: updates,
      include: {
        images: {
          select: {
            id: true,
            url: true,
          },
        },
      },
    });

    res.status(200).json({
      status: "success",
      data: {
        partner: updatedPartner,
      },
    });
  }
);

export const addPartnerPhoto = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    if (!req.file) {
      return next(new AppError("Photo is required", 400));
    }

    const partner = await prisma.partner.findUnique({
      where: { id },
    });

    if (!partner) {
      return next(new AppError("partner not found", 404));
    }

    const photoUrl = await handleNormalUploads([req.file], {
      entityName: `partner-${Date.now()}`,
      folderName: `partners/${id}`,
    });

    const updatedPartner = await prisma.partner.update({
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
        partner: updatedPartner,
      },
    });
  }
);

export const searchPartners = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { search, paginated } = req.query;

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const filters: any = {};

    if (search) filters.name = { contains: search, mode: "insensitive" };

    const [partners, total] = await Promise.all([
      prisma.partner.findMany({
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
      prisma.partner.count({ where: filters }),
    ]);

    res.status(200).json({
      status: "success",
      data: {
        partners,
        ...(paginated === "true" && { total }),
        ...(paginated === "true" && { page }),
        ...(paginated === "true" && { pages: Math.ceil(total / limit) }),
      },
    });
  }
);

export const getPartnerData = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const partnerId = req.params.id;

    if (!partnerId) {
      return next(new AppError("Sponsor ID is required", 400));
    }

    const partner = await prisma.partner.findUnique({
      where: { id: partnerId },
      include: {
        images: {
          select: {
            url: true,
            id: true,
          },
        },
      },
    });

    if (!partner) {
      return next(new AppError("partner not found", 404));
    }

    res.status(200).json({
      status: "success",
      data: {
        partner,
      },
    });
  }
);

export const deletePartner = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const partner = await prisma.partner.findUnique({
      where: { id },
    });
    if (!partner) {
      return next(new AppError("Partner not found", 404));
    }
    await prisma.partner.delete({
      where: { id },
    });
    await prisma.partnerPhoto.deleteMany({
      where: { partnerId: id },
    });
    res.status(200).json({
      status: "success",
      data: null,
    });
  }
);
