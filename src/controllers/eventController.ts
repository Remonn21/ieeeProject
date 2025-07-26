import catchAsync from "../utils/catchAsync";
import { NextFunction, Request, Response } from "express";

import AppError from "../utils/appError";
import { prisma } from "../lib/prisma";
import { handleNormalUploads } from "../utils/handleNormalUpload";
import { Speaker } from "@prisma/client";
import { createCustomForm } from "./formController";

export const getEvents = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { search, paginated } = req.query;

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const filters: any = {};

    const user = req.user;

    filters.private = false;

    const allowedForPrivate = ["HEAD", "EXCOM", "MEMBER"];

    const isPrivileged = user && allowedForPrivate.includes(user.role);

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
        ...(paginated === "true" && { skip, take: limit }),
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
        ...(paginated === "true" && { total }),
        ...(paginated === "true" && { page }),
        ...(paginated === "true" && { pages: Math.ceil(total / limit) }),
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
    const isPrivileged = user && allowedForPrivate.includes(user.role);

    const event = await prisma.event.findUnique({
      where: { id: id },
      include: {
        registrations: isPrivileged ? true : false,
        speakers: {
          select: {
            photo: {
              select: {
                url: true,
              },
            },
            speaker: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        sponsors: {
          select: {
            photo: {
              select: {
                url: true,
              },
            },
            sponsor: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        eventDays: {
          include: {
            agendaItems: true,
          },
        },
      },
    });

    if (!event) {
      return next(new AppError("Event not found", 404));
    }

    const eventMapped = {
      ...event,
      speakers: event?.speakers.map((s) => ({
        name: s.speaker.name,
        photo: s.photo?.url,
      })),
      sponsors: event?.sponsors.map((s) => ({
        name: s.sponsor.name,
        photo: s.photo?.url,
      })),
    };

    res.status(200).json({
      status: "success",
      data: {
        event: eventMapped,
      },
    });
  }
);

export const attendUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { eventId } = req.params;

    if (!eventId) {
      return next(new AppError("event id must be provided  ", 400));
    }

    const { userId } = req.body;

    if (!userId) {
      return next(new AppError("user id must be provided  ", 400));
    }

    const user = await prisma.eventRegistration.findFirst({
      include: {
        user: true,
      },
      where: {
        eventId,
        userId: userId as string,
        status: "accepted",
      },
    });

    if (!user || !user.user) {
      return next(new AppError("User not found or not registered for this event", 404));
    }

    const isAttended = await prisma.eventAttendance.findFirst({
      where: {
        eventId,
        userId: userId as string,
      },
    });

    if (isAttended) {
      return res.status(400).json({
        status: "error",
        message: "User already checked in",
        user: {
          id: user?.userId,
          name: user?.user?.firstName + " " + user?.user?.lastName,
          email: user?.user?.email,
        },
      });
    }

    await prisma.eventAttendance.create({
      data: {
        event: { connect: { id: eventId } },
        user: { connect: { id: userId } },
        checkedInAt: new Date(),
      },
    });

    res.status(200).json({
      status: "success",
      message: "User checked in successfully",
      data: {
        user: {
          id: user.userId,
          name: user.user.firstName + " " + user.user.lastName,
          email: user.user.email,
          phone: user.user.phone,
        },
      },
    });
  }
);

export const getEventAttendanceStats = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { eventId } = req.params;

    if (!eventId) {
      return next(new AppError("event id must be provided  ", 400));
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        name: true,
      },
    });

    if (!event) {
      return next(new AppError("Event not found", 404));
    }

    const [registrations, attendances] = await Promise.all([
      prisma.eventRegistration.findMany({
        where: {
          eventId,
          status: "accepted",
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
        },
      }),
      prisma.eventAttendance.findMany({
        where: {
          eventId,
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
        },
      }),
    ]);

    const registeredUserIds = registrations.map((r) => r.userId);
    const attendedUserIds = new Set(attendances.map((a) => a.userId));

    const present = registrations.filter((rec) =>
      attendedUserIds.has(rec.userId as string)
    );
    const absent = registrations.filter(
      (rec) => !attendedUserIds.has(rec.userId as string)
    );

    res.status(200).json({
      status: "success",
      data: {
        eventId,
        eventName: event.name,
        totalRegistered: registeredUserIds.length,
        present: present.length,
        presentUsers: attendances.map((p) => p.user),
        absentUsers: absent.map((p) => p.user),
        absent: absent.length,
      },
    });
  }
);

