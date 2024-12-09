export default function (handler) {
  return async (req, res, next) => {
    try {
      return handler(req, res);
    } catch (error) {
      next(error);
    }
  };
}
