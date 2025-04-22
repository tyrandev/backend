const express = require("express");
const router = express.Router();
const {
  getOrderById,
  getOrders,
  getOrdersWithDetails,
  convertOrdersToCSV,
  convertOrderToCSV,
} = require("../controllers/orderController");

router.get("/order/:orderId", getOrderById);
router.get("/orders", getOrders);
router.get("/orders/details", getOrdersWithDetails);
router.get("/orders/convert", convertOrdersToCSV);
router.get("/order/:orderId/convert", convertOrderToCSV);

module.exports = router;
