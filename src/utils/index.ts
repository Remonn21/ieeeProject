import sanitizeHtml from "sanitize-html";
import crypto from "crypto";
import slugify from "slugify";
import { parse } from "date-fns";

export const generateSlug = (name: string): string => {
  let slug = slugify(name, { lower: true, strict: true });

  const words = slug.split("-");

  let trimmedSlug = "";
  for (const word of words) {
    if ((trimmedSlug + "-" + word).length > 50) break;
    trimmedSlug += (trimmedSlug ? "-" : "") + word;
  }

  return trimmedSlug;
};

export function generateRandomPassword(length = 10) {
  return crypto.randomBytes(length).toString("base64").slice(0, length);
}

export const cleanHtml = (inputValue: string): string => {
  return sanitizeHtml(inputValue, {
    allowedTags: [
      "h1",
      "h2",
      "h3",
      "p",
      "img",
      "ul",
      "li",
      "strong",
      "em",
      "sub",
      "sup",
      "u",
    ],
    allowedAttributes: {
      img: ["src", "alt"],
      "*": ["style", "class"],
    },
    allowedStyles: {
      "*": {
        color: [/^#[0-9a-fA-F]{3,6}$/, /^rgb\(/, /^rgba\(/],
        "background-color": [/^#[0-9a-fA-F]{3,6}$/, /^rgb\(/, /^rgba\(/],
        "text-align": [/^left$/, /^right$/, /^center$/],
        "font-size": [/^\d+(?:px|em|%)$/],
        "font-weight": [/^\d+$/],
        "text-decoration": [/^underline$/, /^line-through$/, /^none$/],
        "font-family": [/^[a-zA-Z\s,"']+$/],
      },
    },
  });
};
/** I  have generated the explainion using AI
 * Parse a time string given in "HH:mm" format to a Date object with the given date.
 * @param {string} timeStr - The time string given in "HH:mm" format.
 * @param {Date} date - The date object to pair with the time string.
 * @returns {Date} - A new Date object with the given date and time.
 */

export const parseTimeInHours = (timeStr: string, date: Date) => {
  return parse(
    `${date.toISOString().split("T")[0]} ${timeStr}`,
    "yyyy-MM-dd HH:mm",
    new Date()
  );
};
