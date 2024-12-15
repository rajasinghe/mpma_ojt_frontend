import api from "../api";
export const updatePageLoader = async ({ params }: any) => {
  const [trainee, departments, periods, violationStatus] = await Promise.all([
    api.get(`api/trainee/${params.id}`),
    api.get("/api/institutes"),
    api.get(`/api/programs`),
    api.get("api/trainee/regNoViolation", {
      params: {
        traineeId: params.id,
      },
    }),
  ]);
  console.log(violationStatus.data.exists);
  return {
    trainee: { ...trainee.data, regNoViolation: violationStatus.data.exists },
    institutes: departments.data,
    programs: periods.data,
  };
};
