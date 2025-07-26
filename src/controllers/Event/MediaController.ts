import catchAsync from "../../utils/catchAsync";
import { NextFunction, Request, Response } from "express";
import AppError from "../../utils/appError";
import { prisma } from "../../lib/prisma";
import { deleteUploadedFiles, handleNormalUploads } from "../../utils/handleNormalUpload";
import { allowedExtensions } from "../../middlewares/uploadMiddleware";

export const getEventMedia = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    if (!id) {
      return next(new AppError("Event ID is required", 400));
    }

    const eventMedia = await prisma.eventMedia.findMany({
      where: {
        eventId: id,
      },
      select: {
        id: true,
        url: true,
        type: true,
      },
    });

    if (!eventMedia) {
      return next(new AppError("No media found for this event or event not found", 404));
    }

    const mappedEventMedia = eventMedia.reduce(
      (acc: any, media) => {
        if (media.type === "VIDEO") {
          acc.videos.push(media);
        } else {
          acc.images.push(media);
        }
        return acc;
      },
      { videos: [], images: [] }
    );

    res.status(200).json({
      status: "success",
      data: {
        eventMedia: mappedEventMedia,
      },
    });
  }
);

export const UploadEventMedia = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { url, type } = req.body;

    if (!id) {
      return next(new AppError("Event ID is required", 400));
    }

    const event = await prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      return next(new AppError("Event not found", 404));
    }
    const mediaFiles = await handleNormalUploads(req.files as Express.Multer.File[], {
      entityName: `event-${Date.now()}`,
      folderName: `events/${id}/media`,
      fileData: true,
    });

    const videoExtNames = [
      ".mp4",
      ".mov",
      ".wmv",
      ".avi",
      ".flv",
      ".mkv",
      ".webm",
      ".3gp",
    ];
    const imageExtNames = [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"];

    console.log(mediaFiles);

    await prisma.eventMedia.createMany({
      data: mediaFiles.map((file) => ({
        url: file.url,
        type: videoExtNames.includes(file.extName)
          ? "VIDEO"
          : imageExtNames.includes(file.extName)
            ? "IMAGE"
            : "IMAGE",
        eventId: id,
      })),
    });

    res.status(201).json({
      status: "success",
      message: "Media uploaded successfully",
    });
  }
);

export const deleteEventMedia = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { photoId } = req.params;

    const media = await prisma.eventMedia.delete({
      where: {
        id: photoId,
      },
    });

    if (!media) {
      return next(new AppError("Media not found", 404));
    }

    await deleteUploadedFiles([media.url], {
      folderName: `events/${media.eventId}/media`,
      entityName: media.url,
    });

    res.status(200).json({
      status: "success",
      message: "Media has been deleted successfully",
    });
  }
);
