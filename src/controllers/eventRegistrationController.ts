import catchAsync from "../utils/catchAsync";
import { NextFunction, Request, Response } from "express";
import QRCode from "qrcode";

import AppError from "../utils/appError";
import { prisma } from "../lib/prisma";
import { CustomFormField, CustomFormResponse, User } from "@prisma/client";
import path from "path";
import slugify from "slugify";
import fs from "fs/promises";
import { sendEmail } from "../services/mailService";
import bcrypt from "bcryptjs";
import { imageUrlToBase64 } from "../utils/imageUrlToBase64";
import { parseHtmlTemplate } from "../utils/parseHtmlTemplate";
import { format } from "date-fns";
import { getCurrentSeason } from "../lib/season";
import { start } from "repl";
import { handleNormalUploads } from "../utils/handleNormalUpload";
import { randomUUID } from "crypto";

const generateRandomPassword = (length = 10) => {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from(
    { length },
    () => chars[Math.floor(Math.random() * chars.length)]
  ).join("");
};

export async function createGeneratedUser(name: string, email: string): Promise<User> {
  const baseUsername = name.toLowerCase();
  let generatedUsername = "";
  let usernameExists = true;

  do {
    const uniqueSuffix =
      Date.now().toString(36).slice(-3) + Math.random().toString(36).substring(2, 4);
    generatedUsername = `${baseUsername}-${uniqueSuffix}`;

    const existingUser = await prisma.user.findUnique({
      where: { email: `${generatedUsername}@attendee.com` },
    });

    usernameExists = !!existingUser;
  } while (usernameExists);

  const randomPassword = generateRandomPassword(10);
  const hashedPassword = await bcrypt.hash(randomPassword, 12);

  const [newUser, currentSeason] = await Promise.all([
    prisma.user.create({
      data: {
        name,
        email: `${generatedUsername}@attendee.com`, // System-generated email to let him login
        personalEmail: email, // Provided by the user
        phone: "N/A",
        password: hashedPassword,
        // role: "ATTENDEE",
      },
    }),
    getCurrentSeason(),
  ]);

  await prisma.seasonMembership.create({
    data: {
      season: {
        connect: {
          id: currentSeason.id,
        },
      },
      user: {
        connect: {
          id: newUser.id,
        },
      },
      role: "ATTENDEE",
    },
  });

  return newUser;
}

export const getRegisterResponseDetails = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { responseId } = req.params;

    const userResponse = await prisma.eventRegistration.findUnique({
      where: {
        id: responseId,
      },
      include: {
        event: {
          include: {
            registrationForm: {
              include: {
                fields: true,
              },
            },
          },
        },
        submission: {
          include: {
            responses: true,
          },
        },
        user: {
          select: {
            email: true,
            name: true,
            committee: true,
            committeeId: true,
            nationalId: true,
          },
        },
      },
    });
    if (!userResponse) {
      return next(new AppError("Registration not found", 404));
    }

    const formFields = userResponse.event.registrationForm?.fields || [];
    const responses = userResponse.submission?.responses || [];

    const detailedResponses = formFields.map((field) => {
      const userResponseForField = responses.find((r) => r.fieldId === field.id);

      return {
        id: field.id,
        name: field.name,
        label: field.label,
        required: field.required,
        type: field.type,
        options: field.options,
        value: userResponseForField?.value ?? null,
      };
    });

    res.status(200).json({
      status: "success",
      data: {
        user: userResponse.user,
        event: {
          id: userResponse.event.id,
          name: userResponse.event.name,
        },
        responses: detailedResponses,
      },
    });
  }
);

