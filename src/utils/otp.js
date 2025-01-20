import crypto from "crypto";
import nodemailer from "nodemailer";

export async function sendOTP(email) {
  let otp = crypto.randomInt(100000, 999999).toString();

  const transporter = nodemailer.createTransport({
    service: "Gmail", // Adjust as needed
    auth: {
      user: "ea.amanullah@gmail.com",
      pass: "bzqh kppx lxbg nnjd",
    },
  });

  const mailOptions = {
    from: "ea.amanullah@gmail.com",
    to: email,
    subject: "Verify Your Email",
    text: `Your OTP is ${otp}`,
  };

  await transporter.sendMail(mailOptions);

  return otp;
}
