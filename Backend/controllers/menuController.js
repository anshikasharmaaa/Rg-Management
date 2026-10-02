import MenuItem from "../models/MenuItem.js";
import Category from "../models/Category.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";
import { isNonEmptyString } from "../utils/validators.js";
import { createNotification } from "../utils/notify.js";
import { deleteMenuImageFile } from "../middleware/uploadMiddleware.js";
import {
  uploadMenuImageBuffer,
  deleteCloudinaryImage,
  ImageUploadError,
} from "../utils/cloudinaryUpload.js";
import { getIO } from "../socket/index.js";

const FOOD_TYPES = ["VEG", "NON_VEG", "EGG"];

const DEFAULT_SEARCH_LIMIT = 8;
const MAX_SEARCH_LIMIT = 20;
const SEARCH_CANDIDATE_CAP = 50;

// Real-time sync: every write to the menu broadcasts a socket event so the
// Home page, Employee dashboard, and any other open Admin screens refetch
// automatically. Never fatal if sockets aren't connected.
const emitMenuEvent = (eventName, payload) => {
  try {
    getIO().emit(eventName, payload);
  } catch (error) {
    console.error(`Socket emit failed (${eventName}):`, error.message);
  }
};

const toBool = (value, fallback) => {
  if (value === undefined) return fallback;
  if (typeof value === "boolean") return value;
  return value === "true" || value === true;
};

const sendImageUploadError = (res, error) => {
  if (error instanceof ImageUploadError) {
    return sendError(res, error.statusCode, error.message);
  }
  console.error("Unexpected image upload error:", error);
  return sendError(res, 500, "Image upload failed. Please try again.");
};

// Removes a previously stored image: Cloudinary if we have a public_id,
// otherwise a legacy local file. Never throws, so callers can fire-and-forget
// without risking menu update/delete.
const removeStoredImage = ({ imageUrl, imagePublicId }) => {
  if (imagePublicId) return deleteCloudinaryImage(imagePublicId);
  deleteMenuImageFile(imageUrl);
  return Promise.resolve();
};

export const createMenuItem = async (req, res) => {
  try {
    const { name, description, price, category, type, imageUrl } = req.body;

    if (!isNonEmptyString(name)) {
      return sendError(res, 400, "Item name is required");
    }

    if (price === undefined || price === null || Number(price) < 0) {
      return sendError(res, 400, "A valid price is required");
    }

    if (!category) {
      return sendError(res, 400, "Category is required");
    }

    if (type && !FOOD_TYPES.includes(type)) {
      return sendError(res, 400, "Invalid food type");
    }

    const categoryDoc = await Category.findById(category);
    if (!categoryDoc) {
      return sendError(res, 404, "Selected category does not exist");
    }

    // Upload only AFTER validation passes, so a rejected request never
    // leaves an orphaned image in Cloudinary.
    let uploadedImage = null;
    if (req.file) {
      try {
        uploadedImage = await uploadMenuImageBuffer(req.file.buffer);
      } catch (uploadError) {
        return sendImageUploadError(res, uploadError);
      }
    }

    let menuItem;
    try {
      menuItem = await MenuItem.create({
        name: name.trim(),
        description: isNonEmptyString(description) ? description.trim() : "",
        price: Number(price),
        category: categoryDoc._id,
        type: type && FOOD_TYPES.includes(type) ? type : "VEG",
        // Uploaded file -> Cloudinary secure_url. A plain imageUrl string is
        // still accepted for backward compatibility.
        imageUrl: uploadedImage
          ? uploadedImage.url
          : isNonEmptyString(imageUrl)
            ? imageUrl.trim()
            : "",
        imagePublicId: uploadedImage ? uploadedImage.publicId : "",
        isActive: toBool(req.body.isActive, true),
        isAvailable: toBool(req.body.isAvailable, true),
      });
    } catch (createError) {
      // DB write failed after the upload: don't leave the image orphaned.
      if (uploadedImage) deleteCloudinaryImage(uploadedImage.publicId);
      throw createError;
    }

    const populated = await MenuItem.findById(menuItem._id).populate(
      "category",
      "name isActive",
    );

    // The item is already saved. A notification failure must never turn a
    // successful create into an error response.
    try {
      await createNotification({
        recipientRole: "ADMIN",
        type: "MENU_ITEM_CREATED",
        title: "Menu Item Added",
        message: `"${menuItem.name}" was added to the menu`,
        relatedEntityType: "MenuItem",
        relatedEntityId: menuItem._id,
      });
    } catch (notifyError) {
      console.error(
        "Menu created, but notification failed:",
        notifyError.message,
      );
    }

    emitMenuEvent("menu_item_created", populated);

    return sendSuccess(res, 201, "Menu item created successfully", {
      menuItem: populated,
    });
  } catch (error) {
    console.error("Create menu item error:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors)
        .map((err) => err.message)
        .join(", ");
      return sendError(res, 400, messages || "Menu item data is invalid");
    }

    if (error.name === "CastError") {
      return sendError(res, 400, "Invalid category ID");
    }

    return sendError(
      res,
      500,
      "Something went wrong while creating the menu item",
    );
  }
};

