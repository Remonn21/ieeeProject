import catchAsync from "../utils/catchAsync";
import { NextFunction, Request, Response } from "express";

import AppError from "../utils/appError";
import { prisma } from "../lib/prisma";
import { handleNormalUploads } from "../utils/handleNormalUpload";

interface CreateSpeakerOptions {
  name: string;
  title: string;
  job: string;
  company: string;
  photoCaption?: string;
  socialLinks: any[] | string | null;
  bio: string;
  file: Express.Multer.File;
}

export const createSpeakerCore = async (options: CreateSpeakerOptions) => {
  const { name, title, job, company, photoCaption, socialLinks, bio, file } = options;

  if (!file) throw new AppError("Photo is required", 400);

  let socialLinksValidated: any[] = [];

  if (!Array.isArray(socialLinks)) {
    try {
      socialLinksValidated = JSON.parse(socialLinks || "[]");
    } catch {
      throw new AppError("Invalid social links", 400);
    }
  } else {
    socialLinksValidated = socialLinks;
  }

  const existingSpeaker = await prisma.speaker.findUnique({ where: { name } });
  if (existingSpeaker) throw new AppError("Speaker already exists", 400);

  const socialLinksArray = socialLinksValidated.map((link: any) => {
    if (!link.url || !link.name || !link.icon) {
      throw new AppError("Missing fields in social links", 400);
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
      socialLinks: socialLinksArray,
      bio,
    },
  });

  const photoUrl = await handleNormalUploads([file], {
    entityName: `speaker-${Date.now()}`,
    folderName: `speakers/${speaker.id}`,
  });

  const UpdatedSpeaker = await prisma.speaker.update({
    where: { id: speaker.id },
    data: {
      images: {
        create: {
          url: photoUrl[0],
          caption: photoCaption || "",
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

  return UpdatedSpeaker;
};

export const createSpeaker = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { name, title, job, company, photoCaption, socialLinks, bio } = req.body;

    if (!req.file) {
      return next(new AppError("speaker image is required", 400));
    }

    const speaker = await createSpeakerCore({
      name,
      title,
      job,
      company,
      photoCaption,
      socialLinks,
      bio,
      file: req.file,
    });

    res.status(201).json({
      status: "success",
      data: {
        speaker,
      },
    });
  }
);

export const updateSpeaker = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { name, title, job, company, socialLinks, bio } = req.body;

    const speaker = await prisma.speaker.findUnique({
      where: { id },
    });

    if (!speaker) {
      return next(new AppError("Speaker not found", 404));
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

    const updatedSpeaker = await prisma.speaker.update({
      where: { id },
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

    const speakersMapped = speakers.map((speaker) => {
      return {
        ...speaker,
        socialLinks:
          typeof speaker.socialLinks === "string"
            ? JSON.parse(speaker.socialLinks)
            : speaker.socialLinks,
      };
    });

    res.status(200).json({
      status: "success",
      data: {
        speakers: speakersMapped,
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
        eventsUsedIn: {
          include: {
            event: {
              select: {
                name: true,
                id: true,
                startDate: true,
              },
            },
          },
        },
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
