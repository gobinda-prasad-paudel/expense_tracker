import axios from "axios";

export const convertEngToNep = async (dateString) => {
  try {
    // Prepare form data like the HTML form
    const formData = new URLSearchParams();
    formData.append("date", dateString); // replace 'date' with the actual field name expected by the form

    const response = await axios.post(
      "https://ausstudies.com/date-converter",
      formData.toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    // Example response structure from your jQuery code:
    // response.ENGtoNEP = { year, month, date, day }
    if (response.data && response.data.ENGtoNEP) {
      const nepDate = response.data.ENGtoNEP;
      return `${nepDate.year}/${nepDate.month}/${nepDate.date}, ${nepDate.day}`;
    } else {
      throw new Error("No ENGtoNEP data in response");
    }
  } catch (err) {
    console.error("Date conversion failed:", err.message);
    return null;
  }
};

// Example usage:
(async () => {
  const nepDate = await convertEngToNep("2025-08-17"); // YYYY-MM-DD format
  console.log("Converted Nepali Date:", nepDate);
})();
