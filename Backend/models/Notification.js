import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipientRole: {
      type: String,
      enum: ["ADMIN", "EMPLOYEE"],
      required: true,
    },
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },
    type: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    relatedEntityType: {
      type: String,
      default: null,
    },
    relatedEntityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