// Authenticated list — used by Admin Menu Management (sees everything)
// and, via the same shape, is safe for Employees too since role-gated
// write routes prevent any mutation from that side.
export const getMenuItems = async (req, res) => {
  try {
    const { search, category, isActive, isAvailable, type } = req.query;
    const filter = {};

    if (search && isNonEmptyString(search)) {
      filter.name = { $regex: search.trim(), $options: "i" };
    }

    if (category) filter.category = category;
    if (type && FOOD_TYPES.includes(type)) filter.type = type;

    if (isActive === "true") filter.isActive = true;
    if (isActive === "false") filter.isActive = false;

    if (isAvailable === "true") filter.isAvailable = true;
    if (isAvailable === "false") filter.isAvailable = false;

    const menuItems = await MenuItem.find(filter)
      .populate("category", "name isActive")
      .sort({ createdAt: -1 });

    return sendSuccess(res, 200, "Menu items fetched successfully", {
      menuItems,
    });
  } catch (error) {
    console.error("Get menu items error:", error);
    return sendError(
      res,
      500,
      "Something went wrong while fetching menu items",
    );
  }
};

// PUBLIC — no auth. Powers the Home page and public /menu page.
// Only ever returns items that are active + currently available.
export const getPublicMenu = async (req, res) => {
  try {
    const { search, category, type } = req.query;
    const filter = { isActive: true, isAvailable: true };

    if (search && isNonEmptyString(search)) {
      filter.name = { $regex: search.trim(), $options: "i" };
    }
    if (category) filter.category = category;
    if (type && FOOD_TYPES.includes(type)) filter.type = type;

    const menuItems = await MenuItem.find(filter)
      .select("-imagePublicId")
      .populate("category", "name")
      .sort({ createdAt: -1 });

    return sendSuccess(res, 200, "Menu fetched successfully", { menuItems });
  } catch (error) {
    console.error("Get public menu error:", error);
    return sendError(res, 500, "Something went wrong while fetching the menu");
  }
};

// PUBLIC — no auth. Powers the Home page search panel.
// Matches item name, description and category name. Same visibility rules as
// getPublicMenu (active + available only). `q` is already regex-escaped by the
// global sanitizeSearchQuery middleware.
export const searchPublicMenu = async (req, res) => {
  try {
    const { q } = req.query;

    if (!isNonEmptyString(q)) {
      return sendSuccess(res, 200, "Search results fetched successfully", {
        menuItems: [],
      });
    }

    const term = q.trim();
    const regex = { $regex: term, $options: "i" };
    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || DEFAULT_SEARCH_LIMIT, 1),
      MAX_SEARCH_LIMIT,
    );

    // Category is a reference, so resolve matching category ids first.
    const matchingCategories = await Category.find({ name: regex })
      .select("_id")
      .lean();

    const orConditions = [{ name: regex }, { description: regex }];
    if (matchingCategories.length > 0) {
      orConditions.push({
        category: { $in: matchingCategories.map((c) => c._id) },
      });
    }

    const candidates = await MenuItem.find({
      isActive: true,
      isAvailable: true,
      $or: orConditions,
    })
      .select("name price imageUrl type category")
      .populate("category", "name")
      .limit(SEARCH_CANDIDATE_CAP)
      .lean();

    // Rank: name starts with term > name contains term > category match > description.
    // The sanitizer backslash-escapes regex characters; undo that for plain comparison.
    const raw = term.replace(/\\(.)/g, "$1").toLowerCase();
    const rank = (item) => {
      const name = item.name.toLowerCase();
      if (name.startsWith(raw)) return 0;
      if (name.includes(raw)) return 1;
      if (item.category?.name?.toLowerCase().includes(raw)) return 2;
      return 3;
    };

    candidates.sort(
      (a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name),
    );

    return sendSuccess(res, 200, "Search results fetched successfully", {
      menuItems: candidates.slice(0, limit),
    });
  } catch (error) {
    console.error("Search public menu error:", error);
    return sendError(res, 500, "Something went wrong while searching the menu");
  }
};

