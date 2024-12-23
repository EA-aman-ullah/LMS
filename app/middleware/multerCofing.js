import { fileURLToPath } from "url";
import fs from "fs";
import multer from "multer";
import path from "path";

const __dirname = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../public"
);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "temp"));
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.random(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const fileType = /jpeg|jpg|webp|png/;
    const extname = fileType.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimtype = fileType.test(file.mimetype);

    if (extname && mimtype) {
      cb(null, true);
    } else {
      cb(new Error("Only .jpeg, .jpg, .png, webp fromat allowed!"));
    }
  },
}).single("image");

const handleImage = (req, res, next) => {
  if (req.params.id) {
    upload(req, res, (err) => {
      if (err) return res.status(400).json({ message: err.message });

      if (req.body.imageURL && !req.file)
        return res.status(400).send("Image File Required!");

      if (req.file) {
        try {
          if (!req.body.imageURL) {
            fs.unlinkSync(path.join(__dirname, "temp", req.file.filename));
            return res.status(400).send("Please send Old image URL");
          }

          const relativePath = req.body.imageURL.replace(
            `${req.protocol}://${req.get("host")}/`,
            ""
          );
          fs.unlinkSync(path.join(__dirname, relativePath));

          const imageURL = `${req.protocol}://${req.get("host")}/temp/${
            req.file.filename
          }`;
          req.body.imageURL = imageURL;
        } catch (ex) {
          fs.unlinkSync(path.join(__dirname, "temp", req.file.filename));
          return res.status(400).send("Invalid imageURL\n" + ex);
        }
      }

      next();
    });
  } else {
    upload(req, res, (err) => {
      if (err) return res.status(400).json({ message: err.message });

      if (!req.file) return res.status(400).send("Image is required");

      const imageURL = `${req.protocol}://${req.get("host")}/temp/${
        req.file.filename
      }`;
      req.body.imageURL = imageURL;
      next();
    });
  }
};

export default handleImage;
