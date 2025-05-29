// controller/book.controller.js
const { z } = require("zod");
const prisma = require("../utils/prisma");

const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/, "Invalid ID format"),
});

const validateZod = (schema) => async (value, options) => {
  try {
    await schema.parseAsync(value);
  } catch (err) {
    throw new Error(`Validation error: ${err.errors.map((e) => e.message).join(", ")}`);
  }
};

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
});

const getAllBooks = {
  description: "Get list of all books",
  tags: ["api", "book"],
  auth: false,
  handler: async (request, h) => {
    try {
      const books = await prisma.book.findMany({
        include: { stock: true, categories: { include: { category: true } } },
      });
      return h.response(books).code(200);
    } catch (error) {
      console.error("Error fetching books:", error);
      return h.response({ message: "Failed to fetch books" }).code(500);
    }
  },
};

const getBookById = {
  description: "Get book by ID",
  tags: ["api", "book"],
  auth: false,
  validate: { params: validateZod(idParamSchema) },
  handler: async (request, h) => {
    const { id } = request.params;
    try {
      const book = await prisma.book.findUnique({
        where: { id: Number(id) },
        include: { stock: true, categories: { include: { category: true } } },
      });
      if (!book) return h.response({ message: "Book not found" }).code(404);
      return h.response(book).code(200);
    } catch (error) {
      console.error("Error fetching book:", error);
      return h.response({ message: "Failed to fetch book" }).code(500);
    }
  },
};

const createBook = {
  description: "Create book",
  tags: ["api", "book"],
  auth: false,
  validate: { payload: validateZod(createBookSchema) },
  handler: async (request, h) => {
    const { title, author, price, image, discount, isbn, published, description, categoryIds } = request.payload;
    try {
      const newBook = await prisma.book.create({
        data: {
          title, author, price, image, discount, isbn, published: published ? new Date(published) : null, description,
        },
      });
      if (categoryIds) {
        await prisma.bookCategory.createMany({
          data: categoryIds.map(categoryId => ({ book_id: newBook.id, category_id: categoryId })),
        });
      }
      const stock = await prisma.stock.create({ data: { book_id: newBook.id, quantity: 0 } });
      return h.response({ message: "Book created", book: { ...newBook, stock: stock.quantity } }).code(201);
    } catch (error) {
      console.error("Error creating book:", error);
      return h.response({ message: "Internal server error" }).code(500);
    }
  },
};

const updateBook = {
  description: "Update book by ID",
  tags: ["api", "book"],
  auth: false,
  validate: { params: validateZod(idParamSchema), payload: validateZod(updateBookSchema) },
  handler: async (request, h) => {
    const { id } = request.params;
    const { title, author, price, image, discount, isbn, published, description, categoryIds } = request.payload;
    try {
      const book = await prisma.book.findUnique({ where: { id: Number(id) } });
      if (!book) return h.response({ message: "Book not found" }).code(404);
      const updatedBook = await prisma.book.update({
        where: { id: Number(id) },
        data: { title, author, price, image, discount, isbn, published: published ? new Date(published) : null, description },
      });
      if (categoryIds) {
        await prisma.bookCategory.deleteMany({ where: { book_id: Number(id) } });
        await prisma.bookCategory.createMany({
          data: categoryIds.map(categoryId => ({ book_id: Number(id), category_id: categoryId })),
        });
      }
      return h.response({ message: "Book updated", book: updatedBook }).code(200);
    } catch (error) {
      console.error("Error updating book:", error);
      return h.response({ message: "Failed to update book" }).code(500);
    }
  },
};

const deleteBook = {
  description: "Delete book by ID",
  tags: ["api", "book"],
  auth: false,
  validate: { params: validateZod(idParamSchema) },
  handler: async (request, h) => {
    const { id } = request.params;
    try {
      const book = await prisma.book.findUnique({ where: { id: Number(id) } });
      if (!book) return h.response({ message: "Book not found" }).code(404);
      await prisma.book.delete({ where: { id: Number(id) } });
      return h.response({ message: "Book deleted" }).code(200);
    } catch (error) {
      console.error("Error deleting book:", error);
      return h.response({ message: "Failed to delete book" }).code(500);
    }
  },
};

const getAllCategories = {
  description: "Get all categories",
  tags: ["api", "category"],
  auth: false,
  handler: async (request, h) => {
    try {
      const categories = await prisma.category.findMany();
      return h.response(categories).code(200);
    } catch (error) {
      console.error("Error fetching categories:", error);
      return h.response({ message: "Failed to fetch categories" }).code(500);
    }
  },
};

const createOrder = {
  description: "Create order",
  tags: ["api", "order"],
  auth: true,
  handler: async (request, h) => {
    const { user_id, total_price, status, orderDetails } = request.payload;
    try {
      const order = await prisma.order.create({
        data: {
          user_id,
          total_price,
          status,
          orderDetails: {
            createMany: { data: orderDetails.map(d => ({ book_id: d.book_id, quantity: d.quantity, price: d.price })) },
          },
        },
      });
      return h.response({ message: "Order created", order }).code(201);
    } catch (error) {
      console.error("Error creating order:", error);
      return h.response({ message: "Failed to create order" }).code(500);
    }
  },
};

module.exports = { getAllBooks, getBookById, createBook, updateBook, deleteBook, getAllCategories, createOrder };