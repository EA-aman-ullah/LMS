import mongoose from "mongoose";
import RequestsBorrows from "../models/requestsBorrows.js";
import User from "../models/user.js";
import Notification from "../models/notification.js";
import Book from "../models/book.js";

export default (io, socket, users) => {
  socket.on("approve", async (data, callback) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      let request = await RequestsBorrows.findById(data.requestId);
      if (!request)
        return callback({
          success: false,
          message: "The request with given Id was not found",
        });

      if (request.isApproved)
        return callback({
          success: false,
          message: "This Request is Already Approved",
        });

      const student = await User.findById(request.user);

      if (!student)
        return callback({
          success: false,
          message: "The Related strudent was not found",
        });

      const book = await Book.findById(request.book);
      if (!book) return callback({ success: false, message: "Invalid Book" });

      let notification = new Notification({
        userId: request.user,
        bookId: request.book,
      });

      await notification.save({ session });

      notification = {
        ...notification.toObject(),
        message: `Your Request for ${book.name} has Approved`,
      };

      request.isApproved = true;
      request = await request.save({ session });

      student.requestPending--;
      student.requestApproved++;
      await student.save({ session });

      await session.commitTransaction();
      session.endSession();

      if (users[request.user]) {
        users[request.user].forEach((socketId) => {
          io.to(socketId).emit("approved", { request, notification });
        });
      }

      callback({ success: true, message: "Request Apperoved Seccessfully" });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      console.log(error);
      socket.emit("error", { message: "Internal Server Error" });
    }
  });
};
