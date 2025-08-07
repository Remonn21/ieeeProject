import catchAsync from "../../utils/catchAsync";
import { NextFunction, Request, Response } from "express";

import AppError from "../../utils/appError";
import { prisma } from "../../lib/prisma";
import { User } from "@prisma/client";

export const submitFoodOrder = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as User;
    const { menuId, items, additionalNotes } = req.body;

    if (!menuId || !items) {
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
            item: item.item,
            quantity: item.quantity,
            notes: item.notes,
          })),
        },
        menu: { connect: { id: menuId } },
        additionalNotes,
      },
    });

    res.status(201).json({
      status: "success",
      message: "Food order submitted successfully",
      data: order,
    });
  }
);

export const updateFoodOrder = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { orderId } = req.params;
    const { items, additionalNotes } = req.body;

    const order = await prisma.foodOrder.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      return next(new AppError("Food order not found", 404));
    }

    if (order.status !== "pending") {
      return next(new AppError("Only pending orders can be updated", 400));
    }

    const updatedItems = items
      ? items.map((item: any) => ({
          item: item.item,
          quantity: item.quantity,
          notes: item.notes,
        }))
      : order.items;

    const updatedOrder = await prisma.foodOrder.update({
      where: { id: orderId },
      data: {
        items: {
          deleteMany: {},
          create: updatedItems,
        },
        additionalNotes,
      },
    });

    res.status(200).json({
      status: "success",
      message: "Food order updated successfully",
      data: updatedOrder,
    });
  }
);

//  admin controllers functions

export const getEventFoodOrders = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { eventId } = req.params;

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [orders, totalOrders] = await Promise.all([
      prisma.foodOrder.findMany({
        where: {
          eventId,
        },
        // skip,
        // take: limit,
        // orderBy: {
        //   createdAt: "desc",
        // },
        include: {
          items: true,
          user: true,
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
        total: totalOrders,
        totalPages: Math.ceil(totalOrders / limit),
        currentPage: page,
        limit,
        orders,
      },
    });
  }
);

export const changeFoodOrderStatus = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { orderId } = req.params;
    const { status } = req.body;

    const order = await prisma.foodOrder.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return next(new AppError("Food order not found", 404));
    }

    const updatedOrder = await prisma.foodOrder.update({
      where: { id: orderId },
      data: {
        status,
      },
    });
  }
);
