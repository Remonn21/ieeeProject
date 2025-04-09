import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.DEFAULT_ADMIN_EMAIL as string;

  // Check if user already exists
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (existing) {
    console.log("Admin user already exists.");
    return;
  }

  const hashedPassword = await bcrypt.hash(process.env.DEFAULT_ADMIN_PASS as string, 12);

  const user = await prisma.user.create({
    data: {
      firstName: "Admin",
      lastName: "User",
      email: adminEmail,
      username: adminEmail,
      password: hashedPassword,
      phone: "0123456789",
      roles: ["EXCOM"],
      status: "ACTIVE",
      memberProfile: {
        create: {
          faculty: "Engineering",
          university: "Awesome University",
          joinedAt: new Date(),
        },
      },
    },
  });

  console.log("✅ Admin user created:", user.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
