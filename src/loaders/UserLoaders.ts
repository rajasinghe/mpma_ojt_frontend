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

export const createUserLoader = async () => {
  const response = await api.get("auth/accessLevels");
  return response.data;
};

export const viewUsersPageLoader = async () => {
  const response = await api.get("auth/user");
  return response.data;
};
