import User, { validateUser, validateUserOtp } from "../models/user.js";
import nodemailer from "nodemailer";
import crypto from "crypto";
import bcrypt from "bcrypt";
import _ from "lodash";

export async function getCurrentUser(req) {
  return await User.findById(req.user._id).select("-password");
}

export async function getStudent(id) {
  if (id) {
    let user = await User.findOne({ _id: id, role: "student" })
      .sort("name")
      .select("-password");
    if (!user)
      return { status: 404, body: "The User with Given ID was not found" };
    return { status: 200, body: user };
  } else {
    return await User.find({ role: "student" })
      .sort("name")
      .select("-password");
  }
}

export async function createUser(req) {
  const { error } = validateUser(req.body);
  if (error) return { status: 400, body: error.details[0].message };

  let user = await User.findOne({ email: req.body.email });
  if (user) return { status: 400, body: "User Already Registerd." };

  const salt = await bcrypt.genSalt(10);
  req.body.password = await bcrypt.hash(req.body.password, salt);

  user = new User(
    _.pick(req.body, ["name", "email", "password", "phone", "imageURL"])
  );
  user = await user.save();

  const token = user.generateAuthToken();

  return {
    status: 201,
    header: token,
    body: _.pick(user, ["_id", "name", "email", "phone", "imageURL"]),
  };
}

export async function sendOtp(req) {
  const { error } = validateUser(req.body);
  if (error) return { status: 400, body: error.details[0].message };

  req.body.otp = crypto.randomInt(100000, 999999).toString();

  let user = await User.findOne({ email: req.body.email });
  if (user) {
    if (user.isVarified) {
      user.message = "You are already registerd";

      return { status: 400, body: user };
    } else {
      const transporter = nodemailer.createTransport({
        service: "Gmail", // Adjust as needed
        auth: {
          user: "ea.amanullah@gmail.com",
          pass: "bzqh kppx lxbg nnjd",
        },
      });

      const mailOptions = {
        from: "ea.amanullah@gmail.com",
        to: req.body.email,
        subject: "Verify Your Email",
        text: `Your OTP is ${req.body.otp}`,
      };

      await transporter.sendMail(mailOptions);
      user.otp = req.body.otp;
      user = await user.save();
      user = _.pick(user, ["_id", "name", "email", "phone"]);
      user.message = "OTP sent to your email.";
      return { status: 201, body: user };
    }
  }
  const salt = await bcrypt.genSalt(10);
  req.body.password = await bcrypt.hash(req.body.password, salt);

  user = new User(
    _.pick(req.body, ["name", "email", "password", "phone", "otp"])
  );

  const transporter = nodemailer.createTransport({
    service: "Gmail", // Adjust as needed
    auth: {
      user: "ea.amanullah@gmail.com",
      pass: "bzqh kppx lxbg nnjd",
    },
  });

  const mailOptions = {
    from: "ea.amanullah@gmail.com",
    to: req.body.email,
    subject: "Verify Your Email",
    text: `Your OTP is ${req.body.otp}`,
  };

  await transporter.sendMail(mailOptions);

  user = await user.save();
  user = _.pick(user, ["_id", "name", "email", "phone"]);
  user.message = "OTP sent to your email.";
  return { status: 201, body: user };
}

export async function reSendOtp(req) {
  req.body.otp = crypto.randomInt(100000, 999999).toString();

  let user = await User.findById(req.params.id);
  if (user) {
    if (user.isVarified) {
      user.message = "You are already registerd";

      return { status: 400, body: user };
    } else {
      const transporter = nodemailer.createTransport({
        service: "Gmail", // Adjust as needed
        auth: {
          user: "ea.amanullah@gmail.com",
          pass: "bzqh kppx lxbg nnjd",
        },
      });

      const mailOptions = {
        from: "ea.amanullah@gmail.com",
        to: user.email,
        subject: "Verify Your Email",
        text: `Your OTP is ${req.body.otp}`,
      };

      await transporter.sendMail(mailOptions);
      user.otp = req.body.otp;
      user = await user.save();
      user = _.pick(user, ["_id", "name", "email", "phone"]);
      user.message = "OTP sent to your email.";
      return { status: 201, body: user };
    }
  }
}

export async function verifyOTP(req) {
  const { error } = validateUserOtp(req.body);
  if (error) return { status: 400, body: error.details[0].message };

  let user = await User.findById(req.params.id);
  if (!user)
    return { status: 404, body: "User with the given id was not found" };

  if (user.isVarified)
    return { status: 400, body: "You are already registerd" };

  let validDueToCreated = new Date(user.createdAt.getTime() + 60000);
  let validDueToUpdated = new Date(user.updatedAt.getTime() + 60000);
  let validDate =
    validDueToUpdated > validDueToCreated
      ? validDueToUpdated
      : validDueToCreated;

  if (validDate.getTime() < Date.now())
    return { status: 400, body: "OTP Expired! Try again with new OTP" };

  if (user.otp !== req.body.otp) return { status: 400, body: "Invailed OTP!" };

  user.isVarified = true;
  await user.save();

  const token = user.generateAuthToken();

  user = _.pick(user, ["_id", "name", "email", "phone", "isVarified"]);

  return { status: 201, header: token, body: user };
}

// export async function updateUser(req) {
//   const { error } = validateUser(req.boy);
//   if (error) return { status: 400, body: error.details[0].message };

//   let student = await User.findByIdAndUpdate(
//     req.params.id,
//     _.pick(req.body, [["name", "email", "phone", "studentId"]]),
//     { new: true }
//   );

//   if (!student)
//     return { status: 404, body: "Studant with the given Id was not Found." };
//   return { status: 201, body: student };
// }

// export async function deletUser(id) {
//   const student = await User.findByIdAndDelete(id, { new: true });
//   if (!student)
//     return { status: 404, body: "Student with the given id was not Found." };

//   return { status: 201, body: student };
// }
