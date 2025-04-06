import * as fs from "fs/promises";
import path from "path";
import { prisma } from "../lib/prisma";

export type UploadOptions = {
  folderName: string;
  entityName: string;
  entityType: "PROJECT" | "TASK";
  entityId: string;
  companyId: string;
};

export const handleUploads = async (
  files: Express.Multer.File[],
  options: UploadOptions
): Promise<string[]> => {
  const basePath = path.join(
    process.cwd(),
    "uploads",
    options.folderName,
    String(options.entityName)
  );
  await fs.mkdir(basePath, { recursive: true });

  const result: string[] = [];
  const filesToInsert: any[] = [];

  for (const file of files) {
    const targetPath = path.join(basePath, file.originalname);
    await fs.rename(file.path, targetPath);

    filesToInsert.push({
      name: file.originalname,
      size: file.size,
      uploadedDate: new Date(),
      mimeType: file.mimetype,
      path: targetPath.replace(process.cwd(), ""),
      companyId: options.companyId,
      entityType: options.entityType,
      entityId: options.entityId,
    });

    result.push(targetPath);
  }

  if (filesToInsert.length > 0) {
    await prisma.file.createMany({
      data: filesToInsert,
      skipDuplicates: true,
    });
  }

  return result;
};
