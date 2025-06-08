import api from "../api";

export const PaymentSlipLoader = async () => {
  const [summaryResponse] = await Promise.all([
    api.get("api/attendence/summary")
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
    attendecesResposne,
    attendenceSummaryResponse,
    workingDaysResponse,
    selectedTrainees
  ] = await Promise.all([
    api.get("api/attendence", {
      params: {
        month: lastMonth,
        year: year,
      },
    }),
    api.get("api/attendence/summary"),
    api.get(`api/calender/${year}/${lastMonth}`),
    api.get("api/attendence/generatePaySlip/summary", {
      params: {
        month: lastMonth,
        year: year,
      },
    })
  ]);

  // Sort filteredTrainees to match selectedTraineeIds order
  const filteredTrainees = selectedTrainees.data.traineeIds.map((id: number) => 
    attendecesResposne.data.find(
      (trainee: { trainee_id: number }) => trainee.trainee_id === id
    )
  ).filter(Boolean);

  return {
    summary: attendenceSummaryResponse.data,
    trainees: filteredTrainees,
    workingDays: workingDaysResponse.data,
  };
}