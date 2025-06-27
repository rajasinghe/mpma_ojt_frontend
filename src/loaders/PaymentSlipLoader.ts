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

  const today = new Date();
  const lastMonth = today.getMonth() === 0 ? 12 : today.getMonth();
  const year = today.getMonth() === 0 ? today.getFullYear() - 1 : today.getFullYear();

  const [
    attendenceSummaryResponse,
    paymentSummary
  ] = await Promise.all([

    api.get("/api/attendence/getDateSummary"),
    api.get("api/payments/generatePaySlip/summary", {
      params: {
        month: lastMonth,
        year: year,
      },
    })
  ]);

  return {
    summary: attendenceSummaryResponse.data,
    traineesWIthoutBankDetails: paymentSummary.data.traineesWithoutBankDetails,
    traineesWithoutBank350: paymentSummary.data.traineesWithoutBank350,
    selectTrainees: paymentSummary.data.selectTrainees,
    allGOVTrainees: paymentSummary.data.allGOVTrainees,
    meanPayment: paymentSummary.data.meanPayment,
  };
}