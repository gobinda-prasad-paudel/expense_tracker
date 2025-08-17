//Format Transactions

import { formatDate } from "./date_converter.js";

// Merge and format income and expense transactions
export const formatTransactions = async (incomeData, expenseData) => {
  // 1. Filter out deleted records
  const filteredIncomes = incomeData.filter((income) => !income.isDeleted);
  const filteredExpenses = expenseData.filter((expense) => !expense.isDeleted);

  // 2. Format income transactions
  // 1. Format income transactions
  const incomeTransactions = await Promise.all(
    filteredIncomes.map(async (income) => ({
      id: income._id,
      transactionType: "income",
      amount: income.amount,
      description: income.description,
      date: await formatDate(income.date), // ✅ await inside async map
      currency: income.currency,
      userId: income.userId,
      isDeleted: income.isDeleted,
      transactionCategory: income.incomeSource,
      doneVia: income.receivedThrough,
    }))
  );

  // 3. Format expense transactions
  const expenseTransactions = await Promise.all(
    filteredExpenses.map(async (expense) => ({
      id: expense._id,
      transactionType: "expense",
      amount: expense.amount,
      description: expense.description,
      date: await formatDate(expense.date), // ✅ await here as well
      currency: expense.currency,
      userId: expense.userId,
      isDeleted: expense.isDeleted,
      transactionCategory: expense.category,
      doneVia: expense.sendThrough,
      isDiscountAvailable: expense.isDiscountAvailable,
      discount: {
        type: expense.discountType,
        value: expense.discountValue,
      },
      discountAmount:
        expense.isDiscountAvailable && expense.discountType === "percentage"
          ? (expense.amount * expense.discountValue) / 100
          : expense.isDiscountAvailable
          ? expense.discountValue
          : 0,
      totalAmountPaid: expense.totalAmountPaid,
    }))
  );

  // 4. Combine and sort all by createdAt (most recent first)
  const allTransactions = [...incomeTransactions, ...expenseTransactions];

  allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

  return allTransactions;
};
