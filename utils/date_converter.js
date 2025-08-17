import { ADToBS } from "bikram-sambat-js";
import axios from "axios";

export const formatDate = async (date, isFullFormat = true) => {
  const adDateObj = new Date(date);
  const adDay = adDateObj.getDate();
  const adMonth = adDateObj.getMonth() + 1;
  const adYear = adDateObj.getFullYear();

  let bsDate;

  try {
    const apiUrl = `https://sudhang.pythonanywhere.com/ADtoBS/${adYear}/${adMonth}/${adDay}`;
    const { data } = await axios.get(apiUrl);

    if (!data.bs_date) throw new Error("No BS date found in API response");

    const { year, month, day } = data.bs_date;
    bsDate = { year, month, day };
  } catch (err) {
    // fallback to bikram-sambat-js
    const adDateStr = adDateObj.toISOString().slice(0, 10);
    const bsStr = ADToBS(adDateStr); // e.g. "2079-10-14"
    const parts = bsStr.split("-");
    bsDate = {
      year: parseInt(parts[0]),
      month: parseInt(parts[1]),
      day: parseInt(parts[2]),
    };
    console.log("⚠️ Second (Fallback to bikram-sambat-js) due to ", err);
  }

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

  const bsMonthName = nepaliMonths[bsDate.month - 1];

  // Format AD date for display
  const options = { day: "numeric", month: "long", year: "numeric" };
  const formattedAdDate = adDateObj.toLocaleDateString("en-GB", options);

  return isFullFormat
    ? `${bsDate.day} ${bsMonthName} ${bsDate.year} (${formattedAdDate})`
    : `${bsDate.day} ${bsMonthName} ${bsDate.year}`;
};
