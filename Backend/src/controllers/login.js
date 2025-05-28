const bcrypt = require("bcrypt");
const { signToken } = require("../utils/jwt");
const userService = require("../services/user.service"); // Import the user service

// Authorize user
const login = {
  description: "login user",
  tags: ["api", "loginuser"],
  auth: false,
  handler: async (request, h) => {
    const { email, password } = request.payload;

    // todo: create func for userService to get by email
    const userList = await userService.getAllUsers();
    console.log("user", userList);
    const user = userList.find((user) => user.email === email);
    
  
    if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
      return h.response({ message: "Invalid credentials" }).code(401);
    }

    const token = signToken({ id: user.id, email: user.email });
    return { token };
  },
};

module.exports = {
  login,
};
