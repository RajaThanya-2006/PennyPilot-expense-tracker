
const express = require("express");
const mongoose = require("mongoose");
const Transaction = require("../models/Transaction");

const router = express.Router();

const allowedFields = [
  "title",
  "description",
  "amount",
  "type",
  "category",
  "date",
  "paymentMethod"
];

function validateTransaction(body) {
  const errors = [];

  if (
    typeof body.title !== "string" ||
    !body.title.trim()
  ) {
    errors.push("A transaction title is required");
  }

  if (
    body.amount === undefined ||
    body.amount === null ||
    body.amount === "" ||
    !Number.isFinite(Number(body.amount)) ||
    Number(body.amount) <= 0
  ) {
    errors.push("Amount must be a number greater than zero");
  }

  if (!["income", "expense"].includes(body.type)) {
    errors.push("Type must be income or expense");
  }

  if (
    typeof body.category !== "string" ||
    !body.category.trim()
  ) {
    errors.push("A category is required");
  }

  if (
    body.date !== undefined &&
    Number.isNaN(Date.parse(body.date))
  ) {
    errors.push("Please provide a valid date");
  }

  return errors;
}

// GET all transactions
router.get("/", async (req, res) => {
  try {
    const transactions = await Transaction.find().sort({
      date: -1,
      createdAt: -1
    });

    res.json({
      success: true,
      count: transactions.length,
      data: transactions
    });
  } catch (error) {
    console.error("Fetch transactions error:", error.message);
    res.status(500).json({
      success: false,
      message: "Unable to fetch transactions"
    });
  }
});

// GET one transaction
router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid transaction ID"
      });
    }

    const transaction = await Transaction.findById(
      req.params.id
    );

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found"
      });
    }

    res.json({ success: true, data: transaction });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to fetch transaction"
    });
  }
});

// CREATE transaction
router.post("/", async (req, res) => {
  try {
    const errors = validateTransaction(req.body);

    if (errors.length) {
      return res.status(400).json({
        success: false,
        message: errors[0],
        errors
      });
    }

    const transactionData = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        transactionData[field] = req.body[field];
      }
    }

    transactionData.title = transactionData.title.trim();
    transactionData.category = transactionData.category.trim();
    transactionData.amount = Number(transactionData.amount);

    const transaction = await Transaction.create(transactionData);

    res.status(201).json({
      success: true,
      message: "Transaction created successfully",
      data: transaction
    });
  } catch (error) {
    console.error("Create transaction error:", error.message);

    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: "Unable to create transaction"
    });
  }
});

// UPDATE transaction
router.put("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid transaction ID"
      });
    }

    const updateData = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No transaction fields provided to update"
      });
    }

    const existing = await Transaction.findById(req.params.id);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found"
      });
    }

    const mergedData = {
      title: existing.title,
      amount: existing.amount,
      type: existing.type,
      category: existing.category,
      date: existing.date,
      ...updateData
    };

    const errors = validateTransaction(mergedData);

    if (errors.length) {
      return res.status(400).json({
        success: false,
        message: errors[0],
        errors
      });
    }

    if (updateData.title !== undefined) {
      updateData.title = updateData.title.trim();
    }

    if (updateData.category !== undefined) {
      updateData.category = updateData.category.trim();
    }

    if (updateData.amount !== undefined) {
      updateData.amount = Number(updateData.amount);
    }

    const transaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    );

    res.json({
      success: true,
      message: "Transaction updated successfully",
      data: transaction
    });
  } catch (error) {
    console.error("Update transaction error:", error.message);

    res.status(
      error.name === "ValidationError" || error.name === "CastError"
        ? 400
        : 500
    ).json({
      success: false,
      message:
        error.name === "ValidationError" || error.name === "CastError"
          ? error.message
          : "Unable to update transaction"
    });
  }
});

// DELETE transaction
router.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid transaction ID"
      });
    }

    const transaction = await Transaction.findByIdAndDelete(
      req.params.id
    );

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found"
      });
    }

    res.json({
      success: true,
      message: "Transaction deleted successfully",
      data: transaction
    });
  } catch (error) {
    console.error("Delete transaction error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to delete transaction"
    });
  }
});

module.exports = router;
