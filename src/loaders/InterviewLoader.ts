import api from "../api";

export const InterviewLoader = async () => {

  const response = await api.get("api/interview");

  console.log("InterviewLoader response", response.data);
  return response.data.InterviewDetails;
};
