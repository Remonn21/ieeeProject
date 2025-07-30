import { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import catchAsync from "../utils/catchAsync";
import AppError from "../utils/appError";
import bcrypt from "bcryptjs";
import { createUserService } from "../services/userService";
import { getCurrentSeason } from "../lib/season";

export const getMembers = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { search, paginated } = req.query;

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const filters: any = {
      // role: {
      //   not: "ATTENDEE",
      // },
    };

    if (search) {
      filters.OR = [
        {
          name: {
            contains: search,
            mode: "insensitive",
          },
        },
        // {
        //   committee: {
        //     contains: search,
        //     mode: "insensitive",
        //   },
        // },
      ];
    }

    const [members, total] = await Promise.all([
      prisma.user.findMany({
        where: filters,
        ...(paginated === "true" && { skip, take: limit }),
        include: {
          committee: {
            select: {
              name: true,
              id: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.user.count({
        where: filters,
      }),
    ]);

    const memebrsMapped = members.map((mem) => ({
      ...mem,
      committee: mem.committee ? mem.committee.name : null,
    }));

    res.status(200).json({
      status: "success",
      data: {
        ...(paginated === "true" && { total }),
        ...(paginated === "true" && { page }),
        ...(paginated === "true" && { pages: Math.ceil(total / limit) }),
        members: memebrsMapped,
      },
    });
  }
);

export const getMemberDetails = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const member = await prisma.user.findUnique({
      where: {
        id: id,
      },
      include: {
        committee: true,
        seasonMemberships: true,
        boards: {
          include: {
            season: true,
            committee: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!member) {
      return next(new AppError("Member not found", 404));
    }

    res.status(200).json({
      status: "success",
      data: {
        member,
      },
    });
  }
);

export const createMember = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const {
      name,
      email,
      personalEmail,
      password,
      phone,
      role,
      nationalId,
      university,
      faculty,
      ieeeId,
      committeeId,
    } = req.body;

    const allowedRoles = ["MEMBER", "EXCOM", "HEAD"];
    if (!allowedRoles.includes(role)) {
      return next(new AppError("Invalid role. Allowed roles: MEMBER, EXCOM, HEAD", 400));
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    //TODO:fix if he exists as attende so update him and add new memberShip record for current season as member and update his data only
    if (existing) {
      return next(new AppError("Email already in use", 400));
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await createUserService({
      name,
      email,
      personalEmail,
      password,
      phone,
      role,
      nationalId,
      university,
      faculty,
      ieeeId,
      committeeId,
    });

    res.status(201).json({
      status: "success",
      data: {
        userId: user.id,
        message: "Member created successfully",
      },
    });
  }
);

export const updateMember = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const {
      name,
      email,
      personalEmail,
      phone,
      role,
      nationalId,
      university,
      faculty,
      ieeeId,
      committeeId,
    } = req.body;

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) return next(new AppError("Member not found", 404));

    const allowedRoles = ["MEMBER", "EXCOM", "HEAD", "ATTENDEE"];
    if (role && !allowedRoles.includes(role)) {
      return next(new AppError("Invalid role", 400));
    }

    const currentSeason = await getCurrentSeason();

    await prisma.user.update({
      where: { id },
      data: {
        name,
        email,
        personalEmail,
        phone,

        university,
        faculty,
        ieeeId,
        nationalId,
        committeeId,
      },
    });

    if (role) {
      await prisma.seasonMembership.update({
        where: {
          userId_seasonId: {
            seasonId: currentSeason.id,
            userId: user.id,
          },
        },
        data: {
          role,
        },
      });
    }

    res.status(200).json({
      status: "success",
      message: "Member updated successfully",
    });
  }
);

export const toggleMemberStatus = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) return next(new AppError("Member not found", 404));

    const newStatus = user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

    await prisma.user.update({
      where: { id },
      data: { status: newStatus },
    });

    res.status(200).json({
      status: "success",
      message: `Member status changed to ${newStatus}`,
    });
  }
);

export const deleteMember = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) return next(new AppError("Member not found", 404));

    await prisma.seasonMembership.deleteMany({ where: { userId: id } });
    await prisma.user.delete({ where: { id } });

    res.status(204).json({
      status: "success",
      message: "Member deleted",
    });
  }
);
