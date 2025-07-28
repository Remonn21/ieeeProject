import { Season } from "@prisma/client";
import { prisma } from "./prisma";
import AppError from "../utils/appError";

let cachedSeason: null | Season = null;
let cacheTimestamp = 0;

export async function getCurrentSeason() {
  const now = new Date();
  if (!cachedSeason || Date.now() - cacheTimestamp > 5 * 60 * 1000) {
    cachedSeason = await prisma.season.findFirst({
      where: {
        startDate: { lte: now },
        endDate: { gte: now },
      },
    });
    cacheTimestamp = Date.now();

    if (!cachedSeason) {
      cachedSeason = await prisma.season.findFirst({
        orderBy: {
          startDate: "desc",
        },
      });
    }
  }

  if (!cachedSeason) {
    console.error("No active season were found");
    throw new AppError("coudln't found an active season", 404);
  }
  return cachedSeason;
}
