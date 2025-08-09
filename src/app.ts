import express, { NextFunction, Request, Response } from "express";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import cors from "cors";

import apiRoutes from "./routes";

// import companyRoutes from "./routes/superAdmin/companyRoutes";
// import subscriptionRoutes from "./routes/superAdmin/subscriptionRoutes";
// import departmentRoutes from "./routes/company/departmentRoutes";
// import employeeRoutes from "./routes/company/employeeRoutes";
// import companyRoleRoutes from "./routes/superAdmin/companyRoleRoutes";
import ErrorController from "./controllers/ErrorController";
import { protect, UserWithRelations } from "./controllers/authController";
import AppError from "./utils/appError";
import path from "path";
import { isSuperAdmin } from "./middlewares/isAdmin";
const app = express();

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: UserWithRelations;
      authToken?: string;
    }
  }
}

app.use(
  cors({
    origin: [
      "http://localhost:3001",
      "http://localhost:3002",
      "http://localhost:7000",
      "http://localhost:4000",
    ],
    credentials: true,
  })
);

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ message: "Server is running" });
});

app.use(cookieParser());
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

app.use(
  "/static",
  express.static(
    path.join(
      __dirname,
      process.env.NODE_ENV === "development" ? "../uploads" : "./uploads"
    )
  )
);

app.use(
  "/private",
  protect,
  isSuperAdmin,
  express.static(
    path.join(
      __dirname,
      process.env.NODE_ENV === "development" ? "../privateUploads" : "./privateUploads"
    )
  )
);
console.log("Static folder mapped to:", path.join(__dirname, "../uploads"));

app.use("/api", apiRoutes);

app.use((req: Request, res: Response, next: NextFunction) => {
  return next(new AppError("endpoint not found", 400));
});

app.use(ErrorController);

export default app;
