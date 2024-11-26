import api from "../api";
export const departmentLoader = async () => {
  const response = await api.get("api/department");
  return response.data;
};
