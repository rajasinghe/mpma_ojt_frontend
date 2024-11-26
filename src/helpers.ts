export const formatDate = (isoDate: string) => {
  const date = new Date(isoDate);
  const formattedDate = date.toLocaleDateString("en-GB");
  return formattedDate;
};

export const formatDateToIso = (isodate: string) => {
  return isodate.split("T")[0];
};
