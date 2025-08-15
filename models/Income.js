import mongoose from "mongoose";

const incomeCategories = [
  "Salary",
  "Freelance",
  "Business",
  "Investment",
  "Rental",
  "Gift",
  "Bonus",
  "Pension",
  "Other",
];

const currencyType = ["NPR"];
const paymentOptions = [
  "Cash",
  "Bank Transfer",
  "Cheque",
  "Mobile Banking",
  "Digital Wallet",
  "E-sewa",
  "Khalti-Pay",
  "Other",
];

const IncomeSchema = new mongoose.Schema(
  {
    incomeSource: {
      type: String,
      enum: incomeCategories,
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
    receivedThrough: {
      type: String,
      enum: paymentOptions,
      default: "Cash",
    },
  },
  {
    timestamps: true,
  }
);

IncomeSchema.index({ userId: 1, date: -1 });

const Income = mongoose.model("Income", IncomeSchema);

export default Income;
