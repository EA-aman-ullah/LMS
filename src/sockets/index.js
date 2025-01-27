import authSocket from "./middleware/authSocket.js";
import requestApproveHandler from "./RequestApproveHandler.js";
import requestAssignHandler from "./requestAssignHandler.js";
import requestCreateHandler from "./requestCreateHandler.js";
import requestReturnHandler from "./requestReturnHandler.js";

const users = {};

export default (io) => {
  io.use(authSocket);

  io.on("connection", (socket) => {
    let key;

    if (socket.user.role === "admin") {
      key = "admin";
    } else {
      key = socket.user._id;
    }

    if (!users[key]) users[key] = [];
    users[key].push(socket.id);

    console.log(`Client Connected ${users[key]}`);

    requestCreateHandler(io, socket, users);
    requestApproveHandler(io, socket, users);
    requestAssignHandler(io, socket, users);
    requestReturnHandler(io, socket, users);

    socket.on("disconnect", () => {
      let key;

      if (socket.user.role === "admin") {
        key = "admin";
      } else {
        key = socket.user._id;
      }

      if (users[key].length < 2) {
        delete users[key];
      } else {
        users[key] = users[key].filter((id) => id !== socket.id);
      }

      console.log(`Client Disconnected ${users[key]}`);
    });
  });

  io.on("connection_error", (err) => {
    console.log("Connection error:", err.message);
  });
};
