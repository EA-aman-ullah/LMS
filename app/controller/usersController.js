import User, {
  validateUser,
  validateUserEmail,
  validateUserOtp,
  validateUserPassword,
} from "../models/user.js";
import bcrypt from "bcrypt";
import _ from "lodash";
import { sendOTP } from "../utils/otp.js";
import RequestsBorrows from "../models/requestsBorrows.js";

export async function getCurrentUser(req) {
  return await User.findById(req.user._id).select("-password");
}

export async function getStudent(req) {
  if (req?.params.id) {
    let user = await User.findOne({ _id: req.params.id, role: "student" })
      .sort("name")
      .select("-password");
    if (!user)
      return { status: 404, body: "The User with Given ID was not found" };
    return { status: 200, body: user };
  } else {
    if (req?.query.studentWithBorrowed) {
      return await User.aggregate([
        { $match: { returnableBooks: { $gt: 0 } } },
        {
          $project: {
            requestBorrows: 0,
            password: 0,
            role: 0,
            createdAt: 0,
            updatedAt: 0,
            __v: 0,
            isVarified: 0,
            otp: 0,
          },
        },
        {
          $lookup: {
            from: "requestsborrows",
            localField: "_id",
            foreignField: "student._id",
            as: "borrows",
            pipeline: [
              { $match: { isReturned: false, isApproved: true } },
              {
                $project: {
                  _id: 0,
                  studentId: "$student._id",
                  studentName: "$student.name",
                  studentPhone: "$student.phone",
                  studentImage: "$student.imageURL",
                },
              },
            ],
          },
        },
      ]);
    } else {
      return await User.find({ role: "student" })
        .sort("name")
        .select("-password");
    }
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

export async function sendOtpOnregister(req) {
  const { error } = validateUser(req.body);
  if (error) return { status: 400, body: error.details[0].message };

  let user = await User.findOne({ email: req.body.email });
  if (user) {
    if (user.isVarified) {
      return { status: 400, body: { message: "You are already registerd" } };
    } else {
      user.otp = await sendOTP(req.body.email);
      user = await user.save();
      user = _.pick(user, ["_id", "name", "email", "phone"]);
      user.message = "OTP sent to your email.";
      return { status: 201, body: user };
    }
  }

  user = new User(_.pick(req.body, ["name", "email", , "phone"]));
  user.otp = await sendOTP(req.body.email);
  user = await user.save();
  user = _.pick(user, ["_id", "name", "email", "phone"]);
  user.message = "OTP sent to your email.";
  return { status: 201, body: user };
}

export async function reSendOtp(req) {
  let user = await User.findById(req.params.id);
  if (!user)
    return { status: 404, body: "User with the given id was not found" };

  user.otp = await sendOTP(user.email);
  user = await user.save();
  user = _.pick(user, ["_id", "name", "email", "phone"]);
  user.message = "OTP sent to your email.";
  return { status: 201, body: user };
}

export async function verifyOTP(req) {
  const { error } = validateUserOtp(req.body);
  if (error) return { status: 400, body: error.details[0].message };

  let user = await User.findById(req.params.id);
  if (!user)
    return { status: 404, body: "User with the given id was not found" };

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

  user = _.pick(user, ["_id", "name", "email", "phone", "isVarified", "role"]);

  return { status: 201, header: token, body: user };
}

export async function sentOtpOnforgetPassword(req) {
  const { error } = validateUserEmail(req.body);
  if (error) return { status: 400, body: error.details[0].message };

  let user = await User.findOne({ email: req.body.email });
  if (!user) return { status: 404, body: "Email does not exist" };

  user.otp = await sendOTP(user.email);

  await user.save();

  user = _.pick(user, ["_id", "email"]);

  user.message = "OTP sent to your email.";

  return { status: 201, body: user };
}

export async function setPassword(req) {
  const { error } = validateUserPassword(req.body);
  if (error) return { status: 400, body: error.details[0].message };

  let user = await User.findById(req.params.id);
  if (!user)
    return { status: 404, body: "User with the given Id was not found" };

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(req.body.password, salt);

  await user.save();

  const token = user.generateAuthToken();

  user = _.pick(user, ["_id", "name", "email", "phone", "isVarified", "role"]);

  return { status: 201, header: token, body: user };
}

export async function getUserOpenRequests(req) {
  const requests = await RequestsBorrows.find(
    {
      "student._id": req.params.id,
      isReturned: false,
    },
    { student: 0 }
  );

  return { status: 201, body: requests };
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
