const {
  createUserSchema,
  updateUserSchema,
} = require("../validations/user.validation");

require("dotenv").config();
const { z } = require("zod");
const prisma = require("../utils/prisma");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;

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

// Get all users
const getAllUsers = {
  description: "Get list of all users",
  tags: ["api", "user"],
  auth: false,
  handler: async (request, h) => {
    try {
      const users = await prisma.user.findMany();
      return h.response(users).code(200);
    } catch (error) {
      console.error("Error fetching users:", error);
      return h.response({ message: "Failed to fetch users" }).code(500);
    }
  },
};

// Get user by ID
const getUserById = {
  description: "Get user by ID",
  tags: ["api", "user"],
  auth: false,
  validate: {
    params: validateZod(idParamSchema),
  },
  handler: async (request, h) => {
    const { id } = request.params;
    try {
      const user = await prisma.user.findUnique({
        where: { id: Number(id) },
      });

      if (!user) {
        return h.response({ message: "User not found" }).code(404);
      }

      // Hide password in response
      const { password, ...userWithoutPassword } = user;
      return h.response(userWithoutPassword).code(200);
    } catch (error) {
      console.error("Error fetching user:", error);
      return h.response({ message: "Failed to fetch user" }).code(500);
    }
  },
};

// Create user
const createUser = {
  description: "Create user",
  tags: ["api", "user"],
  auth: false,
  handler: async (request, h) => {
    const { username, email, password, confirmPassword, role } = request.payload;

    try {
      // Check if password and confirmPassword match
      if (password !== confirmPassword) {
        return h.response({ message: "Passwords do not match" }).code(400);
      }

      // Check for duplicate email
      const existingEmail = await prisma.user.findUnique({ where: { email } });
      if (existingEmail) {
        return h.response({ message: "Email already exists" }).code(400);
      }

      // Check for duplicate username
      const existingUsername = await prisma.user.findUnique({
        where: { username },
      });
      if (existingUsername) {
        return h.response({ message: "Username already exists" }).code(400);
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const roleToSave = role || "user";

      const newUser = await prisma.user.create({
        data: {
          username,
          email,
          password: hashedPassword,
          role: roleToSave,
        },
      });

      // Hide password in response
      const { password: _, ...userWithoutPassword } = newUser;
      return h
        .response({
          message: "User registered successfully",
          user: userWithoutPassword,
        })
        .code(201);
    } catch (error) {
      console.error("Error during registration:", error);
      return h.response({ message: "Internal server error" }).code(500);
    }
  },
};

// Update user
const updateUser = {
  description: "Update user by ID",
  tags: ["api", "user"],
  auth: false,
  validate: {
    params: validateZod(idParamSchema),
    payload: validateZod(updateUserSchema),
  },
  handler: async (request, h) => {
    const { id } = request.params;
    const { username, email, password, role } = request.payload;

    try {
      const data = { username, email, role };
      if (password) {
        const saltRounds = 10;
        data.password = await bcrypt.hash(password, saltRounds);
      }

      const updatedUser = await prisma.user.update({
        where: { id: Number(id) },
        data,
      });

      const { password: _, ...userWithoutPassword } = updatedUser;
      return h.response(userWithoutPassword).code(200);
    } catch (error) {
      console.error("Error updating user:", error);
      return h.response({ message: "Failed to update user" }).code(500);
    }
  },
};

// Delete user
const deleteUser = {
  description: "Delete user by ID",
  tags: ["api", "user"],
  auth: false,
  validate: {
    params: validateZod(idParamSchema),
  },
  handler: async (request, h) => {
    const { id } = request.params;
    try {
      const user = await prisma.user.findUnique({
        where: { id: Number(id) },
        include: { orders: true }, // ตรวจสอบ orders ที่เกี่ยวข้อง
      });

      if (!user) {
        return h.response({ message: "User not found" }).code(404);
      }

      // ตรวจสอบว่ามี orders หรือไม่
      if (user.orders.length > 0) {
        // ลบ orderDetails และ orders ที่เกี่ยวข้องก่อน
        await prisma.orderDetail.deleteMany({
          where: { order_id: { in: user.orders.map((o) => o.id) } },
        });
        await prisma.order.deleteMany({
          where: { user_id: Number(id) },
        });
      }

      // ลบ user
      await prisma.user.delete({
        where: { id: Number(id) },
      });

      return h.response({ message: "User deleted successfully" }).code(200);
    } catch (error) {
      console.error(`Error deleting user (id=${id}):`, error);
      if (error.code === "P2003") {
        return h
          .response({
            message:
              "Cannot delete user because they are referenced in other records",
          })
          .code(400);
      }
      return h
        .response({ message: `Failed to delete user: ${error.message}` })
        .code(500);
    }
  },
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};