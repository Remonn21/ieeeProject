import catchAsync from "../../utils/catchAsync";
import { NextFunction, Request, Response } from "express";

import AppError from "../../utils/appError";
import { prisma } from "../../lib/prisma";
import { handleNormalUploads } from "../../utils/handleNormalUpload";
import { Speaker } from "@prisma/client";
import { createCustomForm } from ".././formController";

export const addEventSponsors = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { sponsors } = req.body;

    if (!id) {
      return next(new AppError("Event ID is required", 400));
    }

    const event = await prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      return next(new AppError("Event not found", 404));
    }

    const sponsorIds: string[] = [];
    sponsorIds.push(...sponsors.map((s: Speaker) => s.id));

    const sponsorsData = await prisma.sponsor.findMany({
      where: {
        id: { in: sponsorIds },
      },
      include: {
        photos: {
          select: {
            id: true,
            url: true,
          },
        },
      },
    });

    if (sponsorsData.length !== sponsors.length) {
      return next(new AppError("Some sponsors not found", 404));
    }

    await prisma.eventSponsor.createMany({
      data: sponsors.map((sponsor: any) => ({
        eventId: id,
        sponsorId: sponsor.id,
        photoId: sponsor.photoId,
      })),
    });

    res.status(200).json({
      status: "success",
      message: "Event essentials created successfully",
    });
  }
);
