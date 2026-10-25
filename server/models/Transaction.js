
const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Transaction title is required"],
      trim: true,
      maxlength: 100
    },

    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: 500
    },

    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0.01, "Amount must be greater than zero"]
    },

    type: {
      type: String,
      required: true,
      enum: ["income", "expense"],
      lowercase: true
    },

    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
      maxlength: 50
    },

    date: {
      type: Date,
      required: true,
      default: Date.now
    },

    paymentMethod: {
      type: String,
      trim: true,
      default: "Other",
      maxlength: 50
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Transaction", transactionSchema);
