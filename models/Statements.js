import mongoose from "mongoose";
const statementsSchema = new mongoose.Schema(
  {
    duration: { type: String, required: true },
    linkOfPdf: { type: String, required: true },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const Statements = mongoose.model("Statements", statementsSchema);

export default Statements;
