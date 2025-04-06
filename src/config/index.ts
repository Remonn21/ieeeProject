import dotenv from "dotenv";

dotenv.config();

interface Config {
  port: number;
  nodeEnv: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  JWT_COOKIE_EXPIRES_IN: string;
}

const config: Config = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || "development",
  JWT_SECRET: process.env.JWT_SECRET || "VERY_SECRET_KEY",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "9d",
  JWT_COOKIE_EXPIRES_IN: process.env.JWT_COOKIE_EXPIRES_IN || "9d",
};

export default config;
