const categoryController = require("../controllers/category.controller");

module.exports = [
  {
    method: "GET",
    path: "/categories",
    options: categoryController.getAllCategories,
  },
  {
    method: "GET",
    path: "/categories/{id}",
    options: categoryController.getCategoryById,
  },
  {
    method: "POST",
    path: "/categories",
    options: categoryController.createCategory,
  },
  {
    method: "PUT",
    path: "/categories/{id}",
    options: categoryController.updateCategory,
  },
  {
    method: "DELETE",
    path: "/categories/{id}",
    options: categoryController.deleteCategory,
  },
];