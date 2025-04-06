// authController.ts
import { NextFunction, Request, Response } from "express";
import { Prisma, User } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import AppError from "../utils/appError";
import catchAsync from "../utils/catchAsync";

import { prisma } from "../lib/prisma";
import config from "../config";

interface CookieOptions {
  expires: Date;
  httpOnly: boolean;
  secure: boolean;
  sameSite: "none" | "strict" | "lax";
  domain?: string;
  path?: string;
}

export type UserWithRelations = Prisma.UserGetPayload<{
  include: { committee: true; memberProfile: true };
}>;

const createAuthToken = (
  user: Partial<UserWithRelations>,
  statusCode: number,
  res: Response
) => {
  //@ts-ignore

  const token = jwt.sign({ id: user.id }, config["JWT_SECRET"], {
    expiresIn: config["JWT_EXPIRES_IN"],
  });

  const cookieExpiresIn = parseInt(process.env.JWT_COOKIE_EXPIRES_IN as string, 10);

  const cookieOptions: CookieOptions = {
    expires: new Date(Date.now() + cookieExpiresIn * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    path: "/",
  };

  res.cookie("jwt", token, cookieOptions);

  res.status(statusCode).json({
    status: "success",
    data: {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        joinedAt: user?.memberProfile?.joinedAt,

        committe: user.committee ? user?.committee?.name : "No Committee",
        email: user.email,
        phone: user.phone,
      },
    },
  });
};

export const createUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const {
      firstName,
      lastName,
      email,
      roles,
      faculty,
      university,
      joinedAt,
      password,
      phone,
      committeId,
    } = req.body;

    const existingUser = await prisma.user.findFirst({
      where: {
        email,
      },
    });

    if (existingUser) {
      return next(new AppError("User with these credentials already exists.", 400));
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await prisma.user.create({
      data: {
        memberProfile: {
          create: {
            faculty,
            university,
            joinedAt,
          },
        },
        username: email,
        committee: committeId
          ? {
              connect: {
                id: committeId,
              },
            }
          : undefined,
        firstName,
        lastName,
        roles,
        email,
        password: hashedPassword,
        phone,
      },
    });

    createAuthToken(newUser, 201, res);
  }
);

// Login function
export const login = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new AppError("Please provide email and password", 400));
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        committee: true,
        memberProfile: true,
      },
    });

    if (!user || !(await bcrypt.compare(password, user.password || ""))) {
      return next(new AppError("Invalid email or password", 401));
    }

    createAuthToken(user, 200, res);
  }
);

// Protect function
export const protect = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies.jwt;

    if (!token) {
      return next(
        new AppError("You are not logged in! Please log in to get access.", 401)
      );
    }

    const decoded = await verifyToken(token, next, res);

    const userId = decoded.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        committee: true,
        memberProfile: true,
      },
    });

    if (!user) {
      return next(
        new AppError("The user belonging to this token does no longer exist", 401)
      );
    }

    req.user = user;
    next();
  }
);

const verifyToken = (token: string, next: NextFunction, res: Response): Promise<any> => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, config["JWT_SECRET"], (err, decoded) => {
      if (err) {
        console.log(err);
        reject(next(new AppError("Invalid token", 401)));
      } else {
        resolve(decoded);
      }
    });
  });
};

export const checkAuth = (req: Request, res: Response) => {
  res.status(200).json({
    status: "success",
    data: {
      user: {
        id: req.user?.id,
        firstName: req.user?.firstName,
        lastName: req.user?.lastName,
        joinedIn: req.user?.memberProfile?.joinedAt,
        committee: req.user?.committee ? req.user?.committee?.name : "No Committee",
        email: req.user?.email,
        phone: req.user?.phone,
      },
    },
  });
};
