const { createReceiptSchema } = require("../validations/order.validations");

const { z } = require("zod");
const prisma = require("../utils/prisma");

const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/, "Invalid ID format"),
});

const validateZod = (schema) => async (value, options) => {
  try {
    await schema.parseAsync(value);
  } catch (err) {
    throw new Error(
      `Validation error: ${err.errors.map((e) => e.message).join(", ")}`
    );
  }
};

const getAllReceipts = {
  description: "Get list of all receipts",
  tags: ["api", "receipt"],
  auth: false,
  handler: async (request, h) => {
    try {
      const receipts = await prisma.receipt.findMany({
        include: { order: true },
      });
      return h.response(receipts).code(200);
    } catch (error) {
      console.error("Error fetching receipts:", error);
      return h.response({ message: "Failed to fetch receipts" }).code(500);
    }
  },
};

const getReceiptById = {
  description: "Get receipt by ID",
  tags: ["api", "receipt"],
  auth: false,
  validate: { params: validateZod(idParamSchema) },
  handler: async (request, h) => {
    const { id } = request.params;
    try {
      const receipt = await prisma.receipt.findUnique({
        where: { id: Number(id) },
        include: { order: true },
      });
      if (!receipt) return h.response({ message: "Receipt not found" }).code(404);
      return h.response(receipt).code(200);
    } catch (error) {
      console.error("Error fetching receipt:", error);
      return h.response({ message: "Failed to fetch receipt" }).code(500);
    }
  },
};

const createReceipt = {
  description: "Create receipt",
  tags: ["api", "receipt"],
  auth: false,
  validate: { payload: validateZod(createReceiptSchema) },
  handler: async (request, h) => {
    const { order_id, receipt_number, total_amount, issued_at } = request.payload;

    try {
      const order = await prisma.order.findUnique({ where: { id: order_id } });
      if (!order) return h.response({ message: "Order not found" }).code(404);

      const existingReceipt = await prisma.receipt.findUnique({ where: { order_id } });
      if (existingReceipt) {
        return h.response({ message: "Receipt already exists for this order" }).code(400);
      }

      const newReceipt = await prisma.receipt.create({
        data: {
          order_id,
          receipt_number,
          total_amount,
          issued_at: issued_at ? new Date(issued_at) : new Date(),
        },
        include: { order: true },
      });

      return h
        .response({
          message: "Receipt created",
          receipt: newReceipt,
        })
        .code(201);
    } catch (error) {
      console.error("Error creating receipt:", error);
      return h.response({ message: "Internal server error" }).code(500);
    }
  },
};

module.exports = {
  getAllReceipts,
  getReceiptById,
  createReceipt,
};