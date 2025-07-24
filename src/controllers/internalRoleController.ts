import { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import catchAsync from "../utils/catchAsync";
import AppError from "../utils/appError";

export const getInternalPermissions = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const permissions = await prisma.permission.findMany();

    res.status(200).json({
      status: "success",
      data: {
        permissions,
      },
    });
  }
);

export const getAllInternalRoles = catchAsync(async (req, res) => {
  const roles = await prisma.internalRole.findMany();

  res.status(200).json({ status: "success", data: { roles } });
});
export const getInternalRole = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const role = await prisma.internalRole.findUnique({
    where: { id },
    include: {
      permissions: {
        include: { permission: true },
      },
    },
  });

  if (!role) return next(new AppError("Role not found", 404));

  res.status(200).json({ status: "success", data: { role } });
});

export const createInternalRole = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { name, permissions } = req.body;

    const existing = await prisma.internalRole.findUnique({ where: { name } });
    if (existing) return next(new AppError("Role already exists", 400));

    const role = await prisma.internalRole.create({
      data: {
        name,

        permissions: {
          create: permissions.map((id: string) => ({
            permission: { connect: { id } },
          })),
        },
      },
    });

    res.status(201).json({ status: "success", data: role });
  }
);

export const updateInternalRole = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { name, permissions } = req.body;
    const role = await prisma.internalRole.update({
      where: { id },
      data: {
        name,
        permissions: {
          deleteMany: {},
          create: permissions.map((id: string) => ({
            permission: { connect: { id } },
          })),
        },
      },
    });

    res.status(200).json({ status: "success", data: role });
  }
);

export const deleteInternalRole = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  await prisma.internalRole.delete({ where: { id } });

  res.status(204).json({ status: "success", data: null });
});

export const assignInternalRoleToUser = catchAsync(async (req, res, next) => {
  const { userId, roleId } = req.body;

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      internalRole: { connect: { id: roleId } },
    },
    include: {
      internalRole: {
        include: { permissions: { include: { permission: true } } },
      },
    },
  });

  res.status(200).json({ status: "success", data: user });
});
