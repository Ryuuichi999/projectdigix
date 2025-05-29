const bcrypt = require("bcrypt");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const jwt = require("jsonwebtoken"); 
require("dotenv").config(); 


const JWT_SECRET = process.env.JWT_SECRET; 
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
module.exports = {
  login,
};