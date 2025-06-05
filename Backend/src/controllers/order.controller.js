const {
  createOrderSchema,
  updateOrderSchema,
  createOrderDetailSchema,
} = require("../validations/order.validations");

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

const getAllOrders = {
  description: "Get list of all orders",
  tags: ["api", "order"],
  auth: false,
  handler: async (request, h) => {
    try {
      const orders = await prisma.order.findMany({
        include: {
          user: true,
          orderDetails: { include: { book: true } },
          receipt: true,
        },
      });
      return h.response(orders).code(200);
    } catch (error) {
      console.error("Error fetching orders:", error);
      return h.response({ message: "Failed to fetch orders" }).code(500);
    }
  },
};

const getOrderById = {
  description: "Get order by ID",
  tags: ["api", "order"],
  auth: false,
  validate: { params: validateZod(idParamSchema) },
  handler: async (request, h) => {
    const { id } = request.params;
    try {
      const order = await prisma.order.findUnique({
        where: { id: Number(id) },
        include: {
          user: true,
          orderDetails: { include: { book: true } },
          receipt: true,
        },
      });
      if (!order) return h.response({ message: "Order not found" }).code(404);
      return h.response(order).code(200);
    } catch (error) {
      console.error("Error fetching order:", error);
      return h.response({ message: "Failed to fetch order" }).code(500);
    }
  },
};

const createOrder = {
  description: "Create order",
  tags: ["api", "order"],
  auth: false,
  validate: { payload: validateZod(createOrderSchema) },
  handler: async (request, h) => {
    const { user_id, total_price } = request.payload;
    try {
      const user = await prisma.user.findUnique({ where: { id: user_id } });
      if (!user) return h.response({ message: "User not found" }).code(404);

      const newOrder = await prisma.order.create({
        data: {
          user_id,
          total_price,
          status: "PENDING",
        },
        include: { user: true },
      });

      return h.response({ message: "Order created successfully", order: newOrder }).code(201);
    } catch (error) {
      console.error("Error creating order:", error);
      return h.response({ message: `Failed to create order: ${error.message}` }).code(500);
    }
  },
};

const updateOrder = {
  description: "Update order by ID",
  tags: ["api", "order"],
  auth: false,
  validate: {
    params: validateZod(idParamSchema),
    payload: validateZod(updateOrderSchema),
  },
  handler: async (request, h) => {
    const { id } = request.params;
    const { status } = request.payload;
    try {
      const order = await prisma.order.findUnique({
        where: { id: Number(id) },
      });
      if (!order) return h.response({ message: "Order not found" }).code(404);

      const updatedOrder = await prisma.order.update({
        where: { id: Number(id) },
        data: { status },
        include: { orderDetails: { include: { book: true } }, receipt: true },
      });

      return h
        .response({
          message: "Order updated",
          order: updatedOrder,
        })
        .code(200);
    } catch (error) {
      console.error("Error updating order:", error);
      return h.response({ message: "Failed to update order" }).code(500);
    }
  },
};

const deleteOrder = {
  description: "Delete order by ID",
  tags: ["api", "order"],
  auth: false,
  validate: { params: validateZod(idParamSchema) },
  handler: async (request, h) => {
    const { id } = request.params;
    try {
      // Check if order exists
      const order = await prisma.order.findUnique({
        where: { id: Number(id) },
        include: { orderDetails: true, receipt: true }, // Include related data
      });
      if (!order) return h.response({ message: "Order not found" }).code(404);

      // Start a transaction
      await prisma.$transaction(async (prisma) => {
        // Delete associated orderDetails and update stock
        for (const detail of order.orderDetails) {
          const stock = await prisma.stock.findUnique({
            where: { book_id: detail.book_id },
          });
          if (stock) {
            await prisma.stock.update({
              where: { book_id: detail.book_id },
              data: { quantity: stock.quantity + detail.quantity },
            });
          }
          await prisma.orderDetail.delete({
            where: { id: detail.id },
          });
        }

        // Delete associated receipt (if any)
        if (order.receipt) {
          await prisma.receipt.delete({
            where: { id: order.receipt.id },
          });
        }

        // Delete the order
        await prisma.order.delete({
          where: { id: Number(id) },
        });
      });

      return h.response({ message: "Order deleted successfully" }).code(200);
    } catch (error) {
      console.error("Error deleting order:", error);
      return h.response({ message: `Failed to delete order: ${error.message}` }).code(500);
    }
  },
};

