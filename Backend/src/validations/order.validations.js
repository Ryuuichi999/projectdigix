const { z } = require("zod");

const createOrderSchema = z.object({
  user_id: z.number().int().positive(),
  total_price: z.number().positive(),
  status: z.string().min(1),
});

const updateOrderSchema = z.object({
  status: z.string().min(1).optional(),
});

const createOrderDetailSchema = z.object({
  order_id: z.number().int().positive(),
  book_id: z.number().int().positive(),
  quantity: z.number().int().positive(),
  price: z.number().positive(),
});

const createReceiptSchema = z.object({
  order_id: z.number().positive("Order ID must be a positive number"),
  receipt_number: z.string().min(1, "Receipt number is required"),
  total_amount: z.number().nonnegative("Total amount must be non-negative"),
  issued_at: z.string().datetime().optional(),
});

module.exports = {
  createOrderSchema,
  updateOrderSchema,
  createOrderDetailSchema,
  createReceiptSchema,
};