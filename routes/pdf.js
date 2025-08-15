import express from "express";
import Statements from "../models/Statements.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import User from "../models/User.js";
const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

router.get("/delete/:statementId", async (req, res) => {
  const userId = req.user._id; // logged-in user
  const statementId = req.params.statementId;

  try {
    // 1️⃣ Find the statement
    const statement = await Statements.findById(statementId);

    if (!statement) {
      return res.render("error", {
        statusCode: 404,
        message: "Statement not found",
      });
    }

    // 2️⃣ Authorization check
    if (userId.toString() !== statement.userId.toString()) {
      return res.render("error", {
        statusCode: 401,
        message: "Unauthorized to delete others' statement",
      });
    }

    // 3️⃣ Delete statement from DB
    const response = await Statements.findByIdAndDelete(statementId);

    // 4️⃣ Delete PDF file if it exists
    const linkOfPdf = response?.linkOfPdf
      ? response.linkOfPdf.replace(/^\/+/, "")
      : null;

    if (linkOfPdf) {
      const filePath = path.join(process.cwd(), "public", "pdfs", linkOfPdf);

      try {
        await fs.unlink(filePath, (err) => {
          if (err) {
            throw Error("Error deleting pdf");
          } else {
            console.log("Pdf deleted successfully");
          }
        });
      } catch (err) {
        if (err.code === "ENOENT") {
          console.log("PDF file already deleted:", filePath);
        } else {
          console.error("Error deleting PDF:", err);
        }
      }
    }

    // 5️⃣ Fetch updated statements list

    const fullName = req.user?.fullName || "Guest user"; // replace with actual user name if needed
    const rawStatementsList = await Statements.find({ userId });

    const modifiedStatementsList = rawStatementsList.map((item) => {
      const time = item.createdAt.toLocaleString("en-US", {
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      });

      return {
        ...item._doc,
        createdAtBS: formatDate(item.createdAt),
        time,
      };
    });

    // 6️⃣ Render updated statements page
    const message = response?._id
      ? "Statement deleted successfully"
      : "Statement already deleted, click on pdf-export tab";

    return res.render("statements", {
      statementList: modifiedStatementsList,
      userId,
      fullName,
      isMsgAvailable: true,
      message,
    });
  } catch (error) {
    console.error("Error in delete route:", error);
    return res.render("error", {
      statusCode: 500,
      message: "Something went wrong on the server. Please try again later.",
    });
  }
});

export default router;
