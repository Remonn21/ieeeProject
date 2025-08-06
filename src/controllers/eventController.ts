import catchAsync from "../utils/catchAsync";
import { NextFunction, Request, Response } from "express";

import AppError from "../utils/appError";
import { prisma } from "../lib/prisma";
import { handleNormalUploads } from "../utils/handleNormalUpload";
import { Speaker } from "@prisma/client";
import { createCustomForm } from "./formController";
import { getCurrentSeason } from "../lib/season";

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

    const isPrivileged =
      user && allowedForPrivate.includes(user.seasonMemberships[0].role);

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
    const isPrivileged =
      user && allowedForPrivate.includes(user.seasonMemberships[0].role);

    const event = await prisma.event.findUnique({
      where: { id: id },
      include: {
        registrations: isPrivileged
          ? true
          : user
            ? {
                where: {
                  status: "accepted",
                  userId: user.id,
                },
              }
            : false,
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
            agendaItems: {
              include: {
                speaker: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!event) {
      return next(new AppError("Event not found", 404));
    }

    const eventMapped = {
      ...event,
      isAttende: isPrivileged ? true : event.registrations.length > 0,
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
          name: user?.user?.name,
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
          name: user.user.name,
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
              name: true,
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
              name: true,
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
                name: true,
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

    const currentSeason = await getCurrentSeason();
    const event = await prisma.event.create({
      data: {
        name,
        description,
        startDate: new Date(startDate),
        endDate: new Date(startDate),
        registrationStart: new Date(registrationStart),
        registrationEnd: new Date(registrationEnd),
        coverImage: "",
        season: {
          connect: {
            id: currentSeason.id,
          },
        },
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

    const eventFormFields = [];

    eventFormFields.push({
      label: "Email",
      type: "EMAIL",
      name: "email",
      required: true,
    });

    eventFormFields.push({
      label: "name",
      type: "TEXT",
      name: "name",
      required: true,
    });

    const [eventImage, form] = await Promise.all([
      handleNormalUploads([req.file], {
        entityName: `event-${event.id}`,
        folderName: "events",
      }),
      createCustomForm({
        name: event.name,
        type: "EVENT",
        description: "Event registration form",
        fields: eventFormFields,
        eventId: event.id,
        isRegistrationForm: true,
        startDate: event.registrationStart,
        endDate: event.registrationEnd,
      }),
    ]);

    const updatedEvent = await prisma.event.update({
      where: { id: event.id },
      data: {
        forms: {
          connect: {
            id: form.id,
          },
        },
        coverImage: eventImage[0],
        registrationForm: {
          connect: {
            id: form.id,
          },
        },
      },
    });

    res.status(200).json({
      status: "success",
      data: {
        event: updatedEvent,
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

export const deleteEvent = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const event = await prisma.event.findUnique({
      where: { id },
    });
    if (!event) {
      return next(new AppError("Event not found", 404));
    }
    // TODO:removee the event form responses
    await Promise.all([
      prisma.eventRegistration.deleteMany({
        where: { eventId: id },
      }),
      prisma.eventAttendance.deleteMany({
        where: { eventId: id },
      }),
      prisma.customForm.deleteMany({
        where: { eventId: id },
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
