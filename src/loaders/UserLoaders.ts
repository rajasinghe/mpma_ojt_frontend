import api from "../api";
export const profileLoader = async () => {
  try {
    console.log(api.defaults.headers.common.Authorization);
    const response = await api.get("auth");
    console.log(response.data);
    return response.data;
  } catch (error) {
    setTimeout(profileLoader, 1000);
  }
};