export const getEventRegistration = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const event = await prisma.event.findUnique({
      where: {
        id,
      },
      include: {
        registrationForm: {
          include: {
            fields: true,
          },
        },
      },
    });

    if (!event) {
      return next(new AppError("Event not found", 404));
    }

    res.status(200).json({
      status: "success",
      data: {
        fields: [...(event.registrationForm?.fields as Array<any>)],
        coverImage: event.coverImage,
        registrationStart: event.registrationForm?.startDate,
        registrationEnd: event.registrationForm?.endDate,
        name: event.registrationForm?.name,
        description: event.registrationForm?.description,
      },
    });
  }
);

export const registerToEvent = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const { formFields } = req.body;

    let user: any = req?.user as User;

    const event = await prisma.event.findUnique({
      where: {
        id,
      },
      include: {
        registrationForm: {
          include: {
            fields: true,
          },
        },
      },
    });

    if (!event) {
      return next(new AppError("Event not found", 404));
    }

    if (user && !user.committeeId && event.private) {
      return next(
        new AppError(
          "This event is only available to IEEE BUB SB members, if you are a member please login with your IEEE BUB SB credentials",
          401
        )
      );
    }

    const files = req.files as Express.Multer.File[];

    const validatedInputs: any = event.registrationForm?.fields.map(async (formField) => {
      const userInput = formFields.find(
        (input: CustomFormResponse) => input.fieldId === formField.id
      );

      if (!userInput || !userInput.value) {
        if (formField.required) {
          return next(new AppError(`Missing required field: ${formField.name} `, 400));
        }
        return;
      }

      let uploadedFileUrl: string | undefined;
      if (formField.type === "FILE" && userInput.value) {
        if (!files) {
          return next(new AppError(`Missing file for field: ${formField.name}`, 400));
        }
        const uploadedFile = files.find(
          (file) => file.fieldname === formField.name
        ) as Express.Multer.File;
        if (!uploadedFile) {
          throw new Error(`Missing required file for field: ${formField.name}`);
        }

        const maxSize = 10 * 1024 * 1024; // 10MB //TODO: make it dyanmic from the custom form
        if (uploadedFile.size > maxSize) {
          throw new Error(`File too large for ${formField.name}. Max size is 5MB`);
        }

        uploadedFileUrl = (
          await handleNormalUploads(
            [uploadedFile],
            {
              folderName: "events/Registration/responses",
              entityName: uploadedFile.filename + randomUUID(),
            },
            true
          )
        )[0];
      }

      if (formField.type === "SELECT" && !formField.options.includes(userInput.value)) {
        return next(new AppError(`Incorrect value for ${formField.name} `, 400));
      }

      return {
        value: formField.type === "FILE" ? uploadedFileUrl : userInput.value,
        fieldId: formField.id,
        name: formField.name,
      };
    });

    console.log(validatedInputs);

    const name = validatedInputs.find(
      (inputField: any) => inputField?.name === "name"
    ).value;

    const email = validatedInputs.find(
      (inputField: any) => inputField?.name === "email"
    ).value;

    //the  user may have attended prev event and we have data for him (from prev event or old member)

    if (!user) {
      user = await prisma.user.findUnique({
        where: {
          email,
        },
      });
    }

    if (!user) {
      user = await createGeneratedUser(name, email);
    }

    const filteredInputs = validatedInputs.filter((input: any) => input !== undefined);

    if (!filteredInputs || filteredInputs.length === 0) {
      return next(new AppError(`Missing required fields `, 400));
    }

    if (user) {
      const existingRegistration = await prisma.eventRegistration.findFirst({
        where: { eventId: id, userId: user.id },
      });

      if (existingRegistration) {
        return next(new AppError("You have already registered for this event", 400));
      }
    }

    const submission = await prisma.customFormSubmission.create({
      data: {
        formId: event.registrationForm?.id!,
        userId: user ? user.id : null,
        responses: {
          create: filteredInputs.map((input: any) => ({
            fieldId: input.fieldId,
            value: input.value,
          })),
        },
      },
    });

    await prisma.eventRegistration.create({
      data: {
        eventId: id,

        userId: user ? user.id : null,
        status: "pending",
        submissionId: submission.id,
      },
    });

    res.status(200).json({
      status: "success",
      message: "You have successfully registered",
    });
  }
);

