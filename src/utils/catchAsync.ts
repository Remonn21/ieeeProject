import { NextFunction, Request, Response } from "express";
// Define the type for controller functions
type AsyncController = (req: Request, res: Response, next: NextFunction) => Promise<any>;

export default function catchAsync(fn: AsyncController) {
  return async (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