const getAllOrderDetails = {
  description: "Get list of all order details",
  tags: ["api", "orderDetail"],
  auth: false,
  handler: async (request, h) => {
    try {
      const orderDetails = await prisma.orderDetail.findMany({
        include: { order: true, book: true },
      });
      return h.response(orderDetails).code(200);
    } catch (error) {
      console.error("Error fetching order details:", error);
      return h.response({ message: "Failed to fetch order details" }).code(500);
    }
  },
};

const getOrderDetailById = {
  description: "Get order detail by ID",
  tags: ["api", "orderDetail"],
  auth: false,
  validate: { params: validateZod(idParamSchema) },
  handler: async (request, h) => {
    const { id } = request.params;
    try {
      const orderDetail = await prisma.orderDetail.findUnique({
        where: { id: Number(id) },
        include: { order: true, book: true },
      });
      if (!orderDetail)
        return h.response({ message: "Order detail not found" }).code(404);
      return h.response(orderDetail).code(200);
    } catch (error) {
      console.error("Error fetching order detail:", error);
      return h.response({ message: "Failed to fetch order detail" }).code(500);
    }
  },
};

const createOrderDetail = {
  description: "Create order detail",
  tags: ["api", "orderDetail"],
  auth: false,
  validate: { payload: validateZod(createOrderDetailSchema) },
  handler: async (request, h) => {
    const { order_id, book_id, quantity, price } = request.payload;

    try {
      const order = await prisma.order.findUnique({ where: { id: order_id } });
      if (!order) return h.response({ message: "Order not found" }).code(404);

      const book = await prisma.book.findUnique({ where: { id: book_id } });
      if (!book) return h.response({ message: "Book not found" }).code(404);

      const stock = await prisma.stock.findUnique({ where: { book_id } });
      if (!stock || stock.quantity < quantity) {
        return h.response({ message: `Insufficient stock for book ID ${book_id}. Available: ${stock?.quantity || 0}` }).code(400);
      }

      const [newOrderDetail, updatedStock] = await prisma.$transaction([
        prisma.orderDetail.create({
          data: { order_id, book_id, quantity, price },
        }),
        prisma.stock.update({
          where: { book_id },
          data: { quantity: stock.quantity - quantity },
        }),
      ]);

      return h.response({
        message: "Order detail created",
        orderDetail: newOrderDetail,
      }).code(201);

    } catch (error) {
      console.error("Error creating order detail:", error);
      return h.response({ message: "Internal server error" }).code(500);
    }
  }
};

const updateOrderDetail = {
  description: "Update order detail by ID",
  tags: ["api", "orderDetail"],
  auth: false,
  validate: {
    params: validateZod(idParamSchema),
    payload: validateZod(createOrderDetailSchema.partial()),
  },
   handler: async (request, h) => {
    const { id } = request.params;
    const { quantity, price } = request.payload;

    try {
      const orderDetail = await prisma.orderDetail.findUnique({ where: { id: Number(id) } });
      if (!orderDetail) return h.response({ message: "Order detail not found" }).code(404);

      const stock = await prisma.stock.findUnique({ where: { book_id: orderDetail.book_id } });

      if (quantity !== undefined) {
        const quantityDiff = quantity - orderDetail.quantity;

        if (quantityDiff > 0 && stock.quantity < quantityDiff) {
          return h.response({ message: `Insufficient stock. Available: ${stock.quantity}` }).code(400);
        }

        await prisma.stock.update({
          where: { book_id: orderDetail.book_id },
          data: { quantity: stock.quantity - quantityDiff },
        });
      }

      const updatedOrderDetail = await prisma.orderDetail.update({
        where: { id: Number(id) },
        data: {
          quantity: quantity !== undefined ? quantity : orderDetail.quantity,
          price: price !== undefined ? price : orderDetail.price,
        },
        include: { book: true },
      });

      return h.response({
        message: "Order detail updated",
        orderDetail: updatedOrderDetail,
      }).code(200);
    } catch (error) {
      console.error("Error updating order detail:", error);
      return h.response({ message: "Failed to update order detail" }).code(500);
    }
  }
};

