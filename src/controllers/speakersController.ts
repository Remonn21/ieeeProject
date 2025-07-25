import catchAsync from "../utils/catchAsync";
import { NextFunction, Request, Response } from "express";

import AppError from "../utils/appError";
import { prisma } from "../lib/prisma";
import { handleNormalUploads } from "../utils/handleNormalUpload";

export const createSpeaker = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { name, title, job, company, photoCaption, socialLinks, bio } = req.body;

    if (!req.file) {
      return next(new AppError("Photo is required", 400));
    }

    const existingSpeaker = await prisma.speaker.findUnique({
      where: { name },
    });

    if (existingSpeaker) {
      return next(new AppError("Speaker already exists", 400));
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

    const speaker = await prisma.speaker.create({
      data: {
        name,
        title,
        job,
        company,

        socialLinks: {
          create: socialLinksArray,
        },
        bio,
      },
    });

    const photoUrl = await handleNormalUploads([req.file], {
      entityName: `speaker-${Date.now()}`,
      folderName: `speakers/${speaker.id}`,
    });

    await prisma.speaker.update({
      where: { id: speaker.id },
      data: {
        images: {
          create: {
            url: photoUrl[0],
            caption: photoCaption || "",
          },
        },
      },
    });

    res.status(201).json({
      status: "success",
      data: {
        speaker,
      },
    });
  }
);

export const addSpeakerPhoto = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { caption } = req.body;

    if (!req.file) {
      return next(new AppError("Photo is required", 400));
    }

    const speaker = await prisma.speaker.findUnique({
      where: { id },
    });

    if (!speaker) {
      return next(new AppError("Speaker not found", 404));
    }

    const photoUrl = await handleNormalUploads([req.file], {
      entityName: `speaker-${Date.now()}`,
      folderName: `speakers/${id}`,
    });

    const updatedSpeaker = await prisma.speaker.update({
      where: { id: id },
      data: {
        images: {
          create: {
            url: photoUrl[0],
            caption: caption || "",
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

    res.status(200).json({
      status: "success",
      data: {
        speaker: updatedSpeaker,
        imageId: updatedSpeaker.images[updatedSpeaker.images.length - 1].id,
      },
    });
  }
);

export const searchSpeakers = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { search, paginated } = req.query;

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const filters: any = {};

    if (search) filters.name = { contains: search, mode: "insensitive" };

    const [speakers, total] = await Promise.all([
      prisma.speaker.findMany({
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
      prisma.speaker.count({ where: filters }),
    ]);

    res.status(200).json({
      status: "success",
      data: {
        speakers,
        ...(paginated === "true" && { total }),
        ...(paginated === "true" && { page }),
        ...(paginated === "true" && { pages: Math.ceil(total / limit) }),
      },
    });
  }
);

export const getSpeakerData = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const speakerId = req.params.id;

    if (!speakerId) {
      return next(new AppError("Speaker ID is required", 400));
    }

    const speaker = await prisma.speaker.findUnique({
      where: { id: speakerId },
      include: {
        images: {
          select: {
            url: true,
            id: true,
          },
        },
      },
    });

    if (!speaker) {
      return next(new AppError("Speaker not found", 404));
    }

    res.status(200).json({
      status: "success",
      data: {
        speaker,
      },
    });
  }
);
