const {
  fetchOrderById,
  fetchOrderIdList,
  fetchFromJsonFile,
  getOrderByIdFromJsonFile,
} = require("../services/orderService");
const { getToday, getYesterday } = require("../utils/dateUtils");
const { parseToCSV, formatOrderDataToCSV } = require("../utils/csvUtils");

async function getOrderById(req, res) {
  const { orderId } = req.params;
  const orderData = await getOrderByIdFromJsonFile(orderId);

  if (orderData.error) {
    return res.status(404).json({ error: orderData.error });
  }

  res.json(orderData);
}

async function getOrdersWithDetails(req, res) {
  const { minWorth, maxWorth } = req.query;

  const result = await fetchFromJsonFile(minWorth, maxWorth);

  if (result.error) {
    return res.status(400).json({ error: result.error });
  }

  res.json(result);
}

async function getOrders(req, res) {
  const dateConfirmedFrom = getYesterday();
  const dateConfirmedTo = getToday();
  const { minWorth, maxWorth } = req.query;

  const { orderIDs, error } = await fetchOrderIdList(
    dateConfirmedFrom,
    dateConfirmedTo,
    minWorth,
    maxWorth
  );

  if (error) {
    return res.status(500).json({ error });
  }

  res.json({ orderIDs });
}

const convertOrdersToCSV = async (req, res) => {
  try {
    const { minWorth, maxWorth } = req.query;

    const { orders, error } = await fetchFromJsonFile(minWorth, maxWorth);

    if (error) {
      return res.status(500).json({ error });
    }

    if (!orders || orders.length === 0) {
      return res
        .status(404)
        .json({ error: "No orders found in the cached data." });
    }

    const csvData = formatOrderDataToCSV(orders);
    const csv = parseToCSV(csvData, ["orderID", "orderWorth", "products"]);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=orders.csv");
    res.status(200).send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const convertOrderToCSV = async (req, res) => {
  try {
    const { orderId } = req.params;
    const orderData = await getOrderByIdFromJsonFile(orderId);

    if (orderData.error) {
      return res.status(404).json({ error: orderData.error });
    }

    const csvData = formatOrderDataToCSV([orderData]);
    const csv = parseToCSV(csvData, ["orderID", "orderWorth", "products"]);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=order_${orderId}.csv`
    );
    res.status(200).send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getOrderById,
  getOrders,
  getOrdersWithDetails,
  convertOrdersToCSV,
  convertOrderToCSV,
};
