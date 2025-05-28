const bcrypt = require("bcrypt");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// REGISTER USER
const registeruser = {
  description: "Register user",
  tags: ["api", "registeruser"],
  auth: false,
  handler: async (request, h) => {
    const { username, email, password, role } = request.payload;

    try {
      // Check for duplicate email
      const existingEmail = await prisma.user.findUnique({ where: { email } });
      if (existingEmail)
        return h.response({ message: "Email already exists" }).code(400);

      // Check for duplicate username
      const existingUsername = await prisma.user.findUnique({
        where: { username },
      });
      if (existingUsername)
        return h.response({ message: "Username already exists" }).code(400);

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

module.exports = {
  registeruser,
};
