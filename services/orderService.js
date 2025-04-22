const path = require("path");
const fs = require("fs");
const axios = require("axios");
const { API_URL, API_KEY } = require("../config/config");
const ORDERS_API_URL = `${API_URL}/orders/orders`;
const SEARCH_API_URL = `${API_URL}/orders/orders/search`;

const DATA_PATH = path.join(__dirname, "../data/orders.json");

async function fetchOrderById(orderId) {
  try {
    const response = await axios.get(ORDERS_API_URL, {
      headers: {
        "X-API-KEY": API_KEY,
        accept: "application/json",
        "content-type": "application/json",
      },
      params: { ordersIds: orderId },
    });

    if (
      !response.data ||
      !response.data.Results ||
      response.data.Results.length === 0
    ) {
      return { error: `No order found with ID: ${orderId}` };
    }

    const order = response.data.Results[0];
    const orderWorth =
      order.orderDetails.payments.orderCurrency.orderProductsCost +
      order.orderDetails.payments.orderCurrency.orderDeliveryCost;

    const orderData = {
      orderID: order.orderId,
      products: [],
      orderWorth,
    };

    if (
      !order.orderDetails.productsResults ||
      !Array.isArray(order.orderDetails.productsResults)
    ) {
      return { error: `No products found for order ID: ${orderId}` };
    }

    order.orderDetails.productsResults.forEach((product) => {
      orderData.products.push({
        productID: product.productId,
        quantity: product.productQuantity,
      });
    });

    return orderData;
  } catch (error) {
    console.error(
      ` Error fetching order details for ID: ${orderId}`,
      error.message
    );
    return { error: error.message };
  }
}

async function fetchOrderIdList(dateConfirmedFrom, dateConfirmedTo) {
  const requestData = {
    params: {
      ordersRange: { dateConfirmedFrom, dateConfirmedTo },
      resultsPage: 0,
      resultsLimit: 100,
    },
  };

  try {
    const response = await axios.post(SEARCH_API_URL, requestData, {
      headers: {
        "X-API-KEY": API_KEY,
        accept: "application/json",
        "content-type": "application/json",
      },
    });

    if (!response.data || !response.data.Results) {
      return { error: "No order data in API response." };
    }

    const orderIDs = response.data.Results.map((order) => order.orderId);
    return { orderIDs };
  } catch (error) {
    console.error(" Error fetching order IDs:", error.message);
    return { error: error.message };
  }
}

async function fetchOrdersWithDetails(
  dateConfirmedFrom,
  dateConfirmedTo,
  minWorth,
  maxWorth
) {
  const { orderIDs, error } = await fetchOrderIdList(
    dateConfirmedFrom,
    dateConfirmedTo
  );

  if (error) {
    return { error };
  }

  if (!orderIDs || orderIDs.length === 0) {
    return { error: "No orders found for the given date range." };
  }

  console.log(`Fetching details for ${orderIDs.length} orders...`);

  const orderDetailsPromises = orderIDs.map((orderId) =>
    fetchOrderById(orderId)
  );
  const ordersData = await Promise.all(orderDetailsPromises);

  const filteredOrders = ordersData.filter((order) => {
    const orderWorth = order.orderWorth || 0;
    let matchesMinWorth = true;
    let matchesMaxWorth = true;

    if (minWorth) {
      matchesMinWorth = orderWorth >= parseFloat(minWorth);
    }

    if (maxWorth) {
      matchesMaxWorth = orderWorth <= parseFloat(maxWorth);
    }

    return matchesMinWorth && matchesMaxWorth;
  });

  return { orders: filteredOrders };
}

// saves orders to file
async function fetchToJsonFile(
  dateConfirmedFrom,
  dateConfirmedTo,
  minWorth,
  maxWorth
) {
  const result = await fetchOrdersWithDetails(
    dateConfirmedFrom,
    dateConfirmedTo,
    minWorth,
    maxWorth
  );

  if (result.error) {
    console.error("Failed to fetch orders:", result.error);
    return { error: result.error };
  }

  try {
    fs.writeFileSync(DATA_PATH, JSON.stringify(result.orders, null, 2));
    console.log(`Saved ${result.orders.length} orders to ${DATA_PATH}`);
    return { success: true };
  } catch (err) {
    console.error("Failed to write orders to file:", err.message);
    return { error: err.message };
  }
}

// loads orders from file
function fetchFromJsonFile(minWorth, maxWorth) {
  if (!fs.existsSync(DATA_PATH)) {
    return {
      error: "Orders data file not found. Please run fetchToJsonFile first.",
    };
  }

  try {
    const data = fs.readFileSync(DATA_PATH, "utf-8");
    const orders = JSON.parse(data);

    const filtered = orders.filter((order) => {
      const worth = order.orderWorth || 0;
      return (
        (!minWorth || worth >= parseFloat(minWorth)) &&
        (!maxWorth || worth <= parseFloat(maxWorth))
      );
    });

    return { orders: filtered };
  } catch (err) {
    console.error("Failed to read/parse orders file:", err.message);
    return { error: err.message };
  }
}

function getOrderByIdFromJsonFile(orderId) {
  if (!fs.existsSync(DATA_PATH)) {
    return {
      error: "Orders data file not found. Please run fetchToJsonFile first.",
    };
  }

  try {
    const data = fs.readFileSync(DATA_PATH, "utf-8");
    const orders = JSON.parse(data);

    const order = orders.find((o) => o.orderID === orderId);
    if (!order) {
      return { error: `No order with ID ${orderId} found in local file.` };
    }

    return order;
  } catch (err) {
    console.error("Failed to read or parse orders file:", err.message);
    return { error: err.message };
  }
}

module.exports = {
  fetchOrderById,
  fetchOrderIdList,
  fetchOrdersWithDetails,
  fetchToJsonFile,
  fetchFromJsonFile,
  getOrderByIdFromJsonFile,
};
