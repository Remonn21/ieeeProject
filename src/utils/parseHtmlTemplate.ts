import fs from "fs/promises";
import path from "path";

export const parseHtmlTemplate = async (
  templatePath: string,
  replacements: Record<string, string>,
  options?: { includeLoginBlock?: boolean }
): Promise<string> => {
  let template = await fs.readFile(templatePath, "utf-8");

  for (const [key, value] of Object.entries(replacements)) {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g");
    template = template.replace(regex, value);
  }

  // Handle conditional login block
  if (options?.includeLoginBlock) {
    template = template.replace(/{{#loginBlock}}([\s\S]*?){{\/loginBlock}}/g, "$1");
  } else {
    template = template.replace(/{{#loginBlock}}([\s\S]*?){{\/loginBlock}}/g, "");
  }

  return template;
};
