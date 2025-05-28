const bcrypt = require("bcrypt");
const { signToken } = require("../utils/jwt");
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const registeradmin = {
  description: "register admin",
  tags: ["api", "registeruser"],
  auth: false,
  handler: async (request, h) => {
    const { username, email, password,role } = request.payload;

    try {
      // 1. check dup email
      const existingEmail = await prisma.user.findUnique({
        where: { email },
      });

      if (existingEmail) {
        return h.response({ message: "Email already exists" }).code(400);
      }

      // 2. check dup username
      const existingUsername = await prisma.user.findUnique({
        where: { username },
      });

      if (existingUsername) {
        return h.response({ message: "Username already exists" }).code(400);
      }

      // 3. hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // 4. create user
      const newUser = await prisma.user.create({
        data: {
          username,
          email,
          password: hashedPassword,
          role: role, 
        },
      });

      // Return response after success
      return h.response({ message: "User registered successfully", user: newUser }).code(201);

    } catch (error) {
      console.error("Error during registration:", error);
      return h.response({ message: "Internal server error" }).code(500);
    }
  },
};

module.exports = {
  registeradmin,
};
