export const formatDate = (isoDate: string) => {
  const date = new Date(isoDate);
  const formattedDate = date.toLocaleDateString("en-GB");
  return formattedDate;
};

export const formatDateToIso = (isodate: string) => {
  return isodate.split("T")[0];
};

/**
 *
 * @param periods
 * @param selectedPeriod
 * @param startDate
 * @returns the end date as a date
 */
export const endDateCalculator = (
  periods: any[],
  selectedPeriod: number,
  startDate: Date
): Date => {
  try {
    console.log(selectedPeriod, periods);
    const endDate = new Date(startDate);
    const period = periods.find((period) => {
      return period.id === selectedPeriod;
    });

    if (!period) {
      throw new Error("NO_PERIOD");
    }
    if (period.year) {
      endDate.setFullYear(endDate.getFullYear() + period.year);
    }
    if (period.Months) {
      endDate.setMonth(endDate.getMonth() + period.Months);
    }

    if (period.weeks) {
      endDate.setDate(endDate.getDate() + period.weeks * 7);
    }
    if (period.days) {
      endDate.setDate(endDate.getDate() + period.days);
    }
    endDate.setDate(endDate.getDate() - 1);
    console.log(endDate);
    return endDate;
  } catch (error) {
    console.log("error");
    console.log(error);
    throw error;
  }
};

/**
 *
 * @param monthNumber
 * @returns the string representation of the month
 */
export function getMonthName(monthNumber: number) {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // Check if the monthNumber is valid
  if (monthNumber < 1 || monthNumber > 12) {
    return "Invalid month number";
  }

  return months[monthNumber - 1];
}

export function getDateDifferenceFormatted(date1: string | Date, date2: string | Date): string {
  let start = new Date(date1);
  let end = new Date(date2);
  let negative = false;

  // Check if the duration should be negative
  if (start > end) {
    [start, end] = [end, start];
    negative = true;
  }

  // Include the end date (make range inclusive)
  end.setDate(end.getDate() + 1);

  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();
  let days = end.getDate() - start.getDate();

  if (days < 0) {
    months--;
    const prevMonth = new Date(end.getFullYear(), end.getMonth(), 0);
    days += prevMonth.getDate();
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  const parts: string[] = [];
  if (years > 0) parts.push(`${years} year${years !== 1 ? 's' : ''}`);
  if (months > 0) parts.push(`${months} month${months !== 1 ? 's' : ''}`);
  if (days > 0 || (!years && !months)) parts.push(`${days} day${days !== 1 ? 's' : ''}`);

  const result = parts.join(' ') || '0 days';
  return negative ? `- ${result}` : result;
}
