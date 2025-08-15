import mongoose from "mongoose";
// ----------------- User Visit Log Model -----------------
const userVisitSchema = new mongoose.Schema(
  {
    ipAddress: { type: String, required: true },
    location: { type: String },
    device: { type: String },
    os: { type: String },
    browser: { type: String },
    date: { type: String },
    time: { type: String },
  },
  { timestamps: true }
);

export const UserVisit = mongoose.model("UserVisit", userVisitSchema);

// ----------------- System Log Model -----------------
const systemLogSchema = new mongoose.Schema(
  {
    type: { type: String, required: true },
    message: { type: String, required: true },
    details: { type: Object },
    date: { type: String },
    time: { type: String },
  },
  { timestamps: true }
);

export const SystemLog = mongoose.model("SystemLog", systemLogSchema);
