const orderController = require('../controllers/order.controller');

module.exports = [
    {
      method: 'GET',
      path: '/orders',
      options: orderController.getAllOrders,
    },
    {
      method: 'GET',
      path: '/orders/{id}',
      options: orderController.getOrderById,
    },
    {
      method: 'POST',
      path: '/orders',
      options: orderController.createOrder,
    },
    {
      method: 'PUT',
      path: '/orders/{id}',
      options: orderController.updateOrder,
    },
    {
      method: 'DELETE',
      path: '/orders/{id}',
      options: orderController.deleteOrder,
    },
    {
      method: 'GET',
      path: '/order-details',
      options: orderController.getAllOrderDetails,
    },
    {
      method: 'GET',
      path: '/order-details/{id}',
      options: orderController.getOrderDetailById,
    },
    {
      method: 'POST',
      path: '/order-details',
      options: orderController.createOrderDetail,
    },
    {
      method: 'PUT',
      path: '/order-details/{id}',
      options: orderController.updateOrderDetail,
    },
    {
      method: 'DELETE',
      path: '/order-details/{id}',
      options: orderController.deleteOrderDetail,
    },
    {
      method: 'GET',
      path: '/orders/user/{id}',
      options: orderController.getOrdersByUserId,
    },
    {
      method: 'POST',
      path: '/receipts',
      options: orderController.createReceipt,
    }
];