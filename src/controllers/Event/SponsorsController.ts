import catchAsync from "../../utils/catchAsync";
import { NextFunction, Request, Response } from "express";

import AppError from "../../utils/appError";
import { prisma } from "../../lib/prisma";
import { handleNormalUploads } from "../../utils/handleNormalUpload";

export const getEventSponsors = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    if (!id) {
      return next(new AppError("Event ID is required", 400));
    }

    const eventSponsors = await prisma.eventSponsor.findMany({
      where: {
        eventId: id,
      },
      include: {
        sponsor: {
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

    const eventSponsorsMapped = eventSponsors.map((sponsor) => ({
      ...sponsor,
      sponsor: {
        ...sponsor.sponsor,
        images: sponsor.sponsor.images.find((image) => image.id === sponsor.photoId),
      },
    }));

    if (!eventSponsors) {
      return next(new AppError("Event sponsors not found", 404));
    }

    res.status(200).json({
      status: "success",
      data: eventSponsorsMapped,
    });
  }
);

export const addEventSponsor = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { sponsorId, photoId } = req.body;

    if (!id) {
      return next(new AppError("Event ID is required", 400));
    }

    const event = await prisma.event.findUnique({
      where: { id },
    });

    const sponsor = await prisma.sponsor.findUnique({
      where: {
        id: sponsorId,
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

    if (!event) {
      return next(new AppError("Event not found", 404));
    }

    if (!sponsor) {
      return next(new AppError("Sponsor not found", 404));
    }

    let chosenId = photoId;

    if (!photoId) {
      if (!req.file) {
        return next(new AppError("You must select a old photo or upload new photo", 404));
      }

      const photoUrl = (
        await handleNormalUploads([req.file], {
          entityName: `sponsor-${Date.now()}`,
          folderName: `sponsors/${id}`,
        })
      )[0];

      const updatedSponsor = await prisma.sponsor.update({
        where: {
          id: sponsorId,
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
            },
          },
        },
      });
      chosenId = updatedSponsor.images.at(-1)!.id;
    }

    await prisma.eventSponsor.create({
      data: {
        eventId: id,
        sponsorId: sponsorId,
        photoId: chosenId,
      },
    });

    res.status(200).json({
      status: "success",
      message: "Event sponsor added successfully",
    });
  }
);

export const updateEventSponsor = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id, sponsorId } = req.params;
    const { name } = req.body;

    let updatedSponsor;

    const eventSponsor = await prisma.eventSponsor.findUnique({
      where: { eventId_sponsorId: { eventId: id, sponsorId: sponsorId } },
      include: {
        sponsor: {
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

    if (!eventSponsor) {
      return next(new AppError("Sponsor not found or is not part of this event", 404));
    }

    if (name) {
      updatedSponsor = await prisma.sponsor.update({
        where: { id: sponsorId },
        data: {
          name: name,
        },
      });
    }

    let photoUrl;

    if (req.file) {
      photoUrl = await handleNormalUploads([req.file], {
        entityName: `sponsor-${Date.now()}`,
        folderName: `sponsors/${id}`,
      });

      updatedSponsor = await prisma.sponsor.update({
        where: { id: sponsorId },
        data: {
          images: {
            create: {
              url: photoUrl[0],
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

      await prisma.eventSponsor.update({
        where: {
          eventId_sponsorId: {
            eventId: id,
            sponsorId: sponsorId,
          },
        },
        data: {
          photoId: updatedSponsor.images[updatedSponsor.images.length - 1].id,
        },
      });
    }

    if (!updatedSponsor) {
      return next(new AppError("You didnt provide any change in sponsor data", 404));
    }

    res.status(200).json({
      status: "success",
      data: {
        sponsor: updatedSponsor,
        imageId: req.file
          ? (updatedSponsor as any).images[(updatedSponsor as any).images.length - 1].id
          : null,
      },
    });
  }
);

export const deleteEventSponsor = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { eventId, sponsorId } = req.params;

    if (!eventId) {
      return next(new AppError("Event ID is required", 400));
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return next(new AppError("Event not found", 404));
    }

    await prisma.eventSponsor.deleteMany({
      where: {
        eventId: eventId,
        sponsorId: sponsorId,
      },
    });

    res.status(200).json({
      status: "success",
      message: "Event sponsor deleted successfully",
    });
  }
);
