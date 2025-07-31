import * as fs from "fs/promises";
import path from "path";
import slugify from "slugify";

export type UploadOptions = {
  folderName: string; // e.g. "projects" or "tasks"
  entityName: string; // e.g. project name or task ID
  fileData?: boolean;
};

export async function copyLocalImageToUploads(
  localPath: string,
  fileName: string,
  options: UploadOptions
): Promise<string> {
  const slugifiedEntityName = slugify(options.entityName);
  const uploadsDir = path.join(
    process.cwd(),
    "uploads",
    options.folderName,
    slugifiedEntityName
  );

  await fs.mkdir(uploadsDir, { recursive: true });

  const destination = path.join(uploadsDir, fileName);
  await fs.copyFile(localPath, destination);

  const relativePath = path
    .join(options.folderName, slugifiedEntityName, fileName)
    .replace(/\\\\/g, "/")
    .replace(/\\/g, "/");

  return `${process.env.BASE_STATIC_URL}/${relativePath}`;
}

export const handleNormalUploads = async (
  files: Express.Multer.File[],
  options: UploadOptions
): Promise<any[]> => {
  const slugifiedEntityName = slugify(options.entityName);

  const basePath = path.join(
    process.cwd(),
    "uploads",
    options.folderName,
    slugifiedEntityName
  );

  await fs.mkdir(basePath, { recursive: true });

  const moveFile = async (file: Express.Multer.File): Promise<any> => {
    const targetPath = path.join(basePath, file.originalname);
    await fs.rename(file.path, targetPath);

    const relativeUrl = path
      .join(options.folderName, slugifiedEntityName, file.originalname)
      .replace(/\\/g, "/");

    if (!options.fileData) {
      return `${process.env.BASE_STATIC_URL}/${relativeUrl}`;
    } else {
      return {
        url: `${process.env.BASE_STATIC_URL}/${relativeUrl}`,
        fileName: file.originalname,
        size: file.size,
        extName: path.extname(file.originalname).toLowerCase(),
      };
    }
  };

  const uploadedPaths = await Promise.all(files.map(moveFile));
  return uploadedPaths;
};

export const deleteUploadedFiles = async (
  filenames: string[],
  options: UploadOptions
): Promise<void> => {
  for (const raw of filenames) {
    let filePath: string;

    try {
      const url = new URL(raw);
      const pathname = url.pathname;

      const uploadPath = pathname.replace("/static/", "uploads/");
      filePath = path.join(process.cwd(), uploadPath);

      await fs.unlink(filePath);
    } catch (error) {
      console.warn(`Failed to delete file: ${raw}`, error);
    }
  }
};
export const deleteUploadFolder = async (options: UploadOptions): Promise<void> => {
  const slugifiedEntityName = slugify(options.entityName);

  const folderPath = path.join(
    process.cwd(),
    "uploads",
    options.folderName,
    slugifiedEntityName
  );

  try {
    await fs.rm(folderPath, { recursive: true, force: true });
    console.log(`Deleted folder: ${folderPath}`);
  } catch (error) {
    console.warn(`Failed to delete folder: ${folderPath}`, error);
  }
};
