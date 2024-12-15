import api from "../api.ts";

export const viewTraineesPageLoader = async () => {
  const [trainees, departments, programmes, institutes] = await Promise.all([
    api.get("/api/trainee"),
    api.get("/api/department"),
    api.get("/api/programs"),
    api.get("/api/institutes"),
  ]);
  return {
    trainees: trainees.data,
    departments: departments.data,
    programmes: programmes.data,
    institutes: institutes.data,
  };
};

export const traineesInsertFormPageLoader = async () => {
  const [periods, departments] = await Promise.all([
    api.get(`api/periods`),
    api.get("api/department"),
  ]);
  return { periods: periods.data, departments: departments.data };
};

export const newTraineesInsertPageLoader = async () => {
  const [periods, institutes, programs] = await Promise.all([
    api.get("api/periods"),
    api.get("api/institutes"),
    api.get("api/programs"),
  ]);
  return { periods: periods.data, institutes: institutes.data, programs: programs.data };
};

export const traineeAddSchedulePageLoader = async ({ params }: any) => {
  const [traineeResponse, departmentsResponse, periodsResponse, scheduleResponse] =
    await Promise.allSettled([
      api.get(`api/trainee/${params.id}`),
      api.get("api/department"),
      api.get("api/periods"),
      api.get(`api/trainee/${params.id}/schedule`),
    ]);
  if (
    traineeResponse.status == "fulfilled" &&
    departmentsResponse.status == "fulfilled" &&
    periodsResponse.status == "fulfilled"
  ) {
    let trainee = { ...traineeResponse.value.data };
    if (scheduleResponse.status == "fulfilled") {
      trainee.schedules = scheduleResponse.value.data;
    }
    return {
      trainee,
      departmentsList: departmentsResponse.value.data,
      periodsList: periodsResponse.value.data,
    };
  } else {
    throw new Error("failed to get necessary records");
  }
};

export const traineePersonalDetailsUpdatePageLoader = async ({ params }: any) => {
  //need to fetch institutes ,trainee details,programs
  //if the trainee is cinec/naita and more cinec/naita students are available if available only cinec/naita is available as a institute
  //for other normal students if trainees are inserted from respective reg pattern then only the matching program code programs are allowed in the program list.
  const [institutes, programmes, trainee] = await Promise.all([
    api.get("api/institutes"),
    api.get("api/programs"),
    api.post(`api/trainee/${params.id}`),
  ]);
  return {
    institutes: institutes.data,
    programmes: programmes.data,
    trainee: trainee.data,
  };
};
export const traineeBankDetailsLoader = async ({ params }: any) => {
  const [traineeResponse, paymentResponse] = await Promise.allSettled([
    api.get(`api/trainee/${params.id}`),
    api.get(`api/trainee/${params.id}/payment`),
  ]);
  let trainee;
  if (traineeResponse.status == "fulfilled") {
    trainee = traineeResponse.value.data;
    if (paymentResponse.status == "fulfilled") {
      console.log("payment response full filled data-", paymentResponse.value.data);
      trainee.bankDetails = paymentResponse.value.data;
    }
  } else {
    throw new Error("failed to get trainee details");
  }
  return {
    ...trainee,
  };
};
