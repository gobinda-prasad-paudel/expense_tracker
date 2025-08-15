import mongoose from "mongoose";

const expenseCategories = [
  "Food & Dining",
  "Transportation",
  "Education",
  "Shopping",
  "Entertainment",
  "Bills & Utilities",
  "Healthcare",
  "Travel",
  "Other",
];

const currencyType = ["NPR"];

const paymentOptions = [
  "Cash",
  "Mobile Banking",
  "Digital Wallet",
  "E-Sewa",
  "Khalti-Pay",
  "Bank Transfer",
  "Cheque",
  "Other",
];

const discountType = ["percentage", "fixed"];

const ExpenseSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      enum: expenseCategories,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    isDiscountAvailable: {
      type: Boolean,
      required: true,
      default: false,
    },
    discountValue: {
      type: Number,
      required: true,
      default: 0,
    },
    discountType: {
      type: String,
      enum: discountType,
      default: discountType[1], // 'fixed'
    },
    totalAmountPaid: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      enum: currencyType,
      required: true,
      default: "NPR",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    sendThrough: {
      type: String,
      enum: [],
      default: "Cash",
    },
  },
  {
    timestamps: true,
  }
);

ExpenseSchema.index({ userId: 1, date: -1 });

const Expense = mongoose.model("Expense", ExpenseSchema);

export default Expense;
