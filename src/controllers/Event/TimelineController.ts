import catchAsync from "../../utils/catchAsync";
import { NextFunction, Request, Response } from "express";
import AppError from "../../utils/appError";
import { prisma } from "../../lib/prisma";
import { parseTimeInHours } from "../../utils";

export const getEventTimeline = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    if (!id) {
      return next(new AppError("Event ID is required", 400));
    }

    const timeline = await prisma.eventDay.findMany({
      where: { eventId: id },
      include: {
        agendaItems: {
          include: {
            speaker: {
              include: {
                images: {
                  select: {
                    id: true,
                    url: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!timeline) {
      return next(new AppError("Event not found or event doesn't have a timeline", 404));
    }

    res.status(200).json({ status: "success", data: { timeline } });
  }
);

export const addEventDay = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { label, date } = req.body;

    if (!id) {
      return next(new AppError("Event ID is required", 400));
    }

    const event = await prisma.event.findUnique({ where: { id } });

    if (!event) {
      return next(new AppError("Event not found", 404));
    }

    await prisma.eventDay.create({
      data: {
        event: {
          connect: {
            id: id,
          },
        },
        label,
        date: new Date(date),
      },
    });

    res
      .status(200)
      .json({ status: "success", data: { message: "Event day added successfully" } });
  }
);

export const updateEventDay = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id, dayId } = req.params;
    const { label, date } = req.body;

    if (!id || !dayId) {
      return next(new AppError("Event ID and Day ID are required", 400));
    }

    const [event, eventDay] = await Promise.all([
      prisma.event.findUnique({ where: { id } }),
      prisma.eventDay.findUnique({ where: { id: dayId } }),
    ]);

    if (!event) return next(new AppError("Event not found", 404));
    if (!eventDay) return next(new AppError("Event day not found", 404));

    await prisma.eventDay.update({
      where: { id: dayId },
      data: {
        label,
        date: new Date(date),
      },
    });

    res.status(200).json({
      status: "success",
      data: { message: "Event day updated successfully" },
    });
  }
);

export const deleteEventDay = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id, dayId } = req.params;

    if (!id) {
      return next(new AppError("Event ID is required", 400));
    }

    const [event, eventDay] = await Promise.all([
      prisma.event.findUnique({ where: { id } }),
      prisma.eventDay.findUnique({ where: { id: dayId } }),
    ]);

    if (!event) {
      return next(new AppError("Event not found", 404));
    }

    if (!eventDay) {
      return next(new AppError("Event day not found", 404));
    }

    await prisma.eventDay.delete({
      where: {
        id: dayId,
      },
    });

    res
      .status(200)
      .json({ status: "success", data: { message: "Event day deleted successfully" } });
  }
);

export const addEventDaySession = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { eventId, dayId } = req.params;
    const { name, description, startTime, endTime, speakerId } = req.body;

    if (!eventId || !dayId) {
      return next(new AppError("Event ID is required", 400));
    }

    const [event, eventDay, speaker] = await Promise.all([
      prisma.event.findUnique({ where: { id: eventId } }),
      prisma.eventDay.findUnique({
        where: { id: dayId },
        include: { agendaItems: true },
      }),
      prisma.speaker.findUnique({ where: { id: speakerId } }),
    ]);

    if (!event) {
      return next(new AppError("Event not found", 404));
    }

    if (!eventDay) {
      return next(new AppError("Event day not found", 404));
    }

    if (!speaker) {
      return next(new AppError("Speaker not found", 404));
    }

    const parsedStartTime = parseTimeInHours(startTime, eventDay.date);
    const parsedEndTime = endTime ? parseTimeInHours(endTime, eventDay.date) : null;

    // const isOverlapping = eventDay.agendaItems.some((item) => {
    //   const existingStart = item.startTime.getTime();
    //   const existingEnd = item.endTime?.getTime() ?? existingStart + 1; // fallback to non-null

    //   const newStart = parsedStartTime.getTime();
    //   const newEnd = parsedEndTime?.getTime() ?? newStart + 1;

    //   return newStart < existingEnd && newEnd > existingStart;
    // });

    // if (isOverlapping) {
    //   return next(new AppError("Time slot overlaps with another session", 400));
    // }

    await prisma.eventDay.update({
      where: {
        id: dayId,
      },
      data: {
        agendaItems: {
          create: {
            name,
            description,
            startTime: parsedStartTime,
            endTime: parsedEndTime,
            speaker: {
              connect: {
                id: speakerId,
              },
            },
          },
        },
      },
    });

    res.status(200).json({
      status: "success",
      data: { message: "Event day session added successfully" },
    });
  }
);

export const updateEventDaySession = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { eventId, dayId, sessionId } = req.params;
    const { name, description, startTime, endTime, speakerId } = req.body;

    if (!eventId || !dayId || !sessionId) {
      return next(new AppError("Missing required IDs", 400));
    }

    const [event, eventDay, speaker, session] = await Promise.all([
      prisma.event.findUnique({ where: { id: eventId } }),
      prisma.eventDay.findUnique({
        where: { id: dayId },
        include: { agendaItems: true },
      }),
      prisma.speaker.findUnique({ where: { id: speakerId } }),
      prisma.agendaItem.findUnique({ where: { id: sessionId } }),
    ]);

    if (!event) return next(new AppError("Event not found", 404));
    if (!eventDay) return next(new AppError("Event day not found", 404));
    if (!speaker) return next(new AppError("Speaker not found", 404));
    if (!session) return next(new AppError("Session not found", 404));

    const parsedStartTime = parseTimeInHours(startTime, eventDay.date);
    const parsedEndTime = endTime ? parseTimeInHours(endTime, eventDay.date) : null;

    const newStart = parsedStartTime.getTime();
    const newEnd = parsedEndTime?.getTime() ?? newStart + 1;

    const isOverlapping = eventDay.agendaItems.some((item) => {
      if (item.id === sessionId) return false;

      const existingStart = item.startTime.getTime();
      const existingEnd = item.endTime?.getTime() ?? existingStart + 1;

      return newStart < existingEnd && newEnd > existingStart;
    });

    if (isOverlapping) {
      return next(new AppError("Time slot overlaps with another session", 400));
    }

    await prisma.agendaItem.update({
      where: { id: sessionId },
      data: {
        name,
        description,
        startTime: parsedStartTime,
        endTime: parsedEndTime,
        speaker: {
          connect: { id: speakerId },
        },
      },
    });

    res.status(200).json({
      status: "success",
      data: { message: "Session updated successfully" },
    });
  }
);

export const deleteEventDaySession = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { eventId, dayId, sessionId } = req.params;

    if (!eventId || !dayId || !sessionId) {
      return next(new AppError("Event ID is required", 400));
    }

    const [event, eventDay] = await Promise.all([
      prisma.event.findUnique({ where: { id: eventId } }),
      prisma.eventDay.findUnique({ where: { id: dayId } }),
    ]);

    if (!event) {
      return next(new AppError("Event not found", 404));
    }

    if (!eventDay) {
      return next(new AppError("Event day not found", 404));
    }

    await prisma.eventDay.update({
      where: {
        id: dayId,
      },
      data: {
        agendaItems: {
          delete: {
            id: sessionId,
          },
        },
      },
    });

    res.status(200).json({
      status: "success",
      data: { message: "Event day session deleted successfully" },
    });
  }
);
