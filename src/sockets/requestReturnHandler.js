import mongoose from "mongoose";
import RequestsBorrows from "../models/requestsBorrows.js";
import Book from "../models/book.js";
import User from "../models/user.js";
import Notification from "../models/notification.js";

export default (io, socket, users) => {
  socket.on("return", async (data, callback) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      let request = await RequestsBorrows.findById(data.requestId);

      if (!request)
        return callback({
          success: false,
          message: "The request with the given id was not found",
        });

      if (request.isReturned)
        return callback({
          success: false,
          message: "The Book Already Returned",
        });

      const student = await User.findById(request.user);
      if (!student)
        return callback({
          success: false,
          message: "The assosiated student was not found",
        });

      const book = await Book.findById(request.book);
      if (!book)
        return callback({
          success: false,
          message: "The assosiated book was not found",
        });

      let notification = new Notification({
        userId: request.user,
        bookId: request.book,
      });

      await notification.save({ session });

      notification = {
        ...notification.toObject(),
        message: `The Book ${book.name} has Returned`,
      };

      request.isReturned = true;
      await request.save({ session });

      student.returnableBooks--;
      await student.save({ session });

      book.numberInStock++;
      book.returnableBooks--;
      await book.save({ session });

      await session.commitTransaction();
      session.endSession();

      if (users[request.user]) {
        users[request.user].forEach((socketId) => {
          io.to(socketId).emit("returned", { request, notification });
        });
      }

      callback({ success: true, message: "Book Returned Seccessfully" });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      console.log(error);
      socket.emit("error", { message: "Internal Server Error" });
    }
  });
};
