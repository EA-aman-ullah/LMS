export default (io) => {
  io.on("connection", (socket) => {
    console.log(`Client Connected ${socket.id}`);

    socket.on("disconnect", () => {
      console.log(`Client Disconnected ${socket.idf}`);
    });
  });
};
