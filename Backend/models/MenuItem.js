import mongoose from "mongoose";

const menuItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Item name is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
    },
    // NEW: food type (veg / non-veg / egg)
    type: {
      type: String,
      enum: ["VEG", "NON_VEG", "EGG"],
      default: "VEG",
    },
    // Cloudinary secure_url (or a legacy /uploads/menu/... path for old items)
    imageUrl: {
      type: String,
      trim: true,
      default: "",
    },
    // Cloudinary public_id, used to delete/replace the image. Empty for
    // legacy items and items without an image.
    imagePublicId: {
      type: String,
      trim: true,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

const MenuItem = mongoose.model("MenuItem", menuItemSchema);

export default MenuItem;
