import { v2 as cloudinary } from "cloudinary";

// Configured lazily on first use. server.js calls dotenv.config() AFTER its
// imports are evaluated, so reading process.env at import time would give
// undefined values.
let configured = false;

export const isCloudinaryConfigured = () =>
  Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET,
  );

export const getCloudinary = () => {
  if (!configured) {
    if (!isCloudinaryConfigured()) {
      throw new Error("Cloudinary credentials are not configured");
    }
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
    configured = true;
  }
  return cloudinary;
};
