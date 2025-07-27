import catchAsync from "../../utils/catchAsync";
import { NextFunction, Request, Response } from "express";

import AppError from "../../utils/appError";
import { prisma } from "../../lib/prisma";
import { handleNormalUploads } from "../../utils/handleNormalUpload";
import { InputJsonObject } from "@prisma/client/runtime/library";

export const getEventSpeakers = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    if (!id) {
      return next(new AppError("Event ID is required", 400));
    }

    const eventSpeakers = await prisma.eventSpeaker.findMany({
      where: {
        eventId: id,
      },
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
    });

    const eventSpeakersMapped = eventSpeakers.map((speaker) => ({
      ...speaker,
      speaker: {
        ...speaker.speaker,
        socialLinks:
          typeof speaker.speaker.socialLinks === "string"
            ? JSON.parse(speaker.speaker.socialLinks)
            : speaker.speaker.socialLinks,
        images: speaker.speaker.images.find((image) => image.id === speaker.photoId),
      },
    }));

    if (!eventSpeakers) {
      return next(new AppError("Event speakers not found", 404));
    }

    res.status(200).json({
      status: "success",
      data: eventSpeakersMapped,
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

export const updateEventSpeaker = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id, speakerId } = req.params;
    const { name, title, job, company, socialLinks, bio, caption, photoId } = req.body;

    let updatedSpeaker;

    let socialLinksValidated = socialLinks;

    console.log(socialLinks, "socialLinks", socialLinksValidated);

    if (!Array.isArray(socialLinksValidated) && socialLinks !== undefined) {
      try {
        socialLinksValidated = JSON.parse(socialLinks);
      } catch {
        return next(new AppError("Invalid social links", 400));
      }
    }

    const eventSpeaker = await prisma.eventSpeaker.findUnique({
      where: { eventId_speakerId: { eventId: id, speakerId: speakerId } },
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
    });

    if (!eventSpeaker) {
      return next(new AppError("Speaker not found or is not part of this event", 404));
    }

    if (name || title || job || company || socialLinks || bio) {
      let socialLinksArray = eventSpeaker.speaker.socialLinks;
      if (socialLinksValidated) {
        socialLinksArray = JSON.stringify(
          socialLinksValidated?.map((link: any) => {
            if (!link.url || !link.name || !link.icon) {
              return next(new AppError("Missing fields in social links", 400));
            }

            return {
              name: link.name,
              icon: link.icon,
              url: link.url,
            };
          })
        );
      }

      updatedSpeaker = await prisma.speaker.update({
        where: { id: speakerId },
        data: {
          name: name || eventSpeaker.speaker.name,
          title: title || eventSpeaker.speaker.title,
          job: job || eventSpeaker.speaker.job,
          company: company || eventSpeaker.speaker.company,
          socialLinks: socialLinksArray as InputJsonObject,
          bio: bio || eventSpeaker.speaker.bio,
        },
      });
    }

    let photoUrl;

    if (req.file) {
      photoUrl = await handleNormalUploads([req.file], {
        entityName: `speaker-${Date.now()}`,
        folderName: `speakers/${id}`,
      });

      updatedSpeaker = await prisma.speaker.update({
        where: { id: speakerId },
        data: {
          images: {
            create: {
              url: photoUrl[0],
              caption: caption || "",
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

      await prisma.eventSpeaker.update({
        where: {
          eventId_speakerId: {
            eventId: id,
            speakerId: speakerId,
          },
        },
        data: {
          photoId: updatedSpeaker.images[updatedSpeaker.images.length - 1].id,
        },
      });
    }

    if (!updatedSpeaker) {
      return next(new AppError("You didnt provide any change in speaker data", 404));
    }

    res.status(200).json({
      status: "success",
      data: {
        speaker: updatedSpeaker,
        imageId: req.file
          ? (updatedSpeaker as any).images[(updatedSpeaker as any).images.length - 1].id
          : null,
      },
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
