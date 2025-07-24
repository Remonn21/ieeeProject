import catchAsync from "../../utils/catchAsync";
import { NextFunction, Request, Response } from "express";
import AppError from "../../utils/appError";
import { prisma } from "../../lib/prisma";

export const updateEventTimeline = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { timeline } = req.body;

    if (!id) {
      return next(new AppError("Event ID is required", 400));
    }

    const event = await prisma.event.findUnique({ where: { id } });

    if (!event) {
      return next(new AppError("Event not found", 404));
    }

    await prisma.eventDay.deleteMany({ where: { eventId: id } });

    const speakerIds = timeline.flatMap((day: any) =>
      day.agenda.map((item: any) => item.speakerId)
    );

    const speakersData = await prisma.speaker.findMany({
      where: { id: { in: speakerIds } },
      select: { id: true },
    });

    const validSpeakerIds = new Set(speakersData.map((s) => s.id));

    await prisma.event.update({
      where: { id },
      data: {
        eventDays: {
          create: timeline.map((day: any) => ({
            date: new Date(day.date),
            label: day.label,
            agendaItems: {
              create: day.agenda.map((item: any) => {
                if (!validSpeakerIds.has(item.speakerId)) {
                  throw new Error(`Speaker with id '${item.speakerId}' not found.`);
                }

                return {
                  name: item.name,
                  description: item.description,
                  startTime: new Date(item.startTime),
                  endTime: item.endTime ? new Date(item.endTime) : null,
                  speaker: { connect: { id: item.speakerId } },
                };
              }),
            },
          })),
        },
      },
    });

    res.status(200).json({
      status: "success",
      message: "Event timeline updated successfully",
    });
  }
);
