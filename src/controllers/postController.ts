import catchAsync from "../utils/catchAsync";
import { NextFunction, Request, Response } from "express";

import AppError from "../utils/appError";
import { prisma } from "../lib/prisma";
import {
  deleteUploadedFiles,
  deleteUploadFolder,
  handleNormalUploads,
} from "../utils/handleNormalUpload";
import { cleanHtml } from "../utils";

export const getPosts = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { search } = req.query;

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 1;
    const skip = (page - 1) * limit;

    const filters: any = {};

    const user = req.user;

    filters.private = false;

    const allowedForPrivate = ["HEAD", "EXCOM", "MEMBER"];

    if (user && user.roles.some((role) => allowedForPrivate.includes(role))) {
      filters.private = true;
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where: filters,
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.post.count({
        where: filters,
      }),
    ]);

    res.status(200).json({
      status: "success",
      data: {
        total,
        page,
        pages: Math.ceil(total / limit),
        posts,
      },
    });
  }
);

export const createPost = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { title, content, privatePost } = req.body;

    const user = req.user;

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    const postDoc = await prisma.post.findUnique({
      where: {
        title,
      },
    });

    if (postDoc) {
      return next(new AppError("Post already exists", 400));
    }

    const files = req.files as {
      images?: Express.Multer.File[];
      videos?: Express.Multer.File[];
    };

    const cleanedContent = cleanHtml(content);

    const isPrivate = Boolean(privatePost);

    const post = await prisma.post.create({
      data: {
        title,
        content: cleanedContent,
        private: isPrivate,
        author: {
          connect: {
            id: user.id,
          },
        },
      },
    });

    let uploadedImages;
    let uploadedVideos;

    console.log("FILES", files);
    if (files.images) {
      uploadedImages = await handleNormalUploads(files.images, {
        folderName: "posts",
        entityName: title,
      });
    }
    if (files.videos) {
      uploadedVideos = await handleNormalUploads(files.videos, {
        folderName: "posts",
        entityName: title,
      });
    }

    const updatedPost = await prisma.post.update({
      where: {
        id: post.id,
      },
      data: {
        images: uploadedImages,
        videos: uploadedVideos,
      },
    });

    res.status(201).json({
      status: "success",
      data: { post: updatedPost },
    });
  }
);

export const deletePost = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;

    const post = await prisma.post.findUnique({ where: { id } });

    if (!post) {
      return next(new AppError("Post not found", 404));
    }

    const deletedPost = await prisma.post.delete({
      where: { id: id },
    });

    console.log("DELETED POST", deletedPost);

    await deleteUploadFolder({
      folderName: "posts",
      entityName: deletedPost.title,
    });

    res.status(200).json({
      status: "success",
      message: "Post has been deleted successfully",
    });
  }
);
