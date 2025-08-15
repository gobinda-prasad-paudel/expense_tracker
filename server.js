import express from "express";
import path from "path";
import dotenv from "dotenv";
dotenv.config(); // Loads .env variables
import cookieParser from "cookie-parser";

import { fileURLToPath } from "url";
import connectToMongoDB from "./connect.js";

const app = express();

//import of routes
import userRoute from "./routes/user.js";
import pdfRoute from "./routes/pdf.js";
import { handleCreateNewUser, handleUserLogin } from "./controllers/User.js";
import {
  checkForAuthenticationCookie,
  redirectToLoginPage,
} from "./middlewares/authentication.js";
import User from "./models/User.js";
import { userVisitLogger } from "./middlewares/Log.js";

const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

try {
  await connectToMongoDB().then(() => {
    console.log("Database connected successfully");
  });
} catch (error) {
  console.log(`Error occoured while connecting to db. Error Message ${error}`);
}
app.use(cookieParser());

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
// Parse JSON bodies
app.use(express.json());

// If you also accept form submissions (x-www-form-urlencoded)
app.use(express.urlencoded({ extended: true }));

app.use(checkForAuthenticationCookie("token"));
app.use(express.static(path.resolve("./public")));
app.use("/", express.static(path.join(__dirname, "public/pdfs")));

//Note logs
app.use(userVisitLogger);

// app.use(flash());

//Routes
app.use("/user", redirectToLoginPage, userRoute);
app.use("/pdf", redirectToLoginPage, pdfRoute);

app.get("/", async (req, res) => {
  const user = await User.findById(req?.user?._id);
  res.render("home", {
    user: req.user || null,
    fullName: user?.fullName,
  });
});

app.get("/login", (req, res) => {
  const message = req.cookies["message"] || "";
  const success = req.cookies["success"] || false;
  console.log(`From server.js message, success : ${(message, success)}`);
  const user = req?.user;

  // Clear the flash message cookie
  res.clearCookie("message");
  res.clearCookie("success");
  // console.log("Clearing cookies");

  user
    ? res.redirect("/user/dashboard")
    : res.render("login", {
        message,
        success,
      });
});
app.post("/newUser/signup", handleCreateNewUser);

app.post("/user/login", handleUserLogin);

app.get("/signup", (req, res) => {
  const user = req?.user;
  user ? res.redirect("/user/dashboard") : res.render("signup");
});

app.get("/termsandcondition", (req, res) => {
  const fullName = req.user?.fullName || null;
  // console.log("User", req.user);
  res.render("termsandcondition", { fullName });
});

app.get("/logout", (req, res) => {
  return res.clearCookie("token").redirect("/");
});

app.listen(PORT, () => {
  console.log(`app listening at port : ${PORT}`);
});
