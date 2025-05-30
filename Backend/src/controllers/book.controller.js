const {
  createBookSchema,
  updateBookSchema,
} = require("../validations/book.validation");

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
    const {
      title,
      author,
      price,
      image,
      isbn,
      published,
      description,
      categoryIds,
      initialQuantity, 
      publisher, 
    } = request.payload;

    try {
      const existingBook = await prisma.book.findFirst({
        where: { title, author }, 
      });
      if (existingBook) {
        return h
          .response({ message: "Book with this title and author already exists" })
          .code(400);
      }

      // สร้างหนังสือใหม่
      const newBook = await prisma.book.create({
        data: {
          title,
          author,
          price,
          image,
          isbn,
          published: published ? new Date(published) : null,
          description,
          publisher,
        },
      });

      // สร้างหรืออัปเดตสต็อก
      const stock = await prisma.stock.upsert({
        where: { book_id: newBook.id },
        create: {
          book_id: newBook.id,
          quantity: initialQuantity || 0, 
        },
        update: {
          quantity: initialQuantity || 0, 
        },
      });

      // เพิ่มความสัมพันธ์กับหมวดหมู่
      if (categoryIds) {
        await prisma.bookCategory.createMany({
          data: categoryIds.map((categoryId) => ({
            book_id: newBook.id,
            category_id: categoryId,
          })),
        });
      }

      return h
        .response({
          message: "Book created",
          book: { ...newBook, stock: stock.quantity },
        })
        .code(201);
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
  validate: {
    params: validateZod(idParamSchema),
    payload: validateZod(updateBookSchema),
  },
  handler: async (request, h) => {
    const { id } = request.params;
    const {
      title,
      author,
      price,
      image,
      isbn,
      published,
      description,
      categoryIds,
      publisher,
      quantity, 
    } = request.payload;
    try {
      const book = await prisma.book.findUnique({ where: { id: Number(id) } });
      if (!book) return h.response({ message: "Book not found" }).code(404);

      // อัปเดตข้อมูลหนังสือ
      const updatedBook = await prisma.book.update({
        where: { id: Number(id) },
        data: {
          title,
          author,
          price,
          image,
          isbn,
          published: published ? new Date(published) : null,
          description,
          publisher,
        },
        include: { stock: true }, 
      });

      // อัปเดตสต็อก
      if (quantity !== undefined) {
        await prisma.stock.upsert({
          where: { book_id: Number(id) },
          update: {
            quantity: Number(quantity),
          },
          create: {
            book_id: Number(id),
            quantity: Number(quantity),
          },
        });
      }

      // อัปเดตหมวดหมู่
      if (categoryIds) {
        await prisma.bookCategory.deleteMany({
          where: { book_id: Number(id) },
        });
        await prisma.bookCategory.createMany({
          data: categoryIds.map((categoryId) => ({
            book_id: Number(id),
            category_id: categoryId,
          })),
        });
      }

      // ดึงข้อมูลสต็อกล่าสุดเพื่อส่งกลับ
      const updatedStock = await prisma.stock.findUnique({
        where: { book_id: Number(id) },
      });

      return h
        .response({
          message: "Book updated",
          book: {
            ...updatedBook,
            stock: updatedStock ? { quantity: updatedStock.quantity } : null,
          },
        })
        .code(200);
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


module.exports = {
  getAllBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
};
