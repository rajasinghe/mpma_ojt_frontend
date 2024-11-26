import api from "../api";
export const updatePageLoader = async ({ params }: any) => {
  const NIC_NO = params.NIC_NO;
  console.log(NIC_NO);
  const [trainee, departments, periods] = await Promise.all([
    api.get(`api/trainee/${NIC_NO}`),
    api.get("/api/department"),
    api.get(`api/trainee/periods`),
  ]);
  return { trainee: trainee.data, departments: departments.data, periods: periods.data };
};
