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
      const users = await prisma.User.findMany();
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

      return h.response(user).code(200);
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

// Login user
const login = {
  description: "Login user",
  tags: ["api", "user"],
  auth: false,
  handler: async (request, h) => {
    try {
      const { email, password } = request.payload;
      console.log("Login payload:", request.payload);

      if (!email || !password) {
        return h.response({ message: "Email and password are required" }).code(400);
      }

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return h.response({ message: "Invalid credentials" }).code(401);
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return h.response({ message: "Invalid credentials" }).code(401);
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role || "user" },
        JWT_SECRET,
        { expiresIn: "1h" }
      );
      console.log("Generated token:", token);

      return h.response({ token }).code(200);
    } catch (error) {
      console.error("Login error:", error);
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
    const data = { ...request.payload };

    try {
      if (data.password) {
        const saltRounds = 10;
        data.password = await bcrypt.hash(data.password, saltRounds);
      }

      const updatedUser = await prisma.user.update({
        where: { id: Number(id) },
        data,
      });

      const { password, ...userWithoutPassword } = updatedUser;
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
      });

      if (!user) {
        return h.response({ message: "User not found" }).code(404);
      }

      await prisma.user.delete({
        where: { id: Number(id) },
      });

      return h.response({ message: "User deleted successfully" }).code(200);
    } catch (error) {
      console.error("Error deleting user:", error);
      return h.response({ message: "Failed to delete user" }).code(500);
    }
  },
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  login,
  updateUser,
  deleteUser,
};