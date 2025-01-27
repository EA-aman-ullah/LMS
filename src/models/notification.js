import mongoose from "mongoose";

export const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: true,
    },
    isSeen: {
      type: Boolean,
      default: false,
      required: true,
    },
  },
  { timestamps: true }
);

const Notification = mongoose.model("Notifications", notificationSchema);
export default Notification;
