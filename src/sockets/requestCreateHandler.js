import RequestsBorrows from "../models/requestsBorrows.js";
import { validateRequestBorrow } from "../models/requestsBorrows.js";
import User from "../models/user.js";
import Book from "../models/book.js";
import mongoose from "mongoose";

export default (io, socket) => {
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

      const request = await RequestsBorrows.find(
        {
          user: socket.user._id,
          book: data.bookId,
        },
        { _id: 0, isApproved: 1, isReturned: 1 }
      );
      let noRequestPending = request.every((el) => {
        return el.isApproved === true && el.isReturned === true;
      });

      if (!noRequestPending)
        return callback({
          success: false,
          message: "you are alread send request for this book",
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

      newRequest = await newRequest.save({ session });

      student.requestPending++;
      await student.save({ session });

      book.numberInStock--;
      book.reservedNumber++;
      await book.save({ session });

      await session.commitTransaction();
      session.endSession();

      io.emit("request", newRequest);
      callback({ success: true, message: "Request Created Seccessfully" });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      console.log(error);
      socket.emit("error", { message: "Internal Server Error" });
    }
  });
};
