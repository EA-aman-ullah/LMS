import { fileURLToPath } from "url";
import cloudinary from "cloudinary";
import fs from "fs";
import multer from "multer";
import path from "path";
import "dotenv/config";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const __dirname = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../public"
);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "temp"));
  },
  // filename: (req, file, cb) => {
  //   const unique = Date.now() + "-" + Math.random(Math.random() * 1e9);
  //   cb(null, unique + path.extname(file.originalname));
  // },
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
  upload(req, res, async (err) => {
    if (err) return res.status(400).json({ message: err.message });

    if (!req.file) return res.status(400).send("Image is required");

    try {
      if (req.body.imageURL) {
        let publicId = req.body.imageURL
          .split("/")
          [url.split("/").length - 1].split(".")[0];

        await cloudinary.api.delete_resources([publicId]);

        // const relativePath = req.body.imageURL.replace(
        //   `${req.protocol}://${req.get("host")}/`,
        //   ""
        // );

        // fs.unlinkSync(path.join(__dirname, relativePath));
      }
    } catch (ex) {
      fs.unlinkSync(path.join(__dirname, "temp", req.file.filename));
      return res.status(400).send("Invalid imageURL\n" + ex);
    }

    let file = await cloudinary.uploader.upload(req.file.path);

    // const imageURL = `${req.protocol}://${req.get("host")}/temp/${
    //   req.file.filename
    // }`;

    req.body.imageURL = file.secure_url;
    fs.unlinkSync(path.join(__dirname, "temp", req.file.filename));
    next();
  });
};

export default handleImage;
