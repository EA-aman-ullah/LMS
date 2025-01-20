export default function () {
  if (!process.env.LMS_JWT_PRIVATE_KEY)
    throw new Error("FATAL ERROR: jwtPrivateKey is not defined");
}
