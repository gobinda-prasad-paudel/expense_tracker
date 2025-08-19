import express from "express";
import Expense from "../models/Expense.js";
import Income from "../models/Income.js";
import { formatDate } from "../utils/date_converter.js";
import { generateFullPDF } from "../controllers/PdfExporter.js";
import { formatTransactions } from "../utils/formatAllTransactions.js";
import Statements from "../models/Statements.js";

const router = express.Router();

router.get("/dashboard", async (req, res) => {
  try {
    if (!req.user) {
      return res.redirect("/login");
    }

    const userId = req.user._id || "test_user";

    const expensesDoneByUser = await Expense.find({ userId, isDeleted: false });
    const incomeEarnedByUser = await Income.find({ userId, isDeleted: false });

    const totalIncome = incomeEarnedByUser.reduce(
      (acc, income) => acc + (income.amount || 0),
      0
    );

    const totalExpense = expensesDoneByUser.reduce(
      (acc, expense) =>
        acc +
        (expense.totalAmountPaid || 0) +
        (expense.otherTransactionAmount || 0),
      0
    );

    const totalDiscounts = expensesDoneByUser.reduce((discount, expense) => {
      if (expense.isDiscountAvailable) {
        if (expense.discountType === "fixed") {
          return discount + (expense.discountValue || 0);
        } else {
          return (
            discount +
            ((expense.discountValue || 0) / 100) * (expense.amount || 0)
          );
        }
      }
      return discount;
    }, 0);

    const formattedTransactions = await formatTransactions(
      incomeEarnedByUser,
      expensesDoneByUser
    );

    const totalBalanceAvailable = totalIncome - totalExpense;

    const incomeTransactions = incomeEarnedByUser.length;
    const expenseTransactions = expensesDoneByUser.length;
    const totalTransactions = incomeTransactions + expenseTransactions;

    res.render("dashboard", {
      incomes: incomeEarnedByUser,
      expenses: expensesDoneByUser, // renamed to plural for clarity
      totalIncome,
      totalExpense,
      totalBalanceAvailable,
      incomeTransactions,
      expenseTransactions,
      totalTransactions,
      totalDiscounts,
      formattedTransactions,
    });
  } catch (error) {
    console.error("Error loading dashboard:", error);
    res.status(500).render("error", {
      statusCode: 500,
      message: "Failed to load dashboard.",
    });
  }
});

router.get("/add-income", (req, res) => {
  res.render("add-income");
});

router.get("/add-expense", (req, res) => {
  res.render("add-expense");
});

// router.get("/pdf-export", async (req, res) => {
//   res.render("pdf-export.ejs");
// });
router.get("/pdf-export", async (req, res) => {
  res.render("pdf-export_uc.ejs");
});

router.post("/pdf-generate/", generateFullPDF);

router.get("/statements", async (req, res) => {
  const userId = req.user._id;
  const fullName = req.user.fullName || "test user";
  const rawStatementsList = await Statements.find({ userId: userId });
  const modifiedStatementsList = rawStatementsList.map((item) => {
    // Format time in 12-hour format
    const time = item.createdAt.toLocaleString("en-US", {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    });

    return {
      ...item._doc, // Spread all MongoDB fields
      createdAtBS: formatDate(item.createdAt), // Your BS date function
      time, // Add the formatted time
    };
  });

  // console.log("Modified statement List", modifiedStatementsList);

  res.render("statements.ejs", {
    statementList: modifiedStatementsList,
    userId,
    fullName,
    isMsgAvailable: false,
  });
});

router.get("/test-pdfs/:pdfId", generateFullPDF);

router.get("/report", (req, res) => {
  res.render("report");
});
router.get("/income", async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.redirect("/login");
    const incomeDoneByUser = await Income.find({
      userId: userId,
      isDeleted: false,
    })
      .sort({ date: -1 })
      .skip(0)
      .limit(10);

    res.render("income", {
      incomeDoneByUser,
    });
  } catch (error) {
    console.error("Error fetching expenses done by user:", error);
    return res.status(500).send("Internal Server Error");
  }
});

router.get("/expense", async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.redirect("/login");
    const expensesDoneByUser = await Expense.find({
      userId: userId,
      isDeleted: false,
    })
      .sort({ date: -1 })
      .skip(0)
      .limit(10);

    res.render("expense", {
      expensesDoneByUser,
    });
  } catch (error) {
    console.error("Error fetching expenses done by user:", error);
    return res.status(500).send("Internal Server Error");
  }
});

router.get("/expense/edit/:expenseId", async (req, res) => {
  if (!req.user) {
    res.redirect("/login");
  }
  try {
    const userId = req.user._id;
    const expenseId = req.params.expenseId;
    const expenseToBeEdited = await Expense.findOne({
      _id: expenseId,
      userId: userId,
    });
    // console.log("Expense Id", expenseId);
    // console.log("User Id", userId);
    // console.log("Expense to be edited", expenseToBeEdited);
    return res.render("edit_expense", {
      expense: expenseToBeEdited,
    });
  } catch (error) {
    console.error("Error to fetch particular expense", error);
    return res.status(500).send("Internal Server Error", error);
  }
});

router.get("/expense/delete/:expenseId", async (req, res) => {
  if (!req.user) {
    return res.redirect("/login");
  }

  const expenseId = req.params.expenseId;
  const userId = req.user._id;

  try {
    const deletedExpense = await Expense.findByIdAndUpdate(
      { _id: expenseId, userId: userId },
      { isDeleted: true }
    );

    if (!deletedExpense) {
      return res.status(404).send("Expense not found or not authorized");
    }

    res.redirect("/user/expense");
  } catch (error) {
    console.error("Error deleting expense:", error);
    res.status(500).send("Server error");
  }
});

