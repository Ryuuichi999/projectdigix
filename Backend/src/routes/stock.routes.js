const stockController = require("../controllers/stocks.controller");
module.exports = [
  {
    method: "GET",
    path: "/stocks",
    options: stockController.getAllStocks,
  },
  {
    method: "GET",
    path: "/stocks/{id}",
    options: stockController.getStockById,
  },
  {
    method: "GET",
    path: "/stocks/{id}/history",
    options: stockController.getStockHistory,
  },
  {
    method: "PUT",
    path: "/stocks/{id}",
    options: stockController.updateStock,
  },
];
