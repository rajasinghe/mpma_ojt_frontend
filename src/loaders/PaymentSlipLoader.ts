import api from "../api";

export const PaymentSlipLoader = async () => {
  const [summaryResponse] = await Promise.all([
    api.get("api/attendence/summary")
  ]);

  return {
    summaryData: summaryResponse.data
  };
};
