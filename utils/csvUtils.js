const { Parser } = require("json2csv");

const parseToCSV = (data, fields, delimiter = ";") => {
  try {
    const opts = { fields, delimiter };
    const parser = new Parser(opts);
    return parser.parse(data);
  } catch (err) {
    console.error("CSV Conversion Error:", err.message);
    throw new Error("Error converting data to CSV");
  }
};

const formatOrderDataToCSV = (orders) => {
  return orders.map((order) => ({
    orderID: order.orderID,
    orderWorth: order.orderWorth,
    products: order.products
      .map((p) => `ID:${p.productID} QTY:${p.quantity}`)
      .join("|"),
  }));
};

module.exports = { parseToCSV, formatOrderDataToCSV };