const getFormData = (
  responses: CustomFormResponse[],
  form: CustomFormField[],
  fieldName: string
) => {
  const fieldId = form.find((field) => field.name === fieldName)?.id;

  return responses.find((response) => response.fieldId === fieldId)?.value;
};

export const acceptEventRegistration = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { responseId } = req.params;
    const response = await prisma.eventRegistration.findUnique({
      where: {
        id: responseId,
      },
      include: {
        event: {
          select: {
            name: true,
            id: true,
            location: true,
            startDate: true,
          },
        },
        submission: {
          include: {
            responses: true,
            form: {
              include: {
                fields: {
                  select: {
                    id: true,
                  },
                },
              },
            },
          },
        },
        user: {
          select: {
            name: true,
            personalEmail: true,
            password: true,
            id: true,
            committeeId: true,
          },
        },
      },
    });

    if (!response) {
      return next(new AppError("Event not found", 404));
    }

    const filename = `qr-${slugify(`${response.user?.id}`)}.png`;
    const baseUrl = process.env.BASE_URL || "http://localhost:3000" + "/static";

    const qrFilePath = path.join(
      __dirname,
      `../uploads/events/${slugify(response.event.name)}/registration/qr-codes`,
      filename
    );

    const fileUrl = `${baseUrl}/uploads/events/${slugify(response.event.name)}/registration/qr-codes/${filename}`;
    await fs.mkdir(path.dirname(qrFilePath), { recursive: true });
    await QRCode.toFile(qrFilePath, response.user?.id as string, {
      margin: 2,
      width: 300,
    }),
      console.log("QR file path:", qrFilePath);
    // const { base64: logoBase64, mimeType } = await imageUrlToBase64(fileUrl);

    // const qrCodeImage = `data:${mimeType};base64,${logoBase64}`;

    let user = response.user;

    // if (!user) {
    //   const responses = response.submission?.responses as CustomFormResponse[];

    //   const form = response.submission?.form.fields as CustomFormField[];

    //   const firstName = getFormData(responses, form, "firstName") || "UNDEFINED";
    //   const lastName = getFormData(responses, form, "lastName") || "UNDEFINED";
    //   const email = getFormData(responses, form, "email") || "UNDEFINED";

    //   user = await createGeneratedUser(firstName, lastName, email);
    // }

    const randomPassword = generateRandomPassword(10);
    const [hashedPassword] = await Promise.all([bcrypt.hash(randomPassword, 12)]);

    const htmlTemplatePath = path.join(__dirname, "../templates/eventConfirmation.html");

    const htmlContent = await parseHtmlTemplate(
      htmlTemplatePath,
      {
        name: `${response.user?.name}`,
        date: format(response.event.startDate, "MMMM d, yyyy"),
        checkInTime: format(response.event.startDate, "H:mm"),
        location: "Banha University Hall",
        locationLink: "https://goo.gl/maps/",
        email: response.user?.personalEmail || "",
        password: randomPassword,
        qrCodeBase64: fileUrl,
      },
      {
        includeLoginBlock: !!response.user?.committeeId,
      }
    );

    const [updatedResponse] = await Promise.all([
      prisma.eventRegistration.update({
        where: {
          id: responseId,
        },
        data: {
          qrcode: fileUrl,
          status: "accepted",
        },
      }),
      prisma.user.update({
        where: {
          id: response.user?.id,
        },
        data: {
          password: hashedPassword,
        },
      }),
      sendEmail({
        to: response.user?.personalEmail as string,
        subject: "event registration accepted",
        html: htmlContent,
      }),
    ]);

    res.status(200).json({
      status: "success",
      message: `user registration accepted and sent mail to ${response.user?.personalEmail}`,
      data: {
        qrCode: updatedResponse,
      },
    });
  }
);
