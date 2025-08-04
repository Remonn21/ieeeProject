import { prisma } from "../lib/prisma";
import AppError from "../utils/appError";
import { handleNormalUploads } from "../utils/handleNormalUpload";

interface createPartnerOptions {
  name: string;
  image: Express.Multer.File;
  isSeasonPartner?: boolean;
}

export const createPartnerCore = async (options: createPartnerOptions) => {
  const { name, isSeasonPartner, image } = options;

  if (!name) {
    throw new AppError("Partner name is required", 400);
  }

  if (!image) {
    throw new AppError("Photo is required", 400);
  }

  const partner = await prisma.sponsor.create({
    data: {
      name,
      isSeasonPartner: !!isSeasonPartner || false,
    },
  });

  const photoUrl = await handleNormalUploads([image], {
    entityName: `partner-${Date.now()}`,
    folderName: `partners/${partner.id}`,
  });

  const updatedPartner = await prisma.sponsor.update({
    where: { id: partner.id },
    data: {
      images: {
        create: {
          url: photoUrl[0],
        },
      },
    },
    include: {
      images: {
        select: {
          id: true,
          url: true,
        },
      },
    },
  });

  return updatedPartner;
};
