import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { internalPermissions as internalPermissionsConfig } from "../src/config/permissions";

type InternalPermission = {
  permission: string;
  group: string;
};

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

  const rawPermissions = Array.from(
    new Set(
      (internalPermissionsConfig as InternalPermission[]).map((r) => ({
        name: r.permission,
        group: r.group,
      }))
    )
  );

  const internalPermissions = rawPermissions.map((perm) => ({
    name: perm.name,
    group: perm.group,
  }));

  const roleDefinitions = [
    {
      name: "SuperAdmin",
      permissions: internalPermissions.map((p) => p.name),
    },
  ];
  console.log("🌱 Seeding internal roles & permissions...");

  for (const perm of internalPermissions) {
    await prisma.permission.upsert({
      where: { name: perm.name },
      update: {},
      create: {
        name: perm.name,
        group: perm.group,
      },
    });
  }

  for (const roleDef of roleDefinitions) {
    const role = await prisma.internalRole.upsert({
      where: { name: roleDef.name },
      update: {},
      create: {
        name: roleDef.name,
      },
    });

    const permissionRecords = await prisma.permission.findMany({
      where: {
        name: { in: roleDef.permissions as string[] },
      },
    });

    await prisma.internalRolePermission.deleteMany({
      where: {
        roleId: role.id,
      },
    });

    await Promise.all(
      permissionRecords.map((perm) =>
        prisma.internalRolePermission.create({
          data: {
            role: { connect: { id: role.id } },
            permission: { connect: { id: perm.id } },
          },
        })
      )
    );
  }

  const superAdminRole = await prisma.internalRole.findUnique({
    where: { name: "SuperAdmin" },
  });

  if (!superAdminRole) {
    throw new Error("SuperAdmin role not found");
  }

  const user = await prisma.user.create({
    data: {
      name: "Remon Testing",
      email: adminEmail,
      password: hashedPassword,
      personalEmail: "remonehab21@gmail.com",
      phone: "0123456789",
      role: "EXCOM",
      status: "ACTIVE",
      internalRole: {
        connect: {
          id: superAdminRole.id,
        },
      },
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
