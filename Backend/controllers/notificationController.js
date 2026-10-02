import Notification from "../models/Notification.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";

const getRecipientFilter = (req) => {
  if (req.user.role === "admin") {
    return { recipientRole: "ADMIN" };
  }
  return { recipientRole: "EMPLOYEE", recipientId: req.user.id };
};

export const getNotifications = async (req, res) => {
  try {
    const filter = getRecipientFilter(req);

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(100);
    const unreadCount = await Notification.countDocuments({
      ...filter,
      isRead: false,
    });

    return sendSuccess(res, 200, "Notifications fetched successfully", {
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    return sendError(
      res,
      500,
      "Something went wrong while fetching notifications",
    );
  }
};

export const markNotificationRead = async (req, res) => {
  try {
    const filter = { _id: req.params.id, ...getRecipientFilter(req) };
    const notification = await Notification.findOne(filter);

    if (!notification) {
      return sendError(res, 404, "Notification not found");
    }

    notification.isRead = true;
    await notification.save();

    return sendSuccess(res, 200, "Notification marked as read", {
      notification,
    });
  } catch (error) {
    console.error("Mark notification read error:", error);

    if (error.name === "CastError") {
      return sendError(res, 400, "Invalid notification ID");
    }

    return sendError(
      res,
      500,
      "Something went wrong while updating the notification",
    );
  }
};

export const markAllNotificationsRead = async (req, res) => {
  try {
    const filter = getRecipientFilter(req);
    await Notification.updateMany(
      { ...filter, isRead: false },
      { $set: { isRead: true } },
    );

    return sendSuccess(res, 200, "All notifications marked as read", {});
  } catch (error) {
    console.error("Mark all notifications read error:", error);
    return sendError(
      res,
      500,
      "Something went wrong while updating notifications",
    );
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const filter = { _id: req.params.id, ...getRecipientFilter(req) };
    const notification = await Notification.findOne(filter);

    if (!notification) {
      return sendError(res, 404, "Notification not found");
    }

    await notification.deleteOne();

    return sendSuccess(res, 200, "Notification deleted successfully", {});
  } catch (error) {
    console.error("Delete notification error:", error);

    if (error.name === "CastError") {
      return sendError(res, 400, "Invalid notification ID");
    }

    return sendError(
      res,
      500,
      "Something went wrong while deleting the notification",
    );
  }
};
