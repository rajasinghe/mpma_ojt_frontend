import api from "../api";

export const holidaysLoader = async () => {
  const response = await api.get("/api/holidays");
  console.log(response.data);
  return response.data;
};
