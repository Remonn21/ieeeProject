import catchAsync from "../../utils/catchAsync";
import { NextFunction, Request, Response } from "express";
import AppError from "../../utils/appError";
import { prisma } from "../../lib/prisma";

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
      prisma.eventDay.findUnique({ where: { id: dayId } }),
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

    await prisma.eventDay.update({
      where: {
        id: dayId,
      },
      data: {
        agendaItems: {
          create: {
            name,
            description,
            startTime: startTime,
            endTime: endTime,
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

// export const updateEventTimeline = catchAsync(
//   async (req: Request, res: Response, next: NextFunction) => {
//     const { id } = req.params;
//     const { timeline } = req.body;

//     if (!id) {
//       return next(new AppError("Event ID is required", 400));
//     }

//     const event = await prisma.event.findUnique({ where: { id } });

//     if (!event) {
//       return next(new AppError("Event not found", 404));
//     }

//     await prisma.event.update({
//       where: { id },
//       data: {
//         eventDays: {
//           deleteMany: {},
//         },
//       },
//     });

//     const speakerIds = timeline.flatMap((day: any) =>
//       day.agenda.map((item: any) => item.speakerId)
//     );

//     const speakersData = await prisma.speaker.findMany({
//       where: { id: { in: speakerIds } },
//       select: { id: true },
//     });

//     const validSpeakerIds = new Set(speakersData.map((s) => s.id));

//     await prisma.event.update({
//       where: { id },
//       data: {
//         eventDays: {
//           create: timeline.map((day: any) => ({
//             date: new Date(day.date),
//             label: day.label,
//             agendaItems: {
//               create: day.agenda.map((item: any) => {
//                 if (!validSpeakerIds.has(item.speakerId)) {
//                   throw new Error(`Speaker with id '${item.speakerId}' not found.`);
//                 }

//                 return {
//                   name: item.name,
//                   description: item.description,
//                   startTime: new Date(item.startTime),
//                   endTime: item.endTime ? new Date(item.endTime) : null,
//                   speaker: { connect: { id: item.speakerId } },
//                 };
//               }),
//             },
//           })),
//         },
//       },
//     });

//     res.status(200).json({
//       status: "success",
//       message: "Event timeline updated successfully",
//     });
//   }
// );
