import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();
const secret = process.env.JWT_SECRET;

export const createTokenForUser = (user) => {
  const payload = {
    _id: user._id,
    fullName: user.fullName,
    email: user.email,
    profileImageURL: user._profileImageURL,
    role: user._role,
  };
  const token = jwt.sign(payload, secret);
  return token;
};

export const validateToken = (token) => {
  const payload = jwt.verify(token, secret);
  return payload;
};
