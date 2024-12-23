import jwt from "jsonwebtoken";
import config from "config";

export default function (req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader)
    return res.status(401).send("Access Denied. No token provided");

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, config.get("jwtPrivateKey"));
    req.user = decoded;
    next();
  } catch (err) {
    res.status(400).send("Invalid Token");
  }
}
