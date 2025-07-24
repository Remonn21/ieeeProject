import catchAsync from "../utils/catchAsync";
import { NextFunction, Request, Response } from "express";

import AppError from "../utils/appError";
import { prisma } from "../lib/prisma";

import { cleanHtml } from "../utils";
import { FormType } from "@prisma/client";

const allowedFieldTypes = [
  "TEXT",
  "EMAIL",
  "NUMBER",
  "SELECT",
  "DROPDOWN",
  "OPTIONS",
  "FILE",
  "DATE",
  "PARAGRAPH",
]; // Add more field types if neededTypes

const allowedFormTypes = ["EVENT", "SURVEY", "FEEDBACK", "POST", "ANY"];

interface FormFieldInput {
  label: string;
  name: string;
  type: string;
  required?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  options?: string[];
  placeholder?: string;
}

type createCustomFormParams = {
  name: string;
  description: string;
  type: FormType;
  startDate: Date;
  endDate: Date;
  formFields: FormFieldInput[];
  eventId?: string;
};

export const createCustomForm = async ({
  name,
  description,
  startDate,
  endDate,
  type,
  formFields,
  eventId,
}: createCustomFormParams) => {
  if (!allowedFormTypes.includes(type)) {
    throw new AppError("Invalid form type", 400);
  }

  const existing = await prisma.customForm.findFirst({
    where: {
      name,
    },
  });
  if (existing) {
    throw new AppError("A form already exists with this name", 400);
  }

  const fields = [
    ...formFields.map((field: any) => {
      if (!allowedFieldTypes.includes(field.type.toUpperCase())) {
        throw new AppError("Invalid field type", 400);
      }
      return {
        label: field.label,
        name: field.name,

        required: field.required ?? field.required,
        min: field.min ?? null,
        max: field.max ?? null,
        placeholder: field.placeholder,
        options: field.options,
        type: field.type.toUpperCase(),
      };
    }),
  ];

  const form = await prisma.customForm.create({
    data: {
      name,
      startDate,
      endDate,
      description: cleanHtml(description),
      type: type.toUpperCase() as FormType,
      ...(eventId && { event: { connect: { id: eventId } } }),
      fields: {
        create: fields,
      },
    },
  });

  return form;
};

export const createForm = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { name, description, startDate, endDate, type, formFields } = req.body;

    const form = await createCustomForm({
      name,
      description,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      type,
      formFields,
    });

    res.status(200).json({
      status: "success",
      data: form,
    });
  }
);

export const getFormDetails = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const form = await prisma.customForm.findUnique({
      where: { id },
      include: {
        fields: true,
      },
    });

    if (!form) {
      return next(new AppError("Form not found", 404));
    }

    res.status(200).json({
      status: "success",
      data: form,
    });
  }
);

export const searchForms = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { search, paginated } = req.query;

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const filters: any = {};

    if (search) filters.name = { contains: search, mode: "insensitive" };

    const [forms, total] = await Promise.all([
      prisma.customForm.findMany({
        where: filters,
        orderBy: { name: "asc" },
        take: paginated === "true" ? limit : undefined,
        skip: paginated === "true" ? skip : undefined,
      }),
      prisma.speaker.count({ where: filters }),
    ]);

    res.status(200).json({
      status: "success",
      data: {
        forms,
        ...(paginated === "true" && { total }),
        ...(paginated === "true" && { page }),
        ...(paginated === "true" && { pages: Math.ceil(total / limit) }),
      },
    });
  }
);
