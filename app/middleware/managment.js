export default function (req, res, next) {
  const roles = ["librarian", "admin"];
  if (!roles.includes(req.user.role)) res.status(403).send("Access denied");
  next();
}
