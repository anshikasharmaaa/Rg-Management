import Category from "../models/Category.js";
import MenuItem from "../models/MenuItem.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";
import { isNonEmptyString } from "../utils/validators.js";
import { createNotification } from "../utils/notify.js";

export const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!isNonEmptyString(name)) {
      return sendError(res, 400, "Category name is required");
    }

    const cleanName = name.trim();

    const existing = await Category.findOne({ name: cleanName });
    if (existing) {
      return sendError(res, 409, "A category with this name already exists");
    }

    const category = await Category.create({
      name: cleanName,
      description: isNonEmptyString(description) ? description.trim() : "",
    });

    await createNotification({
      recipientRole: "ADMIN",
      type: "CATEGORY_CREATED",
      title: "Category Added",
      message: `Category "${category.name}" was added`,
      relatedEntityType: "Category",
      relatedEntityId: category._id,
    });

    return sendSuccess(res, 201, "Category created successfully", { category });
  } catch (error) {
    console.error("Create category error:", error);

    if (error.code === 11000) {
      return sendError(res, 409, "A category with this name already exists");
    }

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors)
        .map((err) => err.message)
        .join(", ");
      return sendError(res, 400, messages || "Category data is invalid");
    }

    return sendError(
      res,
      500,
      error.message || "Something went wrong while creating the category",
    );
  }
};

export const getCategories = async (req, res) => {
  try {
    const { search, status } = req.query;
    const filter = {};

    if (search && isNonEmptyString(search)) {
      filter.name = { $regex: search.trim(), $options: "i" };
    }

    if (status === "ACTIVE") filter.isActive = true;
    if (status === "INACTIVE") filter.isActive = false;

    const categories = await Category.find(filter).sort({ createdAt: -1 });

    return sendSuccess(res, 200, "Categories fetched successfully", {
      categories,
    });
  } catch (error) {
    console.error("Get categories error:", error);
    return sendError(
      res,
      500,
      "Something went wrong while fetching categories",
    );
  }
};

export const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return sendError(res, 404, "Category not found");
    }

    return sendSuccess(res, 200, "Category fetched successfully", { category });
  } catch (error) {
    console.error("Get category error:", error);

    if (error.name === "CastError") {
      return sendError(res, 400, "Invalid category ID");
    }

    return sendError(
      res,
      500,
      "Something went wrong while fetching the category",
    );
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    const category = await Category.findById(req.params.id);

    if (!category) {
      return sendError(res, 404, "Category not found");
    }

    if (name !== undefined) {
      if (!isNonEmptyString(name)) {
        return sendError(res, 400, "Category name cannot be empty");
      }

      const cleanName = name.trim();

      const duplicate = await Category.findOne({
        name: cleanName,
        _id: { $ne: category._id },
      });

      if (duplicate) {
        return sendError(
          res,
          409,
          "Another category with this name already exists",
        );
      }

      category.name = cleanName;
    }

    if (description !== undefined) {
      category.description = description.trim();
    }

    await category.save();

    return sendSuccess(res, 200, "Category updated successfully", { category });
  } catch (error) {
    console.error("Update category error:", error);

    if (error.code === 11000) {
      return sendError(
        res,
        409,
        "Another category with this name already exists",
      );
    }

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors)
        .map((err) => err.message)
        .join(", ");
      return sendError(res, 400, messages || "Category data is invalid");
    }

    if (error.name === "CastError") {
      return sendError(res, 400, "Invalid category ID");
    }

    return sendError(
      res,
      500,
      error.message || "Something went wrong while updating the category",
    );
  }
};

export const updateCategoryStatus = async (req, res) => {
  try {
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return sendError(res, 400, "isActive must be true or false");
    }

    const category = await Category.findById(req.params.id);

    if (!category) {
      return sendError(res, 404, "Category not found");
    }

    category.isActive = isActive;
    await category.save();

    return sendSuccess(
      res,
      200,
      `Category ${isActive ? "activated" : "deactivated"} successfully`,
      { category },
    );
  } catch (error) {
    console.error("Update category status error:", error);

    if (error.name === "CastError") {
      return sendError(res, 400, "Invalid category ID");
    }

    return sendError(
      res,
      500,
      error.message || "Something went wrong while updating category status",
    );
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return sendError(res, 404, "Category not found");
    }

    const linkedItemsCount = await MenuItem.countDocuments({
      category: category._id,
    });

    if (linkedItemsCount > 0) {
      return sendError(
        res,
        409,
        `Cannot delete this category — ${linkedItemsCount} menu item(s) are assigned to it. Reassign or delete those items first, or deactivate the category instead.`,
      );
    }

    await category.deleteOne();

    return sendSuccess(res, 200, "Category deleted successfully", {});
  } catch (error) {
    console.error("Delete category error:", error);

    if (error.name === "CastError") {
      return sendError(res, 400, "Invalid category ID");
    }

    return sendError(
      res,
      500,
      "Something went wrong while deleting the category",
    );
  }
};
