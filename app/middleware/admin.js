export default function (req, res, next) {
  if (req.user.role !== "admin") res.status(403).send("Access deneid");
  next();
}