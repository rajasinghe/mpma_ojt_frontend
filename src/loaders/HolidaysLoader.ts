import api from "../api";

export const holidaysLoader = async () => {
  const response = await api.get("api/calender/event");
  console.log(response.data);
  return response.data;
};
