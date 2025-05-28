const bcrypt = require("bcrypt");
const { signToken } = require("../utils/jwt");
const userService = require("../services/user.service");

const login = {
  description: "login user",
  tags: ["api", "loginuser"],
  auth: false,
  handler: async (request, h) => {
    const { email, password } = request.payload;

    const user = await userService.getUserByEmail(email);
    if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
      return h.response({ message: "Invalid credentials" }).code(401);
    }

    const token = signToken({ id: user.id, email: user.email, role: user.role });
    return h.response({ token }).code(200);
  },
};

module.exports = {
  login,
};