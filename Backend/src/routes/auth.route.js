const authController = require("../controllers/login");
const registerController = require("../controllers/register.user");

module.exports = [
  {
    method: "POST",
    path: "/login",
    options: authController.login,
  },
  {
    method: "POST",
    path: "/registeruser",
    options: registerController.registeruser,
  },
];