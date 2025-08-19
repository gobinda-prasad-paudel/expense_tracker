// import IPLocate from "node-iplocate";
// import dotenv from "dotenv";

// dotenv.config();

// const client = new IPLocate(process.env.NODE_IP_LOCATE_API_KEY);

// const result = await client.lookup();
// console.log(result);

//Second
// import express from "express";
// import fetch from "node-fetch";
// import dotenv from "dotenv";

// dotenv.config();
// const app = express();
// const PORT = 3000;

// app.set("trust proxy", true);

// app.get("/user-location", async (req, res) => {
//   try {
//     const clientIp =
//       req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress;

//     console.log("Client IP:", clientIp);

//     const response = await fetch(
//       `https://iplocate.io/api/lookup/${clientIp}?apikey=${process.env.NODE_IP_LOCATE_API_KEY}`
//     );

//     const data = await response.json();

//     res.json({
//       ip: clientIp,
//       location: data,
//     });
//   } catch (err) {
//     console.error("Error:", err.message);
//     res.status(500).json({ error: "Failed to fetch location" });
//   }
// });

// app.listen(PORT, () => {
//   console.log(`Server running at http://localhost:${PORT}`);
// });

//Third one

// import express from "express";
// import dotenv from "dotenv";
// import ngrok from "ngrok";

// dotenv.config();

// const app = express();
// const PORT = 3000;

// function getClientIp(req) {
//   const xForwardedFor = req.headers["x-forwarded-for"];
//   let ip = xForwardedFor
//     ? xForwardedFor.split(",")[0]
//     : req.socket.remoteAddress;

//   if (ip.startsWith("::ffff:")) {
//     ip = ip.replace("::ffff:", "");
//   }

//   return ip;
// }

// app.get("/", (req, res) => {
//   const clientIp = getClientIp(req);
//   res.send(`Your public IP is: ${clientIp}`);
// });

// app.listen(PORT, async () => {
//   console.log(`Server running on http://localhost:${PORT} `);

//   try {
//     const url = await ngrok.connect({
//       addr: PORT,
//       authtoken: process.env.NGROK_AUTHTOKEN,
//     });
//     console.log(`🚀 Public URL via ngrok: ${url}`);
//   } catch (err) {
//     console.error("Failed to start ngrok:", err);
//   }
// });

import express from "express";
import dotenv from "dotenv";
import ngrok from "ngrok";
import IPLocate from "node-iplocate";

dotenv.config();

const app = express();
const PORT = 3000;

// Initialize IPLocate client
const client = new IPLocate(process.env.NODE_IP_LOCATE_API_KEY);

// Helper function to get client IP
function getClientIp(req) {
  const xForwardedFor = req.headers["x-forwarded-for"];
  let ip = xForwardedFor
    ? xForwardedFor.split(",")[0]
    : req.socket.remoteAddress;

  // Normalize IPv6-mapped IPv4 (::ffff:127.0.0.1)
  if (ip.startsWith("::ffff:")) {
    ip = ip.replace("::ffff:", "");
  }

  return ip;
}

// Route to return client IP + geolocation
app.get("/", async (req, res) => {
  try {
    const clientIp = getClientIp(req);

    // Lookup client IP using IPLocate
    const geo = await client.lookup(clientIp);

    res.json({
      ip: clientIp,
      location: geo.city
        ? `${geo.city}, ${geo.country}`
        : geo.country || "Unknown",
      details: geo,
    });
  } catch (err) {
    console.error("IP lookup failed:", err);
    res.status(500).json({ error: "Failed to get location" });
  }
});

// Start server + ngrok tunnel
app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);

  try {
    const url = await ngrok.connect({
      addr: PORT,
      authtoken: process.env.NGROK_AUTHTOKEN, // optional
    });
    console.log(`🚀 Public URL via ngrok: ${url}`);
  } catch (err) {
    console.error("Failed to start ngrok:", err);
  }
});
