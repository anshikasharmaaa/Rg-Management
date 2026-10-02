import sharp from "sharp";
import { getCloudinary, isCloudinaryConfigured } from "../config/cloudinary.js";

const MENU_IMAGE_FOLDER = "rg-restaurant/menu";

// Cloudinary SDK default made explicit. A healthy upload finishes far below
// this. The hard deadline is a safety net so the HTTP request can never hang.
const UPLOAD_TIMEOUT_MS = 60000;
const HARD_DEADLINE_MS = UPLOAD_TIMEOUT_MS + 5000;
const MAX_ATTEMPTS = 2; // one retry, only for transient network errors

// Not a size limit: nothing is rejected. Large photos are re-encoded to a
// sensible size BEFORE the (slow) upload to Cloudinary. Originals larger than
// this on the long edge are never needed: delivery is capped at 1200px anyway.
const MAX_DIMENSION = 2000;
const WEBP_QUALITY = 85;

// Carries a message that is safe to show to the admin.
export class ImageUploadError extends Error {
  constructor(message, statusCode = 502) {
    super(message);
    this.name = "ImageUploadError";
    this.statusCode = statusCode;
  }
}

const isTimeout = (error) =>
  error?.http_code === 499 || error?.name === "TimeoutError";

const isTransientNetworkError = (error) =>
  /ECONNRESET|EPIPE|ENOTFOUND|EAI_AGAIN|socket hang up/i.test(
    `${error?.code || ""} ${error?.message || ""}`,
  );

const toUploadError = (error) => {
  const status = error?.http_code;
  const message = typeof error?.message === "string" ? error.message : "";

  if (isTimeout(error)) {
    return new ImageUploadError(
      "Image upload timed out. Please check your internet connection and try again.",
      504,
    );
  }
  // Cloudinary's own plan/account cap ("File size too large. Got X. Maximum is Y.")
  // is infrastructure, not an app rule, so we pass its message through.
  if (status === 400 && /file size|too large/i.test(message)) {
    return new ImageUploadError(message, 413);
  }
  if (status === 400) {
    return new ImageUploadError(
      "The image could not be processed. Please try a different file.",
      400,
    );
  }
  // Auth/config problems (401/403) and network errors: don't leak details.
  return new ImageUploadError("Image upload failed. Please try again.", 502);
};

// Re-encodes the photo to a web-appropriate size. Falls back to the original
// buffer if anything goes wrong, so this can never block an upload.
const optimizeForUpload = async (buffer) => {
  const started = Date.now();
  try {
    const optimized = await sharp(buffer)
      .rotate() // respect EXIF orientation before metadata is dropped
      .resize({
        width: MAX_DIMENSION,
        height: MAX_DIMENSION,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();

    if (optimized.length >= buffer.length) return buffer;

    console.log(
      `Image optimized: ${buffer.length} -> ${optimized.length} bytes in ${
        Date.now() - started
      }ms`,
    );
    return optimized;
  } catch (error) {
    console.warn("Image optimization skipped:", error.message);
    return buffer;
  }
};

// One upload attempt. Always settles exactly once.
const uploadOnce = (cloudinary, buffer) =>
  new Promise((resolve, reject) => {
    let settled = false;
    let deadline;

    const finish = (fn, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(deadline);
      fn(value);
    };

    const stream = cloudinary.uploader.upload_stream(
      {
        folder: MENU_IMAGE_FOLDER,
        resource_type: "image",
        unique_filename: true,
        overwrite: false,
        timeout: UPLOAD_TIMEOUT_MS,
      },
      (error, result) => {
        if (error || !result) {
          return finish(
            reject,
            error || new Error("Empty Cloudinary response"),
          );
        }
        finish(resolve, { url: result.secure_url, publicId: result.public_id });
      },
    );

    deadline = setTimeout(() => {
      try {
        stream.destroy?.();
      } catch {
        /* ignore */
      }
      finish(reject, {
        name: "TimeoutError",
        http_code: 499,
        message: "Upload deadline exceeded",
      });
    }, HARD_DEADLINE_MS);

    stream.on("error", (err) => finish(reject, err));
    stream.end(buffer);
  });

// Streams an in-memory buffer to Cloudinary. Nothing touches the disk.
export const uploadMenuImageBuffer = async (inputBuffer) => {
  if (!isCloudinaryConfigured()) {
    console.error("Cloudinary env variables are missing");
    throw new ImageUploadError(
      "Image storage is not configured on the server",
      500,
    );
  }

  if (!inputBuffer || !inputBuffer.length) {
    throw new ImageUploadError("The uploaded image is empty.", 400);
  }

  const buffer = await optimizeForUpload(inputBuffer);
  const cloudinary = getCloudinary();
  let lastError;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const started = Date.now();
    try {
      const result = await uploadOnce(cloudinary, buffer);
      console.log(
        `Cloudinary upload OK in ${Date.now() - started}ms (${buffer.length} bytes)`,
      );
      return result;
    } catch (error) {
      lastError = error;
      console.error(
        `Cloudinary upload attempt ${attempt}/${MAX_ATTEMPTS} failed after ${
          Date.now() - started
        }ms (${buffer.length} bytes):`,
        error?.message || error,
      );
      // Retry only quick, transient connection errors. Never retry a timeout
      // (would double the wait) or a 4xx (would fail again).
      if (!isTransientNetworkError(error)) break;
    }
  }

  throw toUploadError(lastError);
};

// Best-effort: NEVER throws, so it can't break menu update/delete.
export const deleteCloudinaryImage = async (publicId) => {
  if (!publicId) return;
  try {
    if (!isCloudinaryConfigured()) {
      console.warn("Skipping Cloudinary delete: credentials not configured");
      return;
    }
    const result = await getCloudinary().uploader.destroy(publicId, {
      resource_type: "image",
      invalidate: true,
    });
    if (result?.result !== "ok" && result?.result !== "not found") {
      console.warn(
        `Cloudinary delete returned "${result?.result}" for ${publicId}`,
      );
    }
  } catch (error) {
    console.error(`Cloudinary delete failed for ${publicId}:`, error.message);
  }
};
