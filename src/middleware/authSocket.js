import jwt from "jsonwebtoken";

export default (socket, next) => {
  const token = socket.handshake.auth?.token;

  if (!token) return next(new Error("Authentication error: Token missing"));

  try {
    const decoded = jwt.verify(token, process.env.LMS_JWT_PRIVATE_KEY);
    socket.user = decoded;
    next();
  } catch (error) {
    next(new Error("Authentication error: Invalid Token"));
  }
};
