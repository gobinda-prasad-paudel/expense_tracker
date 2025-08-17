import { formatDate } from "./date_converter.js";

export const formatTransactions = async (incomeData, expenseData) => {
  const filteredIncomes = incomeData.filter((income) => !income.isDeleted);
  const filteredExpenses = expenseData.filter((expense) => !expense.isDeleted);

  const incomeTransactions = await Promise.all(
    filteredIncomes.map(async (income) => ({
      id: income._id,
      transactionType: "income",
      amount: income.amount,
      description: income.description,
      rawDate: new Date(income.date), // <-- keep raw date for sorting
      date: await formatDate(income.date), // formatted for display
      currency: income.currency,
      userId: income.userId,
      isDeleted: income.isDeleted,
      transactionCategory: income.incomeSource,
      doneVia: income.receivedThrough,
    }))
  );

  const expenseTransactions = await Promise.all(
    filteredExpenses.map(async (expense) => ({
      id: expense._id,
      transactionType: "expense",
      amount: expense.amount,
      description: expense.description,
      rawDate: new Date(expense.date), // <-- keep raw date for sorting
      date: await formatDate(expense.date),
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

  const allTransactions = [...incomeTransactions, ...expenseTransactions];

  // Sort by rawDate ascending (earliest first)
  allTransactions.sort((a, b) => b.rawDate - a.rawDate);

  return allTransactions;
};
