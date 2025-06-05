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

const getAllStocks = {
  description: "Get list of all stocks",
  tags: ["api", "stock"],
  auth: false,
  handler: async (request, h) => {
    try {
      const stocks = await prisma.stock.findMany({
        include: { book: true },
      });
      return h.response(stocks).code(200);
    } catch (error) {
      console.error("Error fetching stocks:", error);
      return h.response({ message: "Failed to fetch stocks" }).code(500);
    }
  },
};

const getStockById = {
  description: "Get stock by ID",
  tags: ["api", "stock"],
  auth: false,
  validate: { params: validateZod(idParamSchema) },
  handler: async (request, h) => {
    const { id } = request.params;
    try {
      const stock = await prisma.stock.findUnique({
        where: { id: Number(id) },
        include: { book: true },
      });
      if (!stock) return h.response({ message: "Stock not found" }).code(404);
      return h.response(stock).code(200);
    } catch (error) {
      console.error("Error fetching stock:", error);
      return h.response({ message: "Failed to fetch stock" }).code(500);
    }
  },
};

const getStockHistory = {
  description: "Get stock history by stock ID",
  tags: ["api", "stock"],
  auth: false,
  validate: { params: validateZod(idParamSchema) },
  handler: async (request, h) => {
    const { id } = request.params;
    try {
      const history = await prisma.stockHistory.findMany({
        where: { stock_id: Number(id) },
        orderBy: { created_at: "desc" },
      });
      return h.response(history).code(200);
    } catch (error) {
      console.error("Error fetching stock history:", error);
      return h.response({ message: "Failed to fetch stock history" }).code(500);
    }
  },
};

const updateStock = {
  description: "Update stock by ID",
  tags: ["api", "stock"],
  auth: false,
  validate: {
    params: validateZod(idParamSchema),
    payload: z.object({
      change: z.number().refine((val) => val !== 0, { message: "Change cannot be zero" }),
      reason: z.string().min(1, "Reason is required"),
    }).parseAsync,
  },
  handler: async (request, h) => {
    const { id } = request.params;
    const { change, reason } = request.payload;
    try {
      const stock = await prisma.stock.findUnique({ where: { id: Number(id) } });
      if (!stock) return h.response({ message: "Stock not found" }).code(404);

      if (stock.quantity + change < 0) {
        return h.response({ message: "Stock cannot be negative" }).code(400);
      }

      const [updatedStock, stockHistory] = await prisma.$transaction([
        prisma.stock.update({
          where: { id: Number(id) },
          data: { quantity: stock.quantity + change },
        }),
        prisma.stockHistory.create({
          data: {
            stock_id: Number(id),
            change,
            reason,
            created_at: new Date(),
          },
        }),
      ]);

      return h.response({ stock: updatedStock, stockHistory }).code(200);
    } catch (error) {
      console.error("Error updating stock:", error);
      return h.response({ message: `Failed to update stock: ${error.message}` }).code(500);
    }
  },
};

module.exports = {
  getAllStocks,
  getStockById,
  getStockHistory,
  updateStock,
};