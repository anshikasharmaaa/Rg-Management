import Notification from "../models/Notification.js";
import { getIO } from "../socket/index.js";

export const createNotification = async ({
  recipientRole,
  recipientId = null,
  type,
  title,
  message,
  relatedEntityType = null,
  relatedEntityId = null,
}) => {
  try {
    const notification = await Notification.create({
      recipientRole,
      recipientId,
      type,
      title,
      message,
      relatedEntityType,
      relatedEntityId,
    });

    try {
      const io = getIO();
      const room =
        recipientRole === "EMPLOYEE" && recipientId
          ? `employee_${recipientId}`
          : "admin";
      io.to(room).emit("notification", notification);
    } catch (socketError) {
      console.error("Socket emit failed (notification):", socketError.message);
    }

    return notification;
  } catch (error) {
    console.error("Create notification error:", error.message);
    return null;
  }
};
