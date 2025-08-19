import User from "../models/User.js";
import bcrypt from "bcrypt";
import { createTokenForUser } from "../service/authentication.js";

const saltRound = 10;

// ========== SIGNUP ==========
export const handleCreateNewUser = async (req, res) => {
  console.log("Signup Request:");
  const { fullName, email, password, role } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.cookie("message", "Account already exists. Try loggin in");
      res.cookie("success", false);
      console.log("Account with the same email already exists");
      return res.redirect("/login");
    }

    const hashedPassword = await bcrypt.hash(password, saltRound);

    const newUser = await User.create({
      fullName,
      email,
      password: hashedPassword,
      access: ["user"],
      role: role || "user",
    });

    res.cookie("message", "Account Created Successfully");
    res.cookie("success", true);
    return res.redirect("/login");
  } catch (error) {
    console.error("Signup error:", error);
    return res.render("signup", {
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};

// ========== LOGIN ==========
export const handleUserLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const loginUser = await User.findOne({ email });
    if (!loginUser) {
      console.log("User not found:", email);
      res.cookie("message", "Invalid email or password");
      res.cookie("success", false);
      return res.redirect("/login");
    }

    const isMatch = await bcrypt.compare(password, loginUser.password);
    console.log(`Password match: ${isMatch ? "Match" : "Not matched"}`);

    if (!isMatch) {
      req.cookie("message", "Invalid email or password");
      req.cookie("success", false);
      return res.redirect("/login");
    }

    // Generate token (e.g., JWT)
    const token = createTokenForUser({
      _id: loginUser._id,
      fullName: loginUser.fullName,
      email: loginUser.email,
      profileImageURL: loginUser.profilePicURL || null,
      role: loginUser.role || "user",
    });

    // Set token in cookie and redirect
    return res
      .cookie("token", token, { httpOnly: true, maxAge: 1000 * 60 * 60 * 24 }) // 1 day expiry
      .redirect("/user/dashboard");
  } catch (error) {
    console.error("Login error:", error);
    return res.render("login", {
      success: false,
      message: error.message || "Login failed",
    });
  }
};
