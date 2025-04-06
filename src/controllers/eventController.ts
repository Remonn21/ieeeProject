import catchAsync from "../utils/catchAsync";
import { NextFunction, Request, Response } from "express";

import AppError from "../utils/appError";
import { prisma } from "../lib/prisma";
import { handleNormalUploads } from "../utils/handleNormalUpload";

export const getEvents = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { search } = req.query;

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 1;
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

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where: filters,
        skip,
        take: limit,
        orderBy: {
          startDate: "desc",
        },
      }),
      prisma.event.count({
        where: filters,
      }),
    ]);

    res.status(200).json({
      status: "success",
      data: {
        total,
        page,
        pages: Math.ceil(total / limit),
        events,
      },
    });
  }
);

export const getEventDetails = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const event = await prisma.event.findUnique({
      where: { id: id },
    });

    if (!event) {
      return next(new AppError("Event not found", 404));
    }

    res.status(200).json({
      status: "success",
      data: {
        event,
      },
    });
  }
);

export const createEvent = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const {
      name,
      description,
      startDate,
      speakers,
      registrationStart,
      registrationEnd,
      location,
      timeline,
    } = req.body;

    const speakersData = speakers.map((speaker: any) => ({
      name: speaker.name,
      title: speaker.title,
      description: speaker.description,
      image: speaker.image,
      email: speaker.email,
      phone: speaker.phone,
      linkedin: speaker.linkedin,
      twitter: speaker.twitter,
      photoUrl: speaker.photoUrl,
    }));

    const event = await prisma.event.create({
      data: {
        name,
        description,
        startDate: new Date(startDate).toISOString(),
        registrationStart: new Date(registrationStart).toISOString(),
        registrationEnd: new Date(registrationEnd).toISOString(),
        category: "Conference",
        location,
        speakers: {
          create: speakersData,
        },
        agenda: {
          create: timeline,
        },
      },
    });

    res.status(200).json({
      status: "success",
      data: {
        event,
      },
    });
  }
);

export const updateEvent = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {}
);

export const eventRegistration = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {}
);
