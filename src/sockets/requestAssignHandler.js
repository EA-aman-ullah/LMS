import mongoose from "mongoose";
import RequestsBorrows from "../models/requestsBorrows.js";
import Book from "../models/book.js";
import User from "../models/user.js";
import Notification from "../models/notification.js";

export default (io, socket, users) => {
  socket.on("assign", async (data, callback) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      let request = await RequestsBorrows.findById(data.requestId);
      if (!request)
        return callback({
          success: false,
          message: "The Request with the given id was not found",
        });

      if (request.isAssigned)
        return callback({
          success: false,
          message: "The Request is Already Assigned !",
        });

      const book = await Book.findById(request.book);
      const student = await User.findById(request.user);
      if (!book || !student)
        return callback({
          success: false,
          message: "Related Student or Book was not found",
        });

      let notification = new Notification({
        userId: request.user,
        bookId: request.book,
      });

      await notification.save({ session });

      notification = {
        ...notification.toObject(),
        message: `The Book ${book.name} has Assigned to you`,
      };

      request.isAssigned = true;
      request.dateAssign = Date.now();
      request.dateReturn = new Date(
        new Date().setDate(new Date().getDate() + 30)
      );

      request = await request.save({ session });

      book.reservedNumber--;
      book.returnableBooks++;
      await book.save({ session });

      student.requestApproved--;
      student.returnableBooks++;
      await student.save({ session });

      await session.commitTransaction();
      session.endSession();

      if (users[request.user]) {
        users[request.user].forEach((socketId) => {
          io.to(socketId).emit("assigned", { request, notification });
        });
      }

      callback({ success: true, message: "Book Assigned Seccessfully" });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      console.log(error);
      socket.emit("error", { message: "Internal Server Error" });
    }
  });
};
