import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";
import Expense from "../models/Expense.js";
import Income from "../models/Income.js";
import { formatTransactions } from "../utils/formatAllTransactions.js";

import { v4 as uuidv4 } from "uuid";
import User from "../models/User.js";
import Statements from "../models/Statements.js";
import { formatDate } from "../utils/date_converter.js";

// Controller to generate PDF
export const generateFullPDF = async (req, res) => {
  try {
    const pdfId = `pdf_${new Date().getFullYear()}${new Date().getMonth()}${new Date().getDate()}_${uuidv4()}`;
    const userId = req.user._id || "test_user";
    const { startDate, endDate, tableType } = req.body;

    // ✅ Validate ObjectId presence
    if (!userId) {
      return res.status(400).json({ error: "Missing user ID" });
    }

    let fileName =
      tableType === "combined1"
        ? "pdfTemplate_combined1.html"
        : "pdfTemplate_seperate2.html";

    const user = await User.findById(userId);
    const ownerName = user?.fullName;

    // ✅ Filter dates if provided
    const dateFilter = {};

    if (startDate && endDate) {
      const start = new Date(startDate); // starts at 00:00:00
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // include the whole end day

      dateFilter.createdAt = {
        $gte: start,
        $lte: end,
      };
    }

    // 🔍 Fetch filtered data
    const expensesDoneByUser = await Expense.find({
      userId,
      isDeleted: false,
      ...dateFilter,
    });
    const incomeEarnedByUser = await Income.find({
      userId,
      isDeleted: false,
      ...dateFilter,
    });

    // 🔄 Format all transactions
    const formattedTransactions = formatTransactions(
      incomeEarnedByUser,
      expensesDoneByUser
    );
    console.log("Formatted transactions", formattedTransactions),
      console.log("Income transactions", incomeEarnedByUser);

    console.log("Exported transactions", expensesDoneByUser);

    // 🧾 Generate transaction table HTML
    const transactionHTML = formattedTransactions
      .map(
        (tx, index) => `
        <tr>
        <td>${index + 1}</td>
        <td>${tx.date}</td>
        <td>${tx.description}</td>
          <td>${tx.transactionType}</td>
          <td>${tx.currency ? tx.currency : "NPR"} ${tx.amount}</td>
          <td>${tx.transactionCategory}</td>
          <td>${tx.doneVia}</td>
        </tr>`
      )
      .join("");

    // 🧾 Generate income transaction table HTML
    const incomeTransactionHTML = incomeEarnedByUser
      .map(
        (tx, index) => `
        <tr>
        <td>${index + 1}</td>
        <td>${tx.date}</td>
        <td>${tx.description}</td>
          <td>${tx.incomeSource}</td>
          <td>${tx.currency ? tx.currency : "NPR"} ${tx.amount}</td>
          <td>${tx.receivedThrough}</td>
        </tr>`
      )
      .join("");

    // 🧾 Generate expense transaction table HTML
    const expenseTransactionHTML = expensesDoneByUser
      .map(
        (tx, index) => `
        <tr>
        <td>${index + 1}</td>
        <td>${tx.date}</td>
        <td>${tx.description}</td>
          <td>${tx.category}</td>
          <td>${tx.currency ? tx.currency : "NPR"} ${tx.amount}</td>
          <td>${tx.sendThrough}</td>
        </tr>`
      )
      .join("");

    // 📊 Generate chart data for expenses
    const expenseCategoryMap = {};
    for (const tx of expensesDoneByUser) {
      if (!expenseCategoryMap[tx.category]) {
        expenseCategoryMap[tx.category] = 0;
      }
      expenseCategoryMap[tx.category] += tx.amount;
    }

    const chartData = {
      labels: Object.keys(expenseCategoryMap),
      datasets: [
        {
          label: "Expenses",
          data: Object.values(expenseCategoryMap),
          backgroundColor: [
            "#ff6384",
            "#36a2eb",
            "#ffce56",
            "#4bc0c0",
            "#9966ff",
            "#ff9f40",
          ],
        },
      ],
    };

    // 📁 Set output paths
    const outputDir = path.join("public", "pdfs", userId.toString());
    const outputPath = path.join(outputDir, `${pdfId}.pdf`);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // 📄 Load template and inject data
    const templatePath = path.join("templates", fileName);
    const rawHtml = fs.readFileSync(templatePath, "utf-8");

    const html = rawHtml
      .replace("{{username}}", ownerName || "User")
      .replace("{{transactionSpan}}", "Monthly Transaction")
      .replace("{{date}}", new Date().toLocaleDateString())
      .replace("{{startDate}}", startDate)
      .replace("{{endDate}}", endDate)
      .replace("{{pdfId}}", pdfId)
      .replace("{{incomeTransactions}}", incomeTransactionHTML)
      .replace("{{expenseTransactions}}", expenseTransactionHTML)
      .replace(
        "{{message1}}",
        formattedTransactions.length == 0 ? "No data available" : ""
      )
      .replace(
        "{{message2}}",
        incomeEarnedByUser.length == 0 ? "No income data available" : ""
      )
      .replace(
        "{{message3}}",
        expensesDoneByUser.length == 0 ? "No expense data available" : ""
      )
      .replace("{{currentDate}}", new Date().getFullYear())
      .replace(/{{\s*chartData\s*}}/g, JSON.stringify(chartData))
      .replace("{{transactions}}", transactionHTML);

    // 🧠 Launch Puppeteer
    const browser = await puppeteer.launch({
      headless: true, // headless mode
      ignoreDefaultArgs: ["--disable-extensions"],
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--use-gl=egl", // correct syntax
      ],
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();
    // Set a user agent
    await page.setUserAgent(
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36"
    );
    await page.setContent(html, { waitUntil: "networkidle0" });

    // Wait for chart to render
    await page.waitForSelector("#chartsReady", { timeout: 10000 });

    // 🖨️ Generate PDF
    await page.pdf({
      path: outputPath,
      format: "A4",
      printBackground: true,
    });

    await browser.close();

    await Statements.create({
      duration: `${formatDate(startDate, false)}-${formatDate(endDate, false)}`,
      linkOfPdf: `/${userId}/${pdfId}.pdf`,
      userId: userId,
    });

    return res.status(200).redirect(`/user/statements`);
  } catch (err) {
    console.error("Error generating PDF:", err);
    return res.status(500).json({ error: "Failed to generate PDF" });
  }
};
