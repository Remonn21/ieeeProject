import bcrypt from "bcryptjs";
import { internalPermissions as internalPermissionsConfig } from "../src/config/permissions";
import { prisma } from "../src/lib/prisma";
import { copyLocalImageToUploads } from "../src/utils/handleNormalUpload";
import { EventCategory, FameRank } from "@prisma/client";
import path from "path";

//seeded Data
import boardData from "../Seed/board.json";
import committeeData from "../Seed/committees.json";
import faqData from "../Seed/faqs.json";
import eventData from "../Seed/events.json";
import partnerData from "../Seed/partners.json";
import awardData from "../Seed/awards.json";
import { isValid, parse } from "date-fns";
import { title } from "process";
type InternalPermission = {
  permission: string;
  group: string;
};

async function main() {
  const adminEmail = process.env.DEFAULT_ADMIN_EMAIL as string;

  console.log("🌱 creating new season...");

  const newSeason = await prisma.season.create({
    data: {
      name: "2025",
      startDate: new Date("2024-8-10"),
      endDate: new Date("2025-11-10"),
    },
  });

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
      seasonMemberships: {
        create: {
          season: {
            connect: {
              id: newSeason.id,
            },
          },
          joinedAt: new Date(),
          role: "EXCOM",
        },
      },
      status: "ACTIVE",
      internalRole: {
        connect: {
          id: superAdminRole.id,
        },
      },
      faculty: "Engineering",
      university: "Awesome University",
    },
  });

  console.log("✅ Admin user created:", user.email);

  console.log("🌱 Seeding board members...");
  // const userMap = new Map();

  for (const member of boardData) {
    const boardUser = await prisma.board.create({
      data: {
        name: member.name,
        title: member.title,
        position: member.position as FameRank,
        image: member.image,
        seasonId: newSeason.id,
        socialLinks: member.socialLinks || [],
      },
    });

    const imageUrl = await copyLocalImageToUploads(
      path.join(__dirname, "..", "Seed", member.image),
      path.basename(member.image),
      {
        folderName: "board",
        entityName: boardUser.id,
      }
    );

    await prisma.board.update({
      where: {
        id: boardUser.id,
      },
      data: {
        image: imageUrl,
      },
    });
    // userMap.set(member.userId, boardUser.id);
  }

  // console.log(userMap);

  console.log("🌱 Seeding committees...");
  for (const committee of committeeData) {
    const imageUrl = await copyLocalImageToUploads(
      path.join(__dirname, "..", "Seed", committee.image),
      path.basename(committee.image),
      {
        folderName: "committees",
        entityName: committee.name,
      }
    );

    await prisma.committee.create({
      data: {
        name: committee.name,
        description: committee.description,
        image: imageUrl,
        topics: committee.topics,
        // leaders: {
        //   connect: committee.headIds.map((id: string) => ({ id: userMap.get(id) })),
        // },
      },
    });
  }

  console.log("🌱 Seeding events...");

  for (const event of eventData) {
    const startDateParsed = parse(event.startDate, "do MMMM yyyy", new Date());
    const endDateParsed = parse(event.endDate, "do MMMM yyyy", new Date());

    const eventDoc = await prisma.event.create({
      data: {
        coverImage: "",
        seasonId: newSeason.id,
        category: event.category as EventCategory,
        name: event.name,
        description: event.description,
        startDate: startDateParsed,
        endDate: endDateParsed,
        location: event.location,
        registrationStart: new Date(
          new Date(startDateParsed).getTime() - 7 * 24 * 60 * 60 * 1000
        ),
        registrationEnd: startDateParsed,
      },
    });

    const imageUrl = await copyLocalImageToUploads(
      path.join(__dirname, "..", "Seed", event.image),
      path.basename(event.image),
      {
        folderName: "events",
        entityName: event.name,
      }
    );
    const speakers: any = [];
    const sponsors: any = [];
    for (const speaker of event.speakers) {
      const existing = await prisma.speaker.findUnique({
        where: {
          name: speaker.name,
        },
      });

      let speakerDoc = existing;

      if (!speakerDoc) {
        speakerDoc = await prisma.speaker.create({
          data: {
            name: speaker.name,

            title: speaker.title,
            socialLinks: speaker.socialLinks || null,
          },
        });
      }

      const speakerImage = await copyLocalImageToUploads(
        path.join(__dirname, "..", "Seed", speaker.image),
        path.basename(speaker.image),
        {
          folderName: "speakers",
          entityName: speakerDoc.id,
        }
      );

      const updatedSpeaker = await prisma.speaker.update({
        where: {
          id: speakerDoc.id,
        },
        data: {
          images: {
            create: {
              url: speakerImage,
            },
          },
        },
        include: {
          images: true,
        },
      });

      const speakerPhoto = updatedSpeaker.images.at(-1);
      if (!speakerPhoto) {
        throw new Error(`No photo found for speaker ${speakerDoc.id}`);
      }

      await prisma.eventSpeaker.create({
        data: {
          eventId: eventDoc.id,
          speakerId: speakerDoc.id,
          photoId: speakerPhoto.id,
        },
      });
    }

    for (const sponsor of event.sponsors) {
      const existing = await prisma.sponsor.findFirst({
        where: {
          name: sponsor.name,
        },
      });

      let sponsorDoc = existing;

      if (!sponsorDoc) {
        sponsorDoc = await prisma.sponsor.create({
          data: {
            name: sponsor.name,
          },
        });
      }

      const sponsorImage = await copyLocalImageToUploads(
        path.join(__dirname, "..", "Seed", sponsor.image),
        path.basename(sponsor.image),
        {
          folderName: "sponsors",
          entityName: sponsorDoc.id,
        }
      );

      const updatedSponsor = await prisma.sponsor.update({
        where: {
          id: sponsorDoc.id,
        },
        data: {
          images: {
            create: {
              url: sponsorImage,
            },
          },
        },
        include: {
          images: true,
        },
      });

      const sponsorPhoto = updatedSponsor.images[0];
      if (!sponsorPhoto) {
        throw new Error(`No photo found for sponsor ${sponsorDoc.id}`);
      }

      await prisma.eventSponsor.create({
        data: {
          eventId: eventDoc.id,
          sponsorId: sponsorDoc.id,
          photoId: sponsorPhoto.id,
        },
      });

      sponsors.push(updatedSponsor);
    }

    await prisma.event.update({
      where: {
        id: eventDoc.id,
      },
      data: {
        coverImage: imageUrl,
      },
    });
  }

  console.log("🌱 Seeding awards...");

  for (const award of awardData) {
    const dateParsed = parse(award.winningDate, "dd-MM-yyyy", new Date());

    const awardDoc = await prisma.awards.create({
      data: {
        image: "",
        title: award.title,
        description: award.description,
        winningDate: dateParsed,
        place: award.place,
      },
    });

    const imageUrl = await copyLocalImageToUploads(
      path.join(__dirname, "..", "Seed", award.image),
      path.basename(award.image),
      {
        folderName: "awards",
        entityName: awardDoc.id,
      }
    );

    await prisma.awards.update({
      where: { id: awardDoc.id },
      data: { image: imageUrl },
    });
  }

  console.log("🌱 Seeding sponsors...");

  for (const sponsor of partnerData) {
    const existing = await prisma.sponsor.findFirst({
      where: {
        name: sponsor.name,
      },
    });

    if (existing) {
      continue;
    }

    const sponsorDoc = await prisma.sponsor.create({
      data: {
        name: sponsor.name,
      },
    });

    const imageUrl = await copyLocalImageToUploads(
      path.join(__dirname, "..", "Seed", sponsor.image),
      path.basename(sponsor.image),
      {
        folderName: "sponsors",
        entityName: sponsorDoc.id,
      }
    );

    await prisma.sponsor.update({
      where: { id: sponsorDoc.id },
      data: {
        images: {
          create: {
            url: imageUrl,
          },
        },
      },
    });
  }

  console.log("🌱 Seeding faqs...");

  for (const faq of faqData) {
    await prisma.fAQs.create({
      data: {
        question: faq.question,
        answer: faq.answer,
      },
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
