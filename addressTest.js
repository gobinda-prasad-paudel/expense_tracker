// import IPLocate from "node-iplocate";
// import dotenv from "dotenv";
// dotenv.config();

// const client = new IPLocate(process.env.NODE_IP_LOCATE_API_KEY);

// async function testLookup() {
//   try {

//     const result = await client.lookup("17.253.0.0");
//     console.log("Lookup successful ✅");
//     console.log(result);
//   } catch (err) {
//     console.error("Lookup failed ❌");
//     console.error(err.message || err);
//   }
// }

// testLookup();

import express from "express";
import IPLocate from "node-iplocate";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const client = new IPLocate(process.env.NODE_IP_LOCATE_API_KEY);

// Middleware to trust proxy (needed if deployed behind reverse proxy like Netlify, Vercel, or Nginx)
app.set("trust proxy", true);

app.get("/", async (req, res) => {
  try {
    // Get user IP (falls back to remoteAddress if x-forwarded-for is missing)
    console.log("Request socket remote address", req.socket.remoteAddress);
    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress;

    console.log("User IP:", ip);

    // Lookup IP location
    const result = await client.lookup(ip);

    res.json({
      success: true,
      ip,
      location: result,
    });
  } catch (err) {
    console.error("Lookup failed ❌", err);
    res.status(500).json({
      success: false,
      error: err.message || err,
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
