import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.hostinger.com",
  port: 465,
  secure: true, // true for 465, false for 587
  auth: {
    user: process.env.MAIL_USERNAME,
    pass: process.env.MAIL_PASS, // Better to use .env
  },
});

export default transporter;
