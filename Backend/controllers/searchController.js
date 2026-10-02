import Order from "../models/Order.js";
import MenuItem from "../models/MenuItem.js";
import Category from "../models/Category.js";
import Table from "../models/Table.js";
import Employee from "../models/Employee.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";
import { isNonEmptyString } from "../utils/validators.js";

export const globalSearch = async (req, res) => {
  try {
    const { q } = req.query;

    if (!isNonEmptyString(q)) {
      return sendSuccess(res, 200, "Search results fetched successfully", {
        orders: [],
        menuItems: [],
        categories: [],
        tables: [],
        employees: [],
      });
    }

    const term = q.trim();
    const regex = { $regex: term, $options: "i" };

    const [orders, menuItems, categories, tables, employees] =
      await Promise.all([
        Order.find({
          $or: [
            { orderId: regex },
            { customerName: regex },
            { customerMobile: regex },
            { tableNumber: regex },
          ],
        })
          .limit(5)
          .select("orderId tableNumber customerName orderStatus totalAmount"),
        MenuItem.find({ name: regex })
          .limit(5)
          .select("name price isActive isAvailable"),
        Category.find({ name: regex }).limit(5).select("name isActive"),
        Table.find({ tableNumber: regex })
          .limit(5)
          .select("tableNumber status"),
        Employee.find({ $or: [{ name: regex }, { mobile: regex }] })
          .limit(5)
          .select("name mobile status"),
      ]);

    return sendSuccess(res, 200, "Search results fetched successfully", {
      orders,
      menuItems,
      categories,
      tables,
      employees,
    });
  } catch (error) {
    console.error("Global search error:", error);
    return sendError(res, 500, "Something went wrong while searching");
  }
};
