import api from "../api";

export const PaymentSlipLoader = async () => {
  const [summaryResponse] = await Promise.all([
    api.get("/api/attendence/getDateSummary")
  ]);

  return {
    summaryData: summaryResponse.data
  };
};

export const paymentDetailsLoader = async () => {
  const attendenceSummaryResponse = await api.get("/api/attendence/getDateSummary");

  // Extract max year and month from the summary data
  const summaryData = attendenceSummaryResponse.data;

  // Assuming summaryData is an array of objects with year and month properties
  let maxYear = 0;
  let maxMonth = 0;

if (Array.isArray(summaryData) && summaryData.length > 0) {
  summaryData.forEach((item: { year: number; months?: number[] }) => {
    if (item.year > maxYear) {
      maxYear = item.year;
    }
  });

  // Find the item with maxYear and get its max month
  const yearItem = summaryData.find((item: { year: number }) => item.year === maxYear);
  if (yearItem && Array.isArray(yearItem.months) && yearItem.months.length > 0) {
    maxMonth = Math.max(...yearItem.months);
  }
}

  // Fetch payment summary using max year and month
  const paymentSummary = await api.get("api/payments/generatePaySlip/summary", {
    params: {
      month: maxMonth,
      year: maxYear,
    },
  });

  return {
    summary: summaryData,
    traineesWIthoutBankDetails: paymentSummary.data.traineesWithoutBankDetails,
    traineesWithoutBank350: paymentSummary.data.traineesWithoutBank350,
    selectTrainees: paymentSummary.data.selectTrainees,
    allGOVTrainees: paymentSummary.data.allGOVTrainees,
    meanPayment: paymentSummary.data.meanPayment,
  };
}