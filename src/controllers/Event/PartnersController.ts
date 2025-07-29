import catchAsync from "../../utils/catchAsync";
import { NextFunction, Request, Response } from "express";

import AppError from "../../utils/appError";
import { prisma } from "../../lib/prisma";
import { handleNormalUploads } from "../../utils/handleNormalUpload";
import { createPartnerCore } from "../../services/partnerController";

export const getEventPartners = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    if (!id) {
      return next(new AppError("Event ID is required", 400));
    }

    const eventPartners = await prisma.eventPartner.findMany({
      where: {
        eventId: id,
      },
      include: {
        partner: {
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

    const eventPartnersMapped = eventPartners.map((partner) => ({
      ...partner,
      partner: {
        ...partner.partner,
        images: partner.partner.images.find((image) => image.id === partner.photoId),
      },
    }));

    if (!eventPartners) {
      return next(new AppError("Event partners not found", 404));
    }

    res.status(200).json({
      status: "success",
      data: eventPartnersMapped,
    });
  }
);

export const addEventPartner = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { partnerId, photoId, name, isSeasonPartner } = req.body;

    if (!id) {
      return next(new AppError("Event ID is required", 400));
    }

    const event = await prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      return next(new AppError("Event not found", 404));
    }

    let newPartner;
    let chosenId = photoId;

    // if creating new partner
    if (!partnerId) {
      if (!req.file) {
        return next(
          new AppError("partner image is required when creating new partner", 400)
        );
      }

      newPartner = await createPartnerCore({
        image: req.file as Express.Multer.File,
        name,
        isSeasonPartner: isSeasonPartner ?? false,
      });

      chosenId = newPartner.images.at(0)!.id;
    } else {
      // if selecting from available partners

      if (!photoId) {
        if (!req.file) {
          return next(
            new AppError("You must select a old photo or upload new photo", 404)
          );
        }

        const partner = await prisma.partner.findUnique({
          where: {
            id: partnerId,
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

        if (!partner) {
          return next(new AppError("Partner not found", 404));
        }

        const photoUrl = (
          await handleNormalUploads([req.file], {
            entityName: `partner-${Date.now()}`,
            folderName: `partners/${id}`,
          })
        )[0];

        const updatedPartner = await prisma.partner.update({
          where: {
            id: partnerId,
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
        chosenId = updatedPartner.images.at(-1)!.id;
      }
    }

    await prisma.eventPartner.create({
      data: {
        eventId: id,
        partnerId: newPartner ? newPartner.id : partnerId,
        photoId: chosenId,
      },
    });

    res.status(200).json({
      status: "success",
      message: "Event partner added successfully",
    });
  }
);

export const updateEventPartner = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id, partnerId } = req.params;
    const { name } = req.body;

    let updatedPartner;

    const eventPartner = await prisma.eventPartner.findUnique({
      where: { eventId_partnerId: { eventId: id, partnerId: partnerId } },
      include: {
        partner: {
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

    if (!eventPartner) {
      return next(new AppError("Partner not found or is not part of this event", 404));
    }

    if (name) {
      updatedPartner = await prisma.partner.update({
        where: { id: partnerId },
        data: {
          name: name,
        },
      });
    }

    let photoUrl;

    if (req.file) {
      photoUrl = await handleNormalUploads([req.file], {
        entityName: `partner-${Date.now()}`,
        folderName: `partners/${id}`,
      });

      updatedPartner = await prisma.partner.update({
        where: { id: partnerId },
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

      await prisma.eventPartner.update({
        where: {
          eventId_partnerId: {
            eventId: id,
            partnerId: partnerId,
          },
        },
        data: {
          photoId: updatedPartner.images[updatedPartner.images.length - 1].id,
        },
      });
    }

    if (!updatedPartner) {
      return next(new AppError("You didnt provide any change in partner data", 404));
    }

    res.status(200).json({
      status: "success",
      data: {
        partner: updatedPartner,
        imageId: req.file
          ? (updatedPartner as any).images[(updatedPartner as any).images.length - 1].id
          : null,
      },
    });
  }
);

export const deleteEventPartner = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { eventId, partnerId } = req.params;

    if (!eventId) {
      return next(new AppError("Event ID is required", 400));
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return next(new AppError("Event not found", 404));
    }

    await prisma.eventPartner.deleteMany({
      where: {
        eventId: eventId,
        partnerId: partnerId,
      },
    });

    res.status(200).json({
      status: "success",
      message: "Event partner deleted successfully",
    });
  }
);
