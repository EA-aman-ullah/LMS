import User, { validateUser } from "../models/user.js";
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

  user = new User(_.pick(req.body, ["name", "email", "password", "phone"]));
  user = await user.save();

  const token = user.generateAuthToken();

  return {
    status: 201,
    header: token,
    body: _.pick(user, ["_id", "name", "email"]),
  };
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
