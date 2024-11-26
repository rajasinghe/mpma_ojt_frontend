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
  const [trainee, departments] = await Promise.all([
    api.get(`api/trainee/${params.id}`),
    api.get("api/department"),
  ]);
  return { trainee: trainee.data, departmentsList: departments.data };
};
