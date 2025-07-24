import catchAsync from "../../utils/catchAsync";
import { NextFunction, Request, Response } from "express";

import AppError from "../../utils/appError";
import { prisma } from "../../lib/prisma";
import { handleNormalUploads } from "../../utils/handleNormalUpload";
import { Speaker } from "@prisma/client";

export const getEventSpeakers = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    if (!id) {
      return next(new AppError("Event ID is required", 400));
    }

    const eventSpeakers = await prisma.event.findUnique({
      where: { id },
      include: {
        speakers: {
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
    });

    if (!eventSpeakers) {
      return next(new AppError("Event speakers not found", 404));
    }

    res.status(200).json({
      status: "success",
      data: eventSpeakers,
    });
  }
);

export const addEventSpeaker = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { speakerId, photoId } = req.body;

    if (!id) {
      return next(new AppError("Event ID is required", 400));
    }

    const event = await prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      return next(new AppError("Event not found", 404));
    }

    let chosenId = photoId;

    if (!photoId) {
      if (!req.file) {
        return next(new AppError("You must select a old photo or upload new photo", 404));
      }

      const photoUrl = (
        await handleNormalUploads([req.file], {
          entityName: `speaker-${Date.now()}`,
          folderName: `speakers/${id}`,
        })
      )[0];

      const updatedSpeaker = await prisma.speaker.update({
        where: {
          id: speakerId,
        },
        include: {
          images: {
            select: {
              id: true,
              url: true,
            },
          },
        },
        data: {
          images: {
            create: {
              url: photoUrl,
              caption: "",
            },
          },
        },
      });
      chosenId = updatedSpeaker.images.at(-1)!.id;
    }

    const speaker = await prisma.speaker.findUnique({
      where: {
        id: speakerId,
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

    if (!speaker) {
      return next(new AppError("Some speakers not found", 404));
    }

    await prisma.eventSpeaker.create({
      data: {
        eventId: id,
        speakerId: speakerId,
        photoId: chosenId,
      },
    });

    res.status(200).json({
      status: "success",
      message: "Event speaker added successfully",
    });
  }
);

export const deleteEventSpeaker = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { eventId, speakerId } = req.params;

    if (!eventId) {
      return next(new AppError("Event ID is required", 400));
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return next(new AppError("Event not found", 404));
    }

    await prisma.eventSpeaker.deleteMany({
      where: {
        eventId: eventId,
        speakerId: speakerId,
      },
    });

    res.status(200).json({
      status: "success",
      message: "Event speaker deleted successfully",
    });
  }
);
