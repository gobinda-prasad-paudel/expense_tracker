import BikramSambat, { ADToBS, BSToAD } from "bikram-sambat-js";

export const formatDate = (date, isFullFormat = true) => {
  // Convert ISO string to YYYY-MM-DD format string
  const adDate = new Date(date).toISOString().slice(0, 10); // e.g. "2025-08-04"

  // Convert AD date to BS
  const bsDate = ADToBS(adDate);

  // Map month number to Nepali month name
  const nepaliMonths = [
    "Baishakh",
    "Jestha",
    "Ashadh",
    "Shrawan",
    "Bhadra",
    "Ashwin",
    "Kartik",
    "Mangsir",
    "Poush",
    "Magh",
    "Falgun",
    "Chaitra",
  ];

  const bsYear = bsDate.slice(0, 4);

  const bsMonthName = nepaliMonths[parseInt(bsDate.slice(5, 7)) - 1]; // Month is 1-based index
  const bsDay = parseInt(bsDate.slice(8, 10));

  // Format AD date to readable format (e.g. "28 October 2024")
  const adDateObj = new Date(date);
  const options = { day: "numeric", month: "long", year: "numeric" };
  const formattedAdDate = adDateObj.toLocaleDateString("en-GB", options);

  // Combine to required format
  return isFullFormat
    ? `${bsDay} ${bsMonthName} ${bsYear} (${formattedAdDate})`
    : `${bsDay} ${bsMonthName} ${bsYear} `;
};
