import api from "../api";

export const notificationLoader = async () => {
  const response = await api.get("api/notifications");
  console.log(response.data);
  return response.data;
};
