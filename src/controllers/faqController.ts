import catchAsync from "../utils/catchAsync";
import { NextFunction, Request, Response } from "express";

import AppError from "../utils/appError";
import { prisma } from "../lib/prisma";

import { cleanHtml } from "../utils";

export const getFaqs = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const faqs = await prisma.fAQs.findMany();

    res.status(200).json({
      status: "success",
      data: {
        total: faqs.length,
        faqs,
      },
    });
  }
);

export const createFaq = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { question, answer } = req.body;

    const existing = await prisma.fAQs.findFirst({
      where: {
        question,
      },
    });

    if (existing) {
      return next(new AppError("FAQ already exists", 400));
    }

    const cleanedAnswer = cleanHtml(answer);

    const faq = await prisma.fAQs.create({
      data: {
        question,
        answer: cleanedAnswer,
      },
    });

    res.status(201).json({
      status: "success",
      data: {
        faq,
      },
    });
  }
);

export const updateFaq = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const { question, answer } = req.body;

    const faq = await prisma.fAQs.findUnique({
      where: {
        id,
      },
    });

    if (!faq) {
      return next(new AppError("FAQ not found", 404));
    }

    const cleanedAnswer = cleanHtml(answer);

    const updatedFaq = await prisma.fAQs.update({
      where: {
        id,
      },
      data: {
        question,
        answer: cleanedAnswer,
      },
    });

    res.status(201).json({
      status: "success",
      data: {
        updatedFaq,
      },
    });
  }
);

export const deleteFaq = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const faq = await prisma.fAQs.findUnique({
      where: {
        id,
      },
    });

    if (!faq) {
      return next(new AppError("FAQ not found", 404));
    }

    await prisma.fAQs.delete({
      where: {
        id,
      },
    });

    res.status(200).json({
      status: "success",
      message: "FAQ has been deleted successfully",
    });
  }
);
