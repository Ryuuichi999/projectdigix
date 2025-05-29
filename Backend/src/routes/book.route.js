    const bookController = require("../controllers/book.controller");

    module.exports = [
    {
        method: "POST",
        path: "/books",
        options: bookController.createBook,
    },
    {
        method: "GET",
        path: "/books/{id}",
        options: bookController.getBookById,
    },
    {
        method: "PUT",
        path: "/books/{id}",
        options: bookController.updateBook,
    },
    {
        method: "DELETE",
        path: "/books/{id}",
        options: bookController.deleteBook,
    },
    {
        method: "GET",
        path: "/books",
        options: bookController.getAllBooks,
    },
    ];
