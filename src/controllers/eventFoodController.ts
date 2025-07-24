import catchAsync from "../utils/catchAsync";
import { NextFunction, Request, Response } from "express";

import AppError from "../utils/appError";
import { prisma } from "../lib/prisma";
import { User } from "@prisma/client";

export const createFoodMenu = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { name, items } = req.body;

    if (!name || !id || !items || !Array.isArray(items)) {
      return next(new AppError("Missing required fields: name, id, or items", 400));
    }

    const existing = await prisma.foodMenu.findFirst({
      where: { id },
    });
    if (existing) {
      return next(new AppError("A menu already exists for this event", 400));
    }

    const menu = await prisma.foodMenu.create({
      data: {
        name,
        event: { connect: { id: id } },
        foodItems: {
          create: items.map((item: any) => ({
            name: item.name,
            description: item.description || "",
            price: item.price,
            available: item.available ?? true,
          })),
        },
      },
      include: {
        foodItems: true,
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
    const { eventId, menuId } = req.params;
    const { name, items } = req.body;

    if (!name || !items || !Array.isArray(items)) {
      return next(new AppError("Missing required fields: name or items", 400));
    }

    const existingMenu = await prisma.foodMenu.findUnique({
      where: { id: menuId, eventId },
      include: { foodItems: true },
    });

    if (!existingMenu) {
      return next(new AppError("Food menu not found", 404));
    }

    await prisma.foodItem.deleteMany({
      where: { menuId },
    });

    const updatedMenu = await prisma.foodMenu.update({
      where: { id: menuId },
      data: {
        name,
        foodItems: {
          create: items.map((item: any) => ({
            name: item.name,
            description: item.description || "",
            price: item.price,
            available: item.available ?? true,
          })),
        },
      },
      include: { foodItems: true },
    });

    res.status(200).json({
      status: "success",
      message: "Food menu updated successfully",
      data: updatedMenu,
    });
  }
);
export const updateFoodMenuItem = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { itemId, menuId } = req.params;
    const { name, description, price, available } = req.body;

    if (!name && !description && price === undefined && available === undefined) {
      return next(new AppError("At least one field must be provided for update", 400));
    }

    const existingItem = await prisma.foodItem.findUnique({
      where: { id: itemId, menuId },
    });

    if (!existingItem) {
      return next(new AppError("Food item not found", 404));
    }

    const updatedItem = await prisma.foodItem.update({
      where: { id: itemId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price }),
        ...(available !== undefined && { available }),
      },
    });

    res.status(200).json({
      status: "success",
      message: "Food item updated successfully",
      data: updatedItem,
    });
  }
);

export const getFoodMenusForEvent = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { eventId } = req.params;

    const menus = await prisma.foodMenu.findMany({
      where: { eventId },
      include: { foodItems: true },
    });

    // if (menus.length === 0) {
    //   return next(new AppError("No menu found for this event", 404));
    // }

    res.status(200).json({
      status: "success",
      data: {
        total: menus.length,
        menus,
      },
    });
  }
);

export const getEventFoodOrders = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { eventId } = req.params;

    const [orders, totalOrders] = await Promise.all([
      prisma.foodOrder.findMany({
        where: {
          eventId,
        },
      }),
      prisma.foodOrder.count({
        where: {
          eventId,
        },
      }),
    ]);

    res.status(200).json({
      status: "success",
      data: {
        orders,
        total: totalOrders,
      },
    });
  }
);

export const submitFoodOrder = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as User;
    const { menuId, items } = req.body;

    if (!menuId || !items || !Array.isArray(items) || items.length === 0) {
      return next(new AppError("Invalid menu or items", 400));
    }

    const menu = await prisma.foodMenu.findUnique({
      where: { id: menuId },
      include: { event: true },
    });

    if (!menu) {
      return next(new AppError("Food menu not found", 404));
    }

    const order = await prisma.foodOrder.create({
      data: {
        user: { connect: { id: user.id } },
        event: { connect: { id: menu.eventId } },
        items: {
          create: items.map((item: any) => ({
            foodItem: { connect: { id: item.foodItemId } },
            quantity: item.quantity,
          })),
        },
      },
      include: {
        items: {
          include: { foodItem: true },
        },
      },
    });

    res.status(201).json({
      status: "success",
      message: "Food order submitted successfully",
      data: order,
    });
  }
);
