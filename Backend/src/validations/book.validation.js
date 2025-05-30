const { z } = require("zod");

const createBookSchema = z.object({
  title: z.string().min(1, "Title is required"),
  author: z.string().min(1, "Author is required"),
  price: z.number().min(0, "Price must be a positive number"),
  image: z.string().optional(),
  discount: z.number().min(0).max(100).optional(),
  isbn: z.string().optional(),
  published: z.string().optional(),
  description: z.string().optional(),
  categoryIds: z.array(z.number()).optional(),
  initialQuantity: z.number().min(0).optional(),
  publisher: z.string().optional(), 
});

const updateBookSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  author: z.string().min(1, "Author is required").optional(),
  price: z.number().min(0, "Price must be a positive number").optional(),
  image: z.string().optional(),
  discount: z.number().min(0).max(100).optional(),
  isbn: z.string().optional(),
  published: z.string().optional(),
  description: z.string().optional(),
  categoryIds: z.array(z.number()).optional(),
  publisher: z.string().optional(), 
  quantity: z.number().int().min(0, "Quantity must be a non-negative integer").optional(),
});

module.exports = {
  createBookSchema,

  updateBookSchema,
};
