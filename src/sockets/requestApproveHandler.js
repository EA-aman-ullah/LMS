import mongoose from "mongoose";
import RequestsBorrows from "../models/requestsBorrows.js";
import User from "../models/user.js";

export default (io, socket) => {
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

      if (request.isApproved === true)
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

      request.isApproved = true;
      request = await request.save({ session });

      student.requestPending--;
      student.requestApproved++;
      await student.save({ session });

      await session.commitTransaction();
      session.endSession();
      io.emit("approved", request);
      callback({ success: true, message: "Request Apperoved Seccessfully" });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      console.log(error);
      socket.emit("error", { message: "Internal Server Error" });
    }
  });
};
