const receiptController = require("../controllers/receipt.controller");

module.exports = [
  {
    method: "GET",
    path: "/receipts",
    options: receiptController.getAllReceipts,
  },
  {
    method: "GET",
    path: "/receipts/{id}",
    options: receiptController.getReceiptById,
  },
  {
    method: "POST",
    path: "/receipts",
    options: receiptController.createReceipt,
  },
];