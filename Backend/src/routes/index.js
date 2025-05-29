const loginRoutes = require('../routes/auth.route');
const userRoutes = require('./user.routes');
const bookRoutes = require('./book.route');
const categoryRoutes = require('./category.route');

module.exports = [
  ...loginRoutes,
  ...userRoutes,
  ...bookRoutes,
  ...categoryRoutes
];