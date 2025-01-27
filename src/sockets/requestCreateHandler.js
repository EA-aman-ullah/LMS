import RequestsBorrows from "../models/requestsBorrows.js";
import { validateRequestBorrow } from "../models/requestsBorrows.js";
import User from "../models/user.js";
import Book from "../models/book.js";
import mongoose from "mongoose";
import Notification from "../models/notification.js";

export default (io, socket, users) => {
  socket.on("createRequest", async (data, callback) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { error } = validateRequestBorrow(data);
      if (error)
        return callback({ success: false, message: error.details[0].message });

      const student = await User.findById(socket.user._id);
      if (!student)
        return callback({ success: false, message: "Invalid Students" });

      const book = await Book.findById(data.bookId);
      if (!book) return callback({ success: false, message: "Invalid Book" });

      if (book.numberInStock === 0)
        return callback({ success: false, message: "Book Not in stock" });

      const requestExist = await RequestsBorrows.find({
        user: socket.user._id,
        book: data.bookId,
        isReturned: false,
      });

      if (requestExist.length > 0)
        return callback({
          success: false,
          message: "Please Follow The Privious Request Process Of This Book",
        });

      let borrowQuantity = await RequestsBorrows.countDocuments({
        user: socket.user._id,
        isReturned: false,
      });

      if (borrowQuantity > 5)
        return callback({ success: false, message: "Request Limit Exceeded" });

      let newRequest = new RequestsBorrows({
        user: socket.user._id,
        book: data.bookId,
      });

      let notification = new Notification({
        userId: socket.user._id,
        bookId: data.bookId,
      });

      notification = await notification.save({ session });

      notification = {
        ...notification.toObject(),
        message: `New Request for ${book.name} by ${student.name}`,
      };

      newRequest = await newRequest.save({ session });

      student.requestPending++;
      await student.save({ session });

      book.numberInStock--;
      book.reservedNumber++;
      await book.save({ session });

      await session.commitTransaction();
      session.endSession();

      if (users["admin"]) {
        users["admin"].forEach((socketId) => {
          io.to(socketId).emit("request", { newRequest, notification });
        });
      }
      callback({ success: true, message: "Request Created Seccessfully" });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      console.log(error);
      socket.emit("error", { message: "Internal Server Error" });
    }
  });
};
