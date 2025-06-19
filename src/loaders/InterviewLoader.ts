import api from "../api";
import moment from "moment";

export const InterviewLoader = async () => {
  const response = await api.get("api/interview");
  const interviews = response.data.InterviewDetails;

  // Get current date
  const currentDate = moment();

  // Filter last 7 days interviews
  const lastSevenDaysInterviews = interviews.filter((interview: any) => {
    const interviewDate = moment(interview.createdAt);
    return currentDate.diff(interviewDate, 'days') <= 7;
  });

  // Filter last 30 days interviews
  const lastThirtyDaysInterviews = interviews.filter((interview: any) => {
    const interviewDate = moment(interview.createdAt);
    return currentDate.diff(interviewDate, 'days') <= 30;
  });

  console.log("Interviews loaded:", interviews);
  console.log("Last 7 days interviews:", lastSevenDaysInterviews);
  console.log("Last 30 days interviews:", lastThirtyDaysInterviews);

  return {
    lastSevenDays: lastSevenDaysInterviews,
    lastThirtyDays: lastThirtyDaysInterviews,
    allInterviews: interviews
  };
};
