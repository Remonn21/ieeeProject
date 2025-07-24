import transporter from "../config/mailer";
import { prisma } from "../lib/prisma";

interface SendMailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export const sendEmail = async (options: SendMailOptions): Promise<void> => {
  const mailOptions = {
    from: `"IEEE BUB SB" <${process.env.MAIL_USERNAME}>`,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    // await prisma.sentEmail.create({
    //   data: {
    //     to: options.to,
    //     subject: options.subject,
    //     html: (options.text || options.html) as string,
    //   },
    // });
  } catch (error) {
    console.error("Error sending email:", error);
  }
};
