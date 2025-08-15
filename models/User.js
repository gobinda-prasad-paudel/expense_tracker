import mongoose from "mongoose";
const UserSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: [String],
      enum: ["user", "admin", "superadmin", "viewer"],
      default: ["user"],
    },
    profilePicURL: { type: String, default: "/avatar.png" },
  },
  { timestamps: true }
);

const User = mongoose.model("User", UserSchema);

export default User;
