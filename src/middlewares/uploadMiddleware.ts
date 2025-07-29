import multer, { FileFilterCallback } from "multer";
import path from "path";
import { Request } from "express";
import fs from "fs";
import { randomBytes } from "crypto";

export const allowedMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "video/mp4",
  "video/quicktime",
  "video/x-msvideo",
  "video/x-matroska",
  "application/octet-stream",
];

export const allowedExtensions = [
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".mp4",
  ".mov",
  ".avi",
  ".mkv",
];

export const createUploadMiddleware = (dirname: string) => {
  const userFolder = path.join(__dirname, "../uploads", dirname);

  if (!fs.existsSync(userFolder)) {
    fs.mkdirSync(userFolder, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, userFolder);
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      const name = path.basename(file.originalname, ext);
      const uniqueSuffix = `${Date.now()}-${randomBytes(4).toString("hex")}`;
      cb(null, `${name}-${uniqueSuffix}${ext}`);
    },
  });

  const fileFilter = (
    _req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback
  ) => {
    const fileExt = path.extname(file.originalname).toLowerCase();
    const isValidMime = allowedMimeTypes.includes(file.mimetype);
    const isValidExt = allowedExtensions.includes(fileExt);

    if (!isValidMime || !isValidExt) {
      return cb(new Error("Only image files are allowed (jpg, png, gif, webp)."));
    }

    cb(null, true);
  };

  return multer({
    storage,
    fileFilter,
    limits: { fileSize: 1000 * 1024 * 1024 }, // 10MB max per image
  });
};
