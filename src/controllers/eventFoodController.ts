import catchAsync from "../utils/catchAsync";
import { NextFunction, Request, Response } from "express";

import AppError from "../utils/appError";
import { prisma } from "../lib/prisma";
import { deleteUploadedFiles, handleNormalUploads } from "../utils/handleNormalUpload";

export const createFoodMenu = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { name } = req.body;

    const files = req.files as {
      menuImages?: Express.Multer.File[];
      coverImage?: Express.Multer.File[];
    };

    if (!files.menuImages || !files.coverImage) {
      return next(new AppError("Cover image and menu images are required", 400));
    }

    if (!name) {
      return next(new AppError("Missing required fields: name,", 400));
    }

    const [event, existing] = await Promise.all([
      prisma.event.findUnique({
        where: { id },
      }),
      prisma.eventRestaurant.findFirst({
        where: { id: id, name },
      }),
    ]);

    if (!event) {
      return next(new AppError("Event not found", 404));
    }

    if (existing) {
      return next(
        new AppError("A menu already exists with this name for this event", 400)
      );
    }

    const [menuImages, coverImage] = await Promise.all([
      handleNormalUploads(files.menuImages, {
        folderName: `events/${id}/food-menu/${name}`,
        entityName: `menu-images`,
      }),
      handleNormalUploads(files.coverImage, {
        folderName: `events/${id}/food-menu/${name}`,
        entityName: `cover-image`,
      }),
    ]);

    const menu = await prisma.eventRestaurant.create({
      data: {
        name,
        coverImage: coverImage[0],
        menuImages,
        event: { connect: { id: id } },
      },
    });

    res.status(201).json({
      status: "success",
      data: menu,
    });
  }
);

export const updateFoodMenu = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id: eventId, menuId } = req.params;
    const { name, removedImages } = req.body;

    const files = req.files as {
      menuImages?: Express.Multer.File[];
      coverImage?: Express.Multer.File[];
    };

    const menu = await prisma.eventRestaurant.findUnique({
      where: { id_eventId: { id: menuId, eventId } },
    });

    if (!menu) {
      return next(new AppError("Food menu not found", 404));
    }

    const imagesToBeRemoved = removedImages || [];
    let coverImage, menuImages;

    if (removedImages) {
      deleteUploadedFiles(removedImages, {
        folderName: `events/${eventId}/food-menu/${name}`,
        entityName: `menu-images`,
      });
    }
    if (files.coverImage) {
      await deleteUploadedFiles([menu.coverImage], {
        folderName: `events/${eventId}/food-menu/${name}`,
        entityName: `cover-image`,
      });

      coverImage = await handleNormalUploads(files.coverImage, {
        folderName: `events/${eventId}/food-menu/${name}`,
        entityName: `cover-image`,
      });
    }

    if (files.menuImages) {
      menuImages = await handleNormalUploads(files.menuImages, {
        folderName: `events/${eventId}/food-menu/${name}`,
        entityName: `menu-images`,
      });
    }

    const newMenuImages = menu.menuImages
      .filter((image) => !imagesToBeRemoved?.includes(image))
      .concat(menuImages || []);

    const existingMenu = await prisma.eventRestaurant.findUnique({
      where: {
        id_eventId: { id: menuId, eventId },
      },
    });

    if (!existingMenu) {
      return next(new AppError("Food menu not found", 404));
    }

    const updatedMenu = await prisma.eventRestaurant.update({
      where: { id: menuId },
      data: {
        name,
        menuImages: newMenuImages,
        coverImage: coverImage ? coverImage[0] : menu.coverImage,
      },
    });

    res.status(200).json({
      status: "success",
      message: "Food menu updated successfully",
      data: updatedMenu,
    });
  }
);
// export const updateFoodMenuItem = catchAsync(
//   async (req: Request, res: Response, next: NextFunction) => {
//     const { itemId, menuId } = req.params;
//     const { name, description, price, available } = req.body;

//     if (!name && !description && price === undefined && available === undefined) {
//       return next(new AppError("At least one field must be provided for update", 400));
//     }

//     const existingItem = await prisma.foodItem.findUnique({
//       where: { id: itemId, menuId },
//     });

//     if (!existingItem) {
//       return next(new AppError("Food item not found", 404));
//     }

//     const updatedItem = await prisma.foodItem.update({
//       where: { id: itemId },
//       data: {
//         ...(name && { name }),
//         ...(description !== undefined && { description }),
//         ...(price !== undefined && { price }),
//         ...(available !== undefined && { available }),
//       },
//     });

//     res.status(200).json({
//       status: "success",
//       message: "Food item updated successfully",
//       data: updatedItem,
//     });
//   }
// );

export const getFoodMenusForEvent = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { eventId } = req.params;

    const menus = await prisma.eventRestaurant.findMany({
      where: { eventId },
    });

    if (menus.length === 0) {
      return next(new AppError("No menu found for this event or event not found", 404));
    }

    res.status(200).json({
      status: "success",
      data: {
        total: menus.length,
        menus,
      },
    });
  }
);

export const deleteFoodMenu = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id, menuId } = req.params;

    const menu = await prisma.eventRestaurant.findUnique({
      where: { id_eventId: { id: menuId, eventId: id } },
    });

    if (!menu) {
      return next(new AppError("Food menu not found", 404));
    }

    await deleteUploadedFiles([menu.coverImage], {
      folderName: `events/${menu.eventId}/food-menu/${menu.name}`,
      entityName: `cover-image`,
    });
    await deleteUploadedFiles(menu.menuImages, {
      folderName: `events/${menu.eventId}/food-menu/${menu.name}`,
      entityName: `menu-images`,
    });

    await prisma.eventRestaurant.delete({ where: { id: menuId } });

    res.status(200).json({
      status: "success",
      message: "Food menu deleted successfully",
    });
  }
);
