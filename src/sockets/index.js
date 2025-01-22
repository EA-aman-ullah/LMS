import authSocket from "../middleware/authSocket.js";
import requestApproveHandler from "./RequestApproveHandler.js";
import requestAssignHandler from "./requestAssignHandler.js";
import requestCreateHandler from "./requestCreateHandler.js";
import requestReturnHandler from "./requestReturnHandler.js";

const user = {};

export default (io) => {
  io.use(authSocket);

  io.on("connection", (socket) => {
    console.log(`Client Connected ${socket.id}`);

    user[socket.user._id] = socket.id;

    requestCreateHandler(io, socket);
    requestApproveHandler(io, socket);
    requestAssignHandler(io, socket);
    requestReturnHandler(io, socket);

    socket.on("disconnect", () => {
      console.log(`Client Disconnected ${socket.id}`);

      delete user[socket.user._id];
    });
  });
};
