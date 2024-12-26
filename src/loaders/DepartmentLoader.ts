import api from "../api";
export const departmentLoader = async () => {
  const response = await api.get("api/department");
  return response.data;
};

export const departmentSummaryLoader = async () => {
  const response = await api.get("api/department/summary");
  return response.data;
};

export const singleDepartmentLoader = async ({ params }: any) => {
  const departmentId = params.id;
  const response = await api.get(`api/department/${departmentId}`);
  return { department: response.data };
};
