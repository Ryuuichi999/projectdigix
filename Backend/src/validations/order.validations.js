const { z } = require("zod");

const createOrderSchema = z.object({
  user_id: z.number().int().positive({ message: "User ID must be a positive integer" }),
  total_price: z.number().positive({ message: "Total price must be a positive number" }),
}).strict();

const updateOrderSchema = z.object({
  status: z.enum(["PENDING", "COMPLETE"], { message: "Status must be PENDING or COMPLETE" }),
}).strict();

const createOrderDetailSchema = z.object({
  order_id: z.number().int().positive({ message: "Order ID must be a positive integer" }),
  book_id: z.number().int().positive({ message: "Book ID must be a positive integer" }),
  quantity: z.number().int().positive({ message: "Quantity must be a positive integer" }),
  price: z.number().positive({ message: "Price must be a positive number" }),
}).strict();

const createReceiptSchema = z.object({
  order_id: z.number().positive({ message: "Order ID must be a positive number" }),
  receipt_number: z.string().min(1, { message: "Receipt number is required" }),
  total_amount: z.number().nonnegative({ message: "Total amount must be non-negative" }),
  issued_at: z.string().datetime().optional(),
}).strict();


module.exports = {
  createOrderSchema,
  updateOrderSchema,
  createOrderDetailSchema,
  createReceiptSchema,
};