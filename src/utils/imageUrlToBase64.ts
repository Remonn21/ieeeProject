import * as fs from "fs/promises";
import path from "path";

export async function imageUrlToBase64(
  imageUrl: string
): Promise<{ base64: string; mimeType: string }> {
  try {
    const url = new URL(imageUrl);
    let relativePath = decodeURIComponent(url.pathname);
    if (relativePath.startsWith("/static")) {
      relativePath = relativePath.replace("/static", "");
    }

    const absolutePath = path.join(__dirname, "..", relativePath);
    console.log(relativePath, absolutePath);

    const fileBuffer = await fs.readFile(absolutePath);

    const ext = path.extname(absolutePath).toLowerCase();
    let mimeType = "image/jpeg";

    if (ext === ".png") mimeType = "image/png";
    else if (ext === ".webp") mimeType = "image/webp";
    else if (ext === ".jpg" || ext === ".jpeg") mimeType = "image/jpeg";
    else if (ext === ".svg") mimeType = "image/svg+xml";

    const base64 = fileBuffer.toString("base64");

    return { base64, mimeType };
  } catch (error) {
    console.error("Error reading file:", error);
    throw new Error("Failed to load picture");
  }
}
