const cron = require("node-cron");
const { getToday, getYesterday } = require("../utils/dateUtils");
const { fetchToJsonFile } = require("../services/orderService");

function startOrderFetchCron() {
  const runJob = async () => {
    const dateConfirmedFrom = getYesterday();
    const dateConfirmedTo = getToday();
    const minWorth = null;
    const maxWorth = null;

    console.log("🔄 Running daily order fetch job...");
    const result = await fetchToJsonFile(
      dateConfirmedFrom,
      dateConfirmedTo,
      minWorth,
      maxWorth
    );

    if (result.error) {
      console.error("Cron job failed:", result.error);
    } else {
      console.log("Cron job completed successfully.");
    }
  };

  runJob();

  cron.schedule("0 0 * * *", runJob);
}

module.exports = { startOrderFetchCron };
