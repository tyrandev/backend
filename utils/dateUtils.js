function getToday() {
  const today = new Date();
  return today.toISOString().split("T")[0];
}

function getYesterday() {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  return yesterday.toISOString().split("T")[0];
}

module.exports = { getToday, getYesterday };