// PUBLIC — no auth. Powers the /menu/:id details page.
// Active items only; an item marked unavailable is still viewable (the page
// shows a "Currently unavailable" badge) so shared links don't suddenly 404.
export const getPublicMenuItemById = async (req, res) => {
  try {
    const menuItem = await MenuItem.findOne({
      _id: req.params.id,
      isActive: true,
    })
      .select("-imagePublicId")
      .populate("category", "name");

    if (!menuItem) {
      return sendError(res, 404, "Menu item not found");
    }

    return sendSuccess(res, 200, "Menu item fetched successfully", {
      menuItem,
    });
  } catch (error) {
    // A malformed id can never match an item, so treat it as not found.
    if (error.name === "CastError") {
      return sendError(res, 404, "Menu item not found");
    }
    console.error("Get public menu item error:", error);
    return sendError(
      res,
      500,
      "Something went wrong while fetching the menu item",
    );
  }
};

export const getMenuItemById = async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id).populate(
      "category",
      "name isActive",
    );

    if (!menuItem) {
      return sendError(res, 404, "Menu item not found");
    }

    return sendSuccess(res, 200, "Menu item fetched successfully", {
      menuItem,
    });
  } catch (error) {
    console.error("Get menu item error:", error);

    if (error.name === "CastError") {
      return sendError(res, 400, "Invalid menu item ID");
    }

    return sendError(
      res,
      500,
      "Something went wrong while fetching the menu item",
    );
  }
};

export const updateMenuItem = async (req, res) => {
  try {
    const { name, description, price, category, type, imageUrl } = req.body;

    const menuItem = await MenuItem.findById(req.params.id);

    if (!menuItem) {
      return sendError(res, 404, "Menu item not found");
    }

    if (name !== undefined) {
      if (!isNonEmptyString(name)) {
        return sendError(res, 400, "Item name cannot be empty");
      }
      menuItem.name = name.trim();
    }

    if (description !== undefined) {
      menuItem.description = description.trim();
    }

    if (price !== undefined) {
      if (Number(price) < 0) {
        return sendError(res, 400, "Price cannot be negative");
      }
      menuItem.price = Number(price);
    }

    if (category !== undefined) {
      const categoryDoc = await Category.findById(category);
      if (!categoryDoc) {
        return sendError(res, 404, "Selected category does not exist");
      }
      menuItem.category = categoryDoc._id;
    }

    if (type !== undefined) {
      if (!FOOD_TYPES.includes(type)) {
        return sendError(res, 400, "Invalid food type");
      }
      menuItem.type = type;
    }

    // Image handling. All validation is done above, so uploading here can't
    // leave an orphan from a rejected request.
    //  - New file: upload to Cloudinary, remember the OLD image for cleanup.
    //  - Plain imageUrl string that differs (e.g. clearing it): update the URL.
    //  - Neither: leave the image untouched.
    let newImage = null;
    let replacedImage = null;

    if (req.file) {
      try {
        newImage = await uploadMenuImageBuffer(req.file.buffer);
      } catch (uploadError) {
        return sendImageUploadError(res, uploadError);
      }
      replacedImage = {
        imageUrl: menuItem.imageUrl,
        imagePublicId: menuItem.imagePublicId,
      };
      menuItem.imageUrl = newImage.url;
      menuItem.imagePublicId = newImage.publicId;
    } else if (
      typeof imageUrl === "string" &&
      imageUrl.trim() !== menuItem.imageUrl
    ) {
      replacedImage = {
        imageUrl: menuItem.imageUrl,
        imagePublicId: menuItem.imagePublicId,
      };
      menuItem.imageUrl = imageUrl.trim();
      menuItem.imagePublicId = "";
    }

    try {
      await menuItem.save();
    } catch (saveError) {
      // Save failed after upload: remove the new image, keep the old one.
      if (newImage) deleteCloudinaryImage(newImage.publicId);
      throw saveError;
    }

    // Only after a successful save do we remove the old image (fire-and-forget,
    // never throws). If it has no public_id, the URL was simply replaced.
    if (replacedImage) removeStoredImage(replacedImage);

    const populated = await MenuItem.findById(menuItem._id).populate(
      "category",
      "name isActive",
    );

    emitMenuEvent("menu_item_updated", populated);

    return sendSuccess(res, 200, "Menu item updated successfully", {
      menuItem: populated,
    });
  } catch (error) {
    console.error("Update menu item error:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors)
        .map((err) => err.message)
        .join(", ");
      return sendError(res, 400, messages || "Menu item data is invalid");
    }

    if (error.name === "CastError") {
      return sendError(res, 400, "Invalid ID provided");
    }

    return sendError(
      res,
      500,
      error.message || "Something went wrong while updating the menu item",
    );
  }
};

