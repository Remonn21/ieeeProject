import catchAsync from "../utils/catchAsync";
import { NextFunction, Request, Response } from "express";

import AppError from "../utils/appError";
import { prisma } from "../lib/prisma";
import { handleNormalUploads } from "../utils/handleNormalUpload";
import { Speaker } from "@prisma/client";

export const getEvents = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { search } = req.query;

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 1;
    const skip = (page - 1) * limit;

    const filters: any = {};

    const user = req.user;

    filters.private = false;

    const allowedForPrivate = ["HEAD", "EXCOM", "MEMBER"];

    const isPrivileged =
      user && user.roles.some((role) => allowedForPrivate.includes(role));

    if (!isPrivileged) {
      filters.private = false;
    }

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

    const user = req.user;

    const allowedForPrivate = ["HEAD", "EXCOM"];
    const isPrivileged =
      user && user.roles.some((role) => allowedForPrivate.includes(role));

    const event = await prisma.event.findUnique({
      where: { id: id },
      include: {
        CustomFormField: true,
        registrations: isPrivileged ? true : false,
        speakers: true,
      },
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
      formFields,
    } = req.body;

    const newSpeakers: any[] = [];
    const existingSpeakerIds: string[] = [];

    for (const speaker of speakers) {
      if (speaker.id) {
        existingSpeakerIds.push(speaker.id);
      } else {
        newSpeakers.push({
          name: speaker.name,
          title: speaker.title,
          job: speaker.job,
          company: speaker.company,
          photoUrl: speaker.photoUrl,
          linkedin: speaker.linkedin,
          twitter: speaker.twitter,
          bio: speaker.description,
        });
      }
    }

    const names = newSpeakers.map((s) => s.name);
    const existingSpeakers = await prisma.speaker.findMany({
      where: {
        name: { in: names },
      },
    });

    const existingNames = existingSpeakers.map((s) => s.name);

    if (existingNames.length > 0) {
      return next(new AppError("one or more speaker with this name already exists", 400));
    }

    const createdSpeakers = await Promise.all(
      newSpeakers.map((speaker) => prisma.speaker.create({ data: speaker }))
    );

    const existingSpeakerRecords = await prisma.speaker.findMany({
      where: {
        id: { in: existingSpeakerIds },
      },
    });

    const allSpeakers = [...createdSpeakers, ...existingSpeakerRecords];
    const speakerLookupByName: Record<string, string> = {};

    allSpeakers.forEach((speaker) => {
      speakerLookupByName[speaker.name] = speaker.id;
    });

    const event = await prisma.event.create({
      data: {
        name,
        description,
        startDate: new Date(startDate),
        registrationStart: new Date(registrationStart),
        registrationEnd: new Date(registrationEnd),
        category: "Conference",
        location,
        speakers: {
          connect: allSpeakers.map((s) => ({ id: s.id })),
        },
        eventDays: {
          create: timeline.map((day: any) => ({
            date: new Date(day.date),
            label: day.label,
            agendaItems: {
              create: day.agenda.map((item: any) => {
                const speakerId = speakerLookupByName[item.speakerName];
                if (!speakerId) {
                  throw new Error(`Speaker with name '${item.speakerName}' not found.`);
                }

                return {
                  name: item.name,
                  description: item.description,
                  startTime: new Date(item.startTime),
                  endTime: item.endTime ? new Date(item.endTime) : null,
                  speaker: {
                    connect: { id: speakerId },
                  },
                };
              }),
            },
          })),
        },
        CustomFormField: {
          create: formFields.map((field: any) => ({
            label: field.label,
            type: field.type,
            required: field.required ?? false,
            options: field.options ?? [],
          })),
        },
      },
      include: {
        eventDays: {
          include: {
            agendaItems: true,
          },
        },
        speakers: true,
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
