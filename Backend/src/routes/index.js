const loginRoutes = require("../routes/auth.route");
const userRoutes = require("./user.routes");
const bookRoutes = require("./book.route");
const categoryRoutes = require("./category.route");
const orderRoutes = require("./order.route");
const stockRoutes = require("./stock.routes");

module.exports = [
  ...loginRoutes,
  ...userRoutes,
  ...bookRoutes,
  ...categoryRoutes,
  ...orderRoutes,
  ...stockRoutes
];
