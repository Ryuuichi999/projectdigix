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

// ตรวจสอบว่า createReceiptSchema มีการกำหนดหรือไม่
if (!createReceiptSchema) {
  throw new Error("createReceiptSchema is not defined in order.validations");
}

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
      return h.response({ message: `Failed to fetch receipt: ${error.message}` }).code(500);
    }
  },
};

const createReceipt = {
  description: "Create a new receipt",
  tags: ["api", "receipt"],
  auth: false,
  validate: { payload: validateZod(createReceiptSchema) },
  handler: async (request, h) => {
    const { order_id, receipt_number, total_amount, issued_at } = request.payload;

    try {
      // ตรวจสอบว่า order_id มีอยู่ในตาราง order
      const order = await prisma.order.findUnique({ where: { id: Number(order_id) } });
      if (!order) return h.response({ message: "Order not found" }).code(404);

      // ตรวจสอบว่า receipt สำหรับ order_id นี้ยังไม่มี
      const existingReceipt = await prisma.receipt.findUnique({ where: { order_id: Number(order_id) } });
      if (existingReceipt) {
        return h.response({ message: "Receipt already exists for this order" }).code(400);
      }

      // สร้าง receipt ใหม่
      const newReceipt = await prisma.receipt.create({
        data: {
          order_id: Number(order_id),
          receipt_number,
          total_amount,
          issued_at: issued_at ? new Date(issued_at) : new Date(), 
        },
        include: { order: true },
      });

      return h
        .response({
          message: "Receipt created successfully",
          receipt: newReceipt,
        })
        .code(201);
    } catch (error) {
      console.error("Error creating receipt:", error);
      if (error instanceof z.ZodError) {
        return h.response({ message: `Validation error: ${error.errors.map(e => e.message).join(", ")}` }).code(400);
      }
      return h.response({ message: `Internal server error: ${error.message}` }).code(500);
    }
  },
};


module.exports = {
  getAllReceipts,
  getReceiptById,
  createReceipt,
};