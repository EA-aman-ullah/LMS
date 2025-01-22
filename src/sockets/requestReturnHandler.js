import mongoose from "mongoose";
import RequestsBorrows from "../models/requestsBorrows.js";
import Book from "../models/book.js";
import User from "../models/user.js";

export default (io, socket) => {
  socket.on("return", async (data, callback) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        let request = await RequestsBorrows.findById(data.requestId);

        if (!request)
          return callback({success: false , message: "The request with the given id was not found"});
      
        const student = await User.findById(socket.user._id);
        if (!student)
          return callback({success: false , message: "The assosiated student was not found"});
      
        const book = await Book.findById(request.book);
        if (!book) return callback({success: false , message: "The assosiated book was not found"});
  
          request.isReturned = true;
          await request.save({ session });
      
          student.returnableBooks--;
          await student.save({ session });
      
          book.numberInStock++;
          book.returnableBooks--;
          await book.save({ session });
      
          await session.commitTransaction();
          session.endSession();
      io.emit("returned", request);
      callback({ success: true, message: "Book Returned Seccessfully" });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      console.log(error);
      socket.emit("error", { message: "Internal Server Error" });
    }
  });
};
