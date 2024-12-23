import User from "../models/user.js";
import bcrypt from "bcrypt";
import Joi from "joi";

export async function getToken(req) {
  const { error } = validateUser(req.body);
  if (error) return { status: 400, body: error.details[0].message };

  let user = await User.findOne({ email: req.body.email });
  if (!user) return { status: 400, body: "Invailed Email or Password" };

  let password = await bcrypt.compare(req.body.password, user.password);
  if (!password) return { status: 400, body: "Invailed Email or Password" };

  const token = user.generateAuthToken();

  return { status: 200, header: token, body: user };
}

function validateUser(user) {
  const schema = {
    email: Joi.string().required().email(),
    password: Joi.string().min(3).max(255).required(),
  };
  return Joi.object(schema).validate(user);
}
