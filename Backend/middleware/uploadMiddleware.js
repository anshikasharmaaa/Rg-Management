import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Legacy only: images uploaded before the Cloudinary migration still live in
// backend/uploads/menu. New uploads never touch the disk.
const legacyUploadDir = path.join(__dirname, "..", "uploads", "menu");

const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const fileFilter = (req, file, cb) => {
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPG, PNG or WEBP images are allowed"));
  }
};

// Memory storage: the file is held in RAM just long enough to stream it to
// Cloudinary (see utils/cloudinaryUpload.js). No application-level size limit.
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
});

// Wrap multer's single-file middleware so upload errors return the project's
// standard error JSON shape instead of crashing / leaking a stack trace.
export const uploadMenuImage = (req, res, next) => {
  const handler = upload.single("image");
  handler(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || "Image upload failed",
        data: {},
      });
    }
    next();
  });
};

// Cleans up OLD images stored locally (imageUrl like /uploads/menu/xxx.jpg).
// basename() prevents a crafted imageUrl from escaping the uploads folder.
export const deleteMenuImageFile = (imageUrl) => {
  if (!imageUrl || !imageUrl.startsWith("/uploads/menu/")) return;
  const filePath = path.join(legacyUploadDir, path.basename(imageUrl));
  fs.unlink(filePath, () => {
    // best-effort cleanup; ignore errors (file may already be gone)
  });
};