const deleteOrderDetail = {
  description: "Delete order detail by ID",
  tags: ["api", "orderDetail"],
  auth: false,
  validate: { params: validateZod(idParamSchema) },
  handler: async (request, h) => {
    const { id } = request.params;
    try {
      const orderDetail = await prisma.orderDetail.findUnique({
        where: { id: Number(id) },
      });
      if (!orderDetail)
        return h.response({ message: "Order detail not found" }).code(404);

      // คืนสต็อก
      const stock = await prisma.stock.findUnique({
        where: { book_id: orderDetail.book_id },
      });
      await prisma.stock.update({
        where: { book_id: orderDetail.book_id },
        data: { quantity: stock.quantity + orderDetail.quantity },
      });

      await prisma.orderDetail.delete({ where: { id: Number(id) } });
      return h.response({ message: "Order detail deleted" }).code(200);
    } catch (error) {
      console.error("Error deleting order detail:", error);
      return h.response({ message: "Failed to delete order detail" }).code(500);
    }
  },
};

const getOrdersByUserId = {
  description: "Get orders by user ID",
  tags: ["api", "order"],
  auth: false, // ถ้าต้องการ auth เปลี่ยนเป็น "jwt" และตรวจสอบ token
  validate: { params: validateZod(idParamSchema) },
  handler: async (request, h) => {
    const { id } = request.params;
    try {
      const orders = await prisma.order.findMany({
        where: {
          user_id: Number(id),
          receipt: { isNot: null }, // กรองเฉพาะที่มี receipt
        },
        include: {
          user: true,
          orderDetails: { include: { book: true } },
          receipt: true,
        },
        orderBy: { created_at: "desc" },
      });
      return h.response(orders).code(200);
    } catch (error) {
      console.error("Error fetching user orders:", error);
      return h.response({ message: `Failed to fetch orders: ${error.message}` }).code(500);
    }
  },
};

const createReceipt = {
  description: "Create receipt",
  tags: ["api", "receipt"],
  auth: false,
  validate: {
    payload: z.object({
      order_id: z.number().int().positive(),
      receipt_number: z.string().min(1),
      total_amount: z.number().positive(),
      issued_at: z.string().datetime(),
    }).parseAsync,
  },
  handler: async (request, h) => {
    const { order_id, receipt_number, total_amount, issued_at } = request.payload;
    try {
      const order = await prisma.order.findUnique({ where: { id: order_id } });
      if (!order) return h.response({ message: "Order not found" }).code(404);

      const existingReceipt = await prisma.receipt.findUnique({ where: { order_id } });
      if (existingReceipt) return h.response({ message: "Receipt already exists for this order" }).code(400);

      const newReceipt = await prisma.receipt.create({
        data: {
          order_id,
          receipt_number,
          total_amount,
          issued_at: new Date(issued_at),
        },
      });

      return h.response({
        message: "Receipt created",
        receipt: newReceipt,
      }).code(201);
    } catch (error) {
      console.error("Error creating receipt:", error);
      return h.response({ message: `Failed to create receipt: ${error.message}` }).code(500);
    }
  },
}; 

module.exports = {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
  getAllOrderDetails,
  getOrderDetailById,
  createOrderDetail,
  updateOrderDetail,
  deleteOrderDetail,
  getOrdersByUserId,
  createReceipt,
};