export const updateMenuItemStatus = async (req, res) => {
  try {
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return sendError(res, 400, "isActive must be true or false");
    }

    const menuItem = await MenuItem.findById(req.params.id);

    if (!menuItem) {
      return sendError(res, 404, "Menu item not found");
    }

    menuItem.isActive = isActive;
    await menuItem.save();

    emitMenuEvent("menu_item_updated", menuItem);

    return sendSuccess(
      res,
      200,
      `Menu item ${isActive ? "activated" : "deactivated"} successfully`,
      { menuItem },
    );
  } catch (error) {
    console.error("Update menu item status error:", error);

    if (error.name === "CastError") {
      return sendError(res, 400, "Invalid menu item ID");
    }

    return sendError(
      res,
      500,
      error.message || "Something went wrong while updating menu item status",
    );
  }
};

export const updateMenuItemAvailability = async (req, res) => {
  try {
    const { isAvailable } = req.body;

    if (typeof isAvailable !== "boolean") {
      return sendError(res, 400, "isAvailable must be true or false");
    }

    const menuItem = await MenuItem.findById(req.params.id);

    if (!menuItem) {
      return sendError(res, 404, "Menu item not found");
    }

    menuItem.isAvailable = isAvailable;
    await menuItem.save();

    emitMenuEvent("menu_item_updated", menuItem);

    return sendSuccess(
      res,
      200,
      `Menu item marked ${isAvailable ? "available" : "unavailable"}`,
      { menuItem },
    );
  } catch (error) {
    console.error("Update menu item availability error:", error);

    if (error.name === "CastError") {
      return sendError(res, 400, "Invalid menu item ID");
    }

    return sendError(
      res,
      500,
      error.message ||
        "Something went wrong while updating menu item availability",
    );
  }
};

export const deleteMenuItem = async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);

    if (!menuItem) {
      return sendError(res, 404, "Menu item not found");
    }

    const storedImage = {
      imageUrl: menuItem.imageUrl,
      imagePublicId: menuItem.imagePublicId,
    };

    // The DB delete is what matters. Remove the image only afterwards, and
    // never let an image-cleanup failure affect the response.
    await menuItem.deleteOne();
    removeStoredImage(storedImage);

    emitMenuEvent("menu_item_deleted", { id: req.params.id });

    return sendSuccess(res, 200, "Menu item deleted successfully", {});
  } catch (error) {
    console.error("Delete menu item error:", error);

    if (error.name === "CastError") {
      return sendError(res, 400, "Invalid menu item ID");
    }

    return sendError(
      res,
      500,
      "Something went wrong while deleting the menu item",
    );
  }
};
