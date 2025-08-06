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
];

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
  fields: FormFieldInput[];
  eventId?: string;
  isRegistrationForm?: boolean;
};

export const createCustomForm = async ({
  name,
  description,
  startDate,
  endDate,
  type,
  fields,
  eventId,
  isRegistrationForm = false,
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

  const formFields = [
    ...fields.map((field: any) => {
      if (!allowedFieldTypes.includes(field.type.toUpperCase())) {
        throw new AppError("Invalid field type", 400);
      }
      return {
        label: field.label,
        name: field.name,

        required: field.required ?? false,
        min: field.min ?? null,
        max: field.max ?? null,
        placeholder: field.placeholder,
        options: field.options,
        type: field.type.toUpperCase(),
      };
    }),
  ];

  console.log("is?", isRegistrationForm);

  const form = await prisma.customForm.create({
    data: {
      name,
      startDate,
      endDate,
      description: cleanHtml(description),
      type: type.toUpperCase() as FormType,
      ...(eventId && { event: { connect: { id: eventId } } }),
      ...(isRegistrationForm && { registrationFor: { connect: { id: eventId } } }),
      fields: {
        create: formFields,
      },
    },
  });

  if (isRegistrationForm) {
    await prisma.event.update({
      where: {
        id: eventId,
      },
      data: {
        registrationForm: {
          connect: {
            id: form.id,
          },
        },
      },
    });
  }

  return form;
};

export const createForm = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { name, description, startDate, endDate, type, fields, eventId } = req.body;

    if (eventId) {
      const event = await prisma.event.findUnique({
        where: {
          id: eventId,
        },
      });

      if (!event) {
        return next(new AppError("event not found", 400));
      }
    }

    const form = await createCustomForm({
      name,
      description,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      ...(eventId && { eventId }),
      type,
      fields,
    });

    res.status(200).json({
      status: "success",
      data: form,
    });
  }
);

export const updateForm = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { name, description, startDate, endDate, type, fields } = req.body;
    const form = await prisma.customForm.findUnique({
      where: { id },
    });

    if (!form) {
      return next(new AppError("Form not found", 404));
    }
    if (!allowedFormTypes.includes(type)) {
      return next(new AppError("Invalid form type", 400));
    }

    if (form.isRegistrationForm) {
      const requiredFields = fields.filter(
        (field: any) => field.name === "email" || field.name === "phone"
      );
      if (requiredFields.length < 2) {
        return next(
          new AppError("Registration forms must have 'email' and 'name' field", 400)
        );
      }
    }
    const updatedFields = fields.map((field: any) => {
      if (!allowedFieldTypes.includes(field.type.toUpperCase())) {
        throw new AppError("Invalid field type", 400);
      }
      return {
        label: field.label,
        name: field.name,
        required: field.required ?? false,
        min: field.min ?? null,
        max: field.max ?? null,
        placeholder: field.placeholder,
        options: field.options,
        type: field.type.toUpperCase(),
      };
    });

    const updatedForm = await prisma.customForm.update({
      where: { id },
      data: {
        name,
        startDate,
        endDate,
        description: cleanHtml(description),
        type: type.toUpperCase() as FormType,
        fields: {
          update: updatedFields,
        },
      },
    });

    res.status(200).json({
      status: "success",
      data: updatedForm,
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
        include: {
          event: true,
        },
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

export const deleteForm = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const form = await prisma.customForm.findUnique({
      where: { id },
    });

    if (!form) {
      return next(new AppError("Form not found", 404));
    }

    if (form.isRegistrationForm) {
      return next(new AppError("Cannot delete a registration form", 400));
    }

    await prisma.customForm.delete({
      where: { id },
    });
  }
);

// export