router.post("/add-expense", async (req, res) => {
  try {
    let {
      description,
      amount,
      hasDiscount,
      category,
      discount,
      discountType,
      date,
    } = req.body;

    console.log("Has Discount", hasDiscount);
    amount = parseFloat(amount);
    discount = parseFloat(discount);
    let totalAmountPaid = amount;

    if (hasDiscount === "true") {
      if (!isNaN(amount) && !isNaN(discount)) {
        if (discountType === "fixed") {
          totalAmountPaid = amount - discount;
        } else if (discountType === "percentage") {
          totalAmountPaid = amount * (1 - discount / 100);
        }
      } else {
        console.error("Invalid amount or discount value");
      }
    }

    const newExpense = await Expense.create({
      category,
      amount: parseFloat(amount),
      description,
      date: new Date(date), // optional: ensure it's a Date object
      isDiscountAvailable: hasDiscount === "true" ? true : false,
      discountValue: parseFloat(discount) || 0, // fallback to 0 if NaN
      discountType,
      totalAmountPaid,
      userId: req.user._id,
    });

    console.log(newExpense);

    res.status(201).render("add-expense", {
      success: true,
      message: "Expense added successfully",
    }); // better than res.end
  } catch (error) {
    console.error("Error creating expense:", error);
    res.status(500).send("Internal Server Error");
  }
});

router.post("/expense/edit/:expenseId", async (req, res) => {
  if (!req.user) {
    res.redirect("/login");
  }
  try {
    const userId = req.user._id;
    const expenseId = req.params.expenseId;
    let {
      description,
      amount,
      category,
      date,
      hasDiscount,
      discount,
      discountType,
      sendThrough,
    } = req.body;

    amount = parseFloat(amount);
    discount = parseFloat(discount);
    let totalAmountPaid = amount;

    if (hasDiscount === "true") {
      if (!isNaN(amount) && !isNaN(discount)) {
        if (discountType === "fixed") {
          totalAmountPaid = amount - discount;
        } else if (discountType === "percentage") {
          totalAmountPaid = amount * (1 - discount / 100);
        }
      } else {
        console.error("Invalid amount or discount value");
      }
    }

    const incomeToBeEdited = await Expense.findOneAndUpdate(
      {
        _id: expenseId,
        userId: userId,
      },
      {
        description,
        amount,
        category,
        date,
        isDiscountAvailable: hasDiscount === "true" ? true : false,
        discountValue: discount,
        discountType,
        totalAmountPaid,
        sendThrough,
      }
    );
    const expensesDoneByUser = await Expense.find({
      userId: userId,
      isDeleted: false,
    })
      .sort({ date: -1 })
      .skip(0)
      .limit(10);
    // console.log("Income Id", incomeId);
    // console.log("User Id", userId);
    // console.log("Income to be edited", incomeToBeEdited);
    return res.render("expense", {
      expensesDoneByUser,
    });
  } catch (error) {
    console.error("Error to fetch particular income", error);
    return res.status(500).send("Internal Server Error", error);
  }
});

router.post("/add-income", async (req, res) => {
  console.log(req.user);
  console.log("Req.body", req.body);
  const { description, amount, source, date, receivedThrough } = req.body;
  const newSalary = await Income.create({
    incomeSource: source,
    amount: parseFloat(amount),
    description: description,
    date: new Date(date),
    receivedThrough,
    userId: req.user._id,
  });
  console.log("New Salary", newSalary);
  return res.render("add-income", {
    success: true,
    message: "Successfully added income",
  });
});

router.get("/income/edit/:incomeId", async (req, res) => {
  if (!req.user) {
    res.redirect("/login");
  }
  try {
    const userId = req.user._id;
    const incomeId = req.params.incomeId;
    const incomeToBeEdited = await Income.findOne({
      _id: incomeId,
      userId: userId,
    });
    // console.log("Income Id", incomeId);
    // console.log("User Id", userId);
    // console.log("Income to be edited", incomeToBeEdited);
    return res.render("edit_income", {
      income: incomeToBeEdited,
    });
  } catch (error) {
    console.error("Error to fetch particular income", error);
    return res.status(500).send("Internal Server Error", error);
  }
});

router.get("/income/delete/:incomeId", async (req, res) => {
  if (!req.user) {
    return res.redirect("/login");
  }

  const incomeId = req.params.incomeId;
  const userId = req.user._id;

  try {
    const deletedIncome = await Income.findByIdAndUpdate(
      { _id: incomeId, userId: userId },
      { isDeleted: true }
    );

    if (!deletedIncome) {
      return res.status(404).send("Income not found or not authorized");
    }

    res.redirect("/user/income");
  } catch (error) {
    console.error("Error deleting income:", error);
    res.status(500).send("Server error");
  }
});

router.post("/income/edit/:incomeId", async (req, res) => {
  if (!req.user) {
    res.redirect("/login");
  }
  try {
    const userId = req.user._id;
    const incomeId = req.params.incomeId;
    const { description, amount, incomeSource, date, receivedThrough } =
      req.body;
    const incomeToBeEdited = await Income.findOneAndUpdate(
      {
        _id: incomeId,
        userId: userId,
      },
      {
        incomeSource,
        amount: parseFloat(amount),
        description,
        date: new Date(date),
        receivedThrough,
      }
    );
    const incomeDoneByUser = await Income.find({
      userId: userId,
      isDeleted: false,
    })
      .sort({ date: -1 })
      .skip(0)
      .limit(10);
    // console.log("Income Id", incomeId);
    // console.log("User Id", userId);
    // console.log("Income to be edited", incomeToBeEdited);
    return res.render("income", {
      incomeDoneByUser,
    });
  } catch (error) {
    console.error("Error to fetch particular income", error);
    return res.status(500).send("Internal Server Error", error);
  }
});

export default router;
