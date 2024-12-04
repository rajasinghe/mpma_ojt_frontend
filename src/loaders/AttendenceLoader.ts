import api from "../api";
export const viewAttendenceLoader = async () => {
  const today = new Date();

  const [
    attendecesResposne,
    workingDaysResponse,
    departmentsResponse,
    programsResponse,
    institutesResponse,
  ] = await Promise.all([
    api.get("api/attendence", {
      params: {
        month: today.getMonth() + 1,
        year: today.getFullYear(),
      },
    }),
    api.get(`api/calender/${today.getFullYear()}/${today.getMonth() + 1}`),
    api.get("/api/department"),
    api.get("/api/programs"),
    api.get("/api/institutes"),
  ]);
  return {
    trainees: attendecesResposne.data,
    workingDays: workingDaysResponse.data,
    departments: departmentsResponse.data,
    programs: programsResponse.data,
    institutes: institutesResponse.data,
  };
};
