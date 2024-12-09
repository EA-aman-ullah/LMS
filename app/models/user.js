import Joi from "joi";
import jwt from "jsonwebtoken";
import config from "config";
import mongoose from "mongoose";

export const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 255,
  },
  email: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 255,
    unique: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  password: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 1024,
  },
  phone: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 50,
  },
  studentId: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 255,
  },
  returnableBooks: {
    type: Number,
    default: 0,
  },
  role: {
    type: String,
    enum: ["admin", "librarian", "student"],
    required: true,
    default: "student",
  },
});

userSchema.pre("validate", async function (next) {
  if (!this.studentId) {
    try {
      const { default: generateId } = await import("../utils/generateId.js");
      this.studentId = await generateId();
    } catch (error) {
      console.error("Error generating ID:", error);
      next(error);
      return;
    }
  }
  next();
});

userSchema.methods.generateAuthToken = function () {
  const token = jwt.sign(
    { _id: this._id, role: this.role },
    config.get("jwtPrivateKey")
  );
  return token;
};
const User = mongoose.model("User", userSchema);

export function validateUser(user) {
  const schema = {
    name: Joi.string().min(3).max(50).required(),
    email: Joi.string().max(255).required().email(),
    phone: Joi.string().min(3).max(50).required(),
    password: Joi.string().min(5).max(50).required(),
  };

  return Joi.object(schema).validate(user);
}

export default User;
