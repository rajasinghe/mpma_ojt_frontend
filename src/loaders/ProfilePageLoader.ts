//need to fetch the schedules and bank details and other information
//request to get schedule end point
//request to get trainee details end point
//request to get bank details end point
import api from "../api";

export const profilePageLoader = async ({ params }: any) => {
  const traineeId = params.id;
  const [
    traineeResponse,
    departmentsResponse,
    periodsResponse,
    programsResponse,
    scheduleResponse,
    paymentResponse,
    attendenceSummaryResponse,
    institutesResponse,
  ] = await Promise.allSettled([
    api.get(`api/trainee/${traineeId}`),
    api.get("api/department"),
    api.get("api/periods"),
    api.get("api/programs"),
    api.get(`api/trainee/${traineeId}/schedule`),
    api.get(`api/payments/${traineeId}`),
    api.get(`api/trainee/${traineeId}/attendence`),
    api.get("api/institutes"),
  ]);
  let trainee;

  if (
    traineeResponse.status == "fulfilled" &&
    departmentsResponse.status == "fulfilled" &&
    attendenceSummaryResponse.status == "fulfilled" &&
    programsResponse.status == "fulfilled" &&
    periodsResponse.status == "fulfilled" &&
    institutesResponse.status == "fulfilled"
  ) {
    trainee = traineeResponse.value.data;
    trainee.attendence = attendenceSummaryResponse.value.data;
    if (paymentResponse.status == "fulfilled") {
      console.log("payment response full filled data-", paymentResponse.value.data);
      trainee.bankDetails = paymentResponse.value.data;
    }
    if (scheduleResponse.status == "fulfilled") {
      console.log("payment response full filled data-", scheduleResponse.value.data);
      trainee.schedules = scheduleResponse.value.data;
    }
  } else {
    throw new Error("failed to get trainee details");
  }
  console.log(traineeResponse.value.data);
  return {
    trainee,
    departments: departmentsResponse.value.data,
    programs: programsResponse.value.data,
    periods: periodsResponse.value.data,
    institutes: institutesResponse.value.data,
  };
  //currently the trainee end point is getting the schedule but in future this may change
};
