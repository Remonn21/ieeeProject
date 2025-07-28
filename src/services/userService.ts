// services/user.service.ts
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { getCurrentSeason } from "../lib/season";

type CreateUserOptions = {
  name: string;
  personalEmail: string;
  email: string;
  password: string;
  phone: string;
  nationalId?: string;
  role: string;
  faculty?: string;
  university?: string;
  joinedAt?: Date;
  ieeeId?: string;
  committeeId?: string;
  isBoardMember?: boolean;
  seasonalRole?: "MEMBER" | "EXCOM" | "HEAD" | "ATTENDEE";
};

export async function createUserService(data: CreateUserOptions) {
  const existingUser = await prisma.user.findFirst({
    where: { email: data.email },
  });

  if (existingUser) {
    throw new Error("User with these credentials already exists.");
  }

  const hashedPassword = await bcrypt.hash(data.password, 12);
  const currentSeason = await getCurrentSeason();

  const user = await prisma.user.create({
    data: {
      name: data.name,
      personalEmail: data.personalEmail,
      email: data.email,
      password: hashedPassword,
      phone: data.phone,
      //   role: data.role,

      committee: data.committeeId ? { connect: { id: data.committeeId } } : undefined,
      nationalId: data.nationalId,
      ieeeId: data.ieeeId ?? null,
      faculty: data.faculty ?? null,
      university: data.university ?? null,

      seasonMemberships: {
        create: {
          season: { connect: { id: currentSeason.id } },

          isBoardMember: data.isBoardMember ?? false,
          role: data.seasonalRole ?? "MEMBER",
          joinedAt: data.joinedAt ?? new Date(),
        },
      },
    },

    include: {
      seasonMemberships: true,
    },
  });

  return user;
}
