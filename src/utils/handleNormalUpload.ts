import * as fs from "fs/promises";
import path from "path";
import slugify from "slugify";

export type UploadOptions = {
  folderName: string; // e.g. "projects" or "tasks"
  entityName: string; // e.g. project name or task ID
};

export const handleNormalUploads = async (
  files: Express.Multer.File[],
  options: UploadOptions
): Promise<string[]> => {
  const slugifiedEntityName = slugify(options.entityName);

  const basePath = path.join(
    process.cwd(),
    "uploads",
    options.folderName,
    slugifiedEntityName
  );

  await fs.mkdir(basePath, { recursive: true });

  const moveFile = async (file: Express.Multer.File): Promise<string> => {
    const targetPath = path.join(basePath, file.originalname);
    await fs.rename(file.path, targetPath);

    const relativeUrl = path
      .join(options.folderName, slugifiedEntityName, file.originalname)
      .replace(/\\/g, "/");

    return `${process.env.BASE_STATIC_URL}/${relativeUrl}`;
  };

  const uploadedPaths = await Promise.all(files.map(moveFile));
  return uploadedPaths;
};

export const deleteUploadedFiles = async (
  filenames: string[],
  options: UploadOptions
): Promise<void> => {
  const slugifiedEntityName = slugify(options.entityName);

  const basePath = path.join(
    process.cwd(),
    "uploads",
    options.folderName,
    slugifiedEntityName
  );

  for (const filename of filenames) {
    const filePath = path.join(basePath, filename);
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.warn(`Failed to delete file: ${filePath}`, error);
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