export const getEventRegisteredUsers = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const event = await prisma.event.findUnique({
      where: {
        id,
      },
      include: {
        registrations: {
          include: {
            user: {
              select: {
                email: true,
                firstName: true,
                lastName: true,
                committee: true,
                committeeId: true,
                nationalId: true,
              },
            },
          },
        },
      },
    });

    if (!event) {
      return next(new AppError("Event not found", 404));
    }

    res.status(200).json({
      status: "success",
      data: {
        eventName: event.name,
        responses: event.registrations,
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
      category,
      registrationStart,
      registrationEnd,
      location,
    } = req.body;

    if (!req.file) {
      return next(new AppError("Event image is required", 400));
    }

    const eventImage = await handleNormalUploads([req.file], {
      entityName: `event-${name}`,
      folderName: "events",
    });

    const event = await prisma.event.create({
      data: {
        name,
        description,
        startDate: new Date(startDate),
        endDate: new Date(startDate),
        registrationStart: new Date(registrationStart),
        registrationEnd: new Date(registrationEnd),
        coverImage: eventImage[0],
        category,
        location,
      },
      include: {
        eventDays: {
          include: {
            agendaItems: true,
          },
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

export const updateEventEssentials = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const {
      name,
      description,
      startDate,
      category,
      registrationStart,
      registrationEnd,
      location,
    } = req.body;

    const event = await prisma.event.findUnique({
      where: { id },
    });
    if (!event) {
      return next(new AppError("Event not found", 404));
    }

    let eventImage: string[] = [];

    if (req.file) {
      eventImage = await handleNormalUploads([req.file], {
        entityName: `event-${name}`,
        folderName: "events",
      });
    }

    await prisma.event.update({
      where: { id },
      data: {
        coverImage: eventImage.length > 0 ? eventImage[0] : event.coverImage,
        name: name || event.name,
        description: description || event.description,
        startDate: new Date(startDate) || event.startDate,
        endDate: new Date(startDate) || event.endDate,
        registrationStart: new Date(registrationStart) || event.registrationStart,
        registrationEnd: new Date(registrationEnd) || event.registrationEnd,
        location: location || event.location,
        category: category || event.category,
      },
    });
    res.status(200).json({
      status: "success",
      message: "Event essentials updated successfully",
    });
  }
);

// export const createEventEssentials = catchAsync(
//   async (req: Request, res: Response, next: NextFunction) => {
//     const { id } = req.params;
//     const { speakers, sponsors, timeline, formFields } = req.body;

//     if (!id) {
//       return next(new AppError("Event ID is required", 400));
//     }

//     const event = await prisma.event.findUnique({
//       where: { id },
//     });

//     if (!event) {
//       return next(new AppError("Event not found", 404));
//     }

//     // for form fields:

//     const eventFormFields = [
//       ...formFields.map((field: any) => ({
//         ...field,
//         type: field.type.toUpperCase(),
//       })),
//     ];

//     if (!eventFormFields.some((inputField) => inputField?.name === "email")) {
//       eventFormFields.push({
//         label: "Email",
//         type: "EMAIL",
//         name: "email",
//         required: true,
//       });
//     }
//     if (!eventFormFields.some((inputField) => inputField?.name === "firstName")) {
//       eventFormFields.push({
//         label: "first name",
//         type: "TEXT",
//         name: "firstName",
//         required: true,
//       });
//     }
//     if (!eventFormFields.some((inputField) => inputField?.name === "lastName")) {
//       eventFormFields.push({
//         label: "Last name",
//         type: "TEXT",
//         name: "lastName",
//         required: true,
//       });
//     }

//     const speakerIds: string[] = [];
//     const sponsorIds: string[] = [];
//     speakerIds.push(...speakers.map((s: Speaker) => s.id));
//     sponsorIds.push(...sponsors.map((s: Speaker) => s.id));

//     const [speakersData, sponsorsData] = await Promise.all([
//       prisma.speaker.findMany({
//         where: {
//           id: { in: speakerIds },
//         },
//         include: {
//           images: {
//             select: {
//               id: true,
//               url: true,
//             },
//           },
//         },
//       }),
//       prisma.sponsor.findMany({
//         where: {
//           id: { in: sponsorIds },
//         },
//         include: {
//           images: {
//             select: {
//               id: true,
//               url: true,
//             },
//           },
//         },
//       }),
//     ]);

//     if (speakersData.length !== speakers.length) {
//       return next(new AppError("Some speakers not found", 404));
//     }

//     if (sponsorsData.length !== sponsors.length) {
//       return next(new AppError("Some sponsors not found", 404));
//     }

//     await prisma.eventSpeaker.createMany({
//       data: speakers.map((speaker: any) => ({
//         eventId: id,
//         speakerId: speaker.id,
//         photoId: speaker.photoId,
//       })),
//     });

//     await prisma.eventSponsor.createMany({
//       data: sponsors.map((sponsor: any) => ({
//         eventId: id,
//         sponsorId: sponsor.id,
//         photoId: sponsor.photoId,
//       })),
//     });

//     const form = await createCustomForm({
//       name: event.name,
//       type: "EVENT",
//       description: "Event registration form",
//       formFields: eventFormFields,
//       eventId: event.id,
//       startDate: event.registrationStart,
//       endDate: event.registrationEnd,
//     });

//     await prisma.event.update({
//       where: { id },
//       data: {
//         form: {
//           connect: {
//             id: form.id,
//           },
//         },
//         eventDays: {
//           create: timeline.map((day: any) => ({
//             date: new Date(day.date),
//             label: day.label,
//             agendaItems: {
//               create: day.agenda.map((item: any) => {
//                 const speakerId = speakersData.find(
//                   (speaker) => speaker.id === item.speakerId
//                 )?.id;
//                 if (!speakerId) {
//                   throw new Error(`Speaker with id: '${item.speakerId}' not found.`);
//                 }
//                 return {
//                   name: item.name,
//                   description: item.description,
//                   startTime: new Date(item.startTime),
//                   endTime: item.endTime ? new Date(item.endTime) : null,
//                   speaker: {
//                     connect: { id: speakerId },
//                   },
//                 };
//               }),
//             },
//           })),
//         },
//       },
//     });

//     res.status(200).json({
//       status: "success",
//       message: "Event essentials created successfully",
//     });
//   }
// );

export const deleteEvent = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const event = await prisma.event.findUnique({
      where: { id },
    });
    if (!event) {
      return next(new AppError("Event not found", 404));
    }
    // TODO:removee the event form
    await Promise.all([
      prisma.eventRegistration.deleteMany({
        where: { eventId: id },
      }),
      prisma.eventAttendance.deleteMany({
        where: { eventId: id },
      }),
      prisma.customForm.delete({
        where: { id: event.formId as string },
      }),
      prisma.eventDay.deleteMany({
        where: { eventId: id },
      }),
      prisma.foodMenu.deleteMany({
        where: { eventId: id },
      }),
      prisma.foodOrder.deleteMany({
        where: { eventId: id },
      }),
      prisma.event.delete({
        where: { id },
      }),
    ]);
  }
);

export const updateEvent = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {}
);
