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
    api.get("/api/attendence/getDateSummary"),
    api.get(`api/calender/${year}/${lastMonth}`),
    api.get("api/payments/generatePaySlip/summary", {
      params: {
        month: lastMonth,
        year: year,
      },
    })
  ]);

  // Sort filteredTrainees to match selectedTraineeIds order
const filteredTrainees = selectedTrainees.data.traineeIds
  .map((data: { trainee_id: number; payment: number }) => {
    const filterTraineeData = attendecesResposne.data.find(
      (trainee: { trainee_id: number }) => trainee.trainee_id === data.trainee_id
    );
    return filterTraineeData
      ? { ...filterTraineeData, payment: data.payment }
      : null;
  })
  .filter(Boolean);
  
  const GOVTrainees = selectedTrainees.data.allGOVTrainees
  .map((govTrainee: { trainee_id: number, AttCount: number }) => {
    const traineeData = attendecesResposne.data.find(
      (trainee: { trainee_id: number }) => trainee.trainee_id === govTrainee.trainee_id
    );
    
    // Return combined data with AttCount
    return traineeData ? {
      ...traineeData,
      AttCount: govTrainee.AttCount
    } : null;
  })
  .filter(Boolean);

  console.log("GOVTrainees", attendenceSummaryResponse.data);
  console.log("filterTraineeData", selectedTrainees);

  return {
    summary: attendenceSummaryResponse.data,
    trainees: filteredTrainees,
    workingDays: workingDaysResponse.data,
    traineesWIthoutBankDetails: selectedTrainees.data.traineesWithoutBankDetails,
    GOVTrainees: GOVTrainees,
  };
}