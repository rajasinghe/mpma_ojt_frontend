import api from "../api";
export const viewAttendenceLoader = async ({ request }: any) => {
  const today = new Date();
  const url = new URL(request.url);
  const queryParams = Object.fromEntries(url.searchParams.entries());
  console.log(queryParams.id);
  const [
    attendecesResposne,
    attendenceSummaryResponse,
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
    api.get("api/attendence/summary"),
    api.get(`api/calender/${today.getFullYear()}/${today.getMonth() + 1}`),
    api.get("/api/department"),
    api.get("/api/programs"),
    api.get("/api/institutes"),
  ]);
  return {
    summary: attendenceSummaryResponse.data,
    trainees: attendecesResposne.data,
    workingDays: workingDaysResponse.data,
    departments: departmentsResponse.data,
    programs: programsResponse.data,
    institutes: institutesResponse.data,
  };
};
