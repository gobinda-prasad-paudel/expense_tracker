//Replaced currently
import geoip from "geoip-lite";
import { SystemLog, UserVisit } from "../models/Log.js";
import IPLocate from "node-iplocate";
import useragent from "useragent";
import dotenv from "dotenv";
dotenv.config();
import UserVisitUpdated from "../models/UpdatedLog.js";

const client = new IPLocate(process.env.NODE_IP_LOCATE_API_KEY);

export async function logUserVisit(req) {
  try {
    let ip =
      req.headers["x-forwarded-for"] ||
      req.connection.remoteAddress ||
      "0.0.0.0";

    // Take only the first IP if there are multiple
    if (ip.includes(",")) {
      ip = ip.split(",")[0].trim();
    }

    // Normalize IPv6-mapped IPv4
    if (ip.startsWith("::ffff:")) {
      ip = ip.replace("::ffff:", "");
    }

    const agent = useragent.parse(req.headers["user-agent"]);

    // Lookup geolocation
    let geo = {};
    try {
      geo = await client.lookup(ip);
    } catch (apiErr) {
      console.error("IPLocate API error:", apiErr.message);
      geo = {}; // fallback to empty object
    }

    const now = new Date();
    const date = now.toISOString().split("T")[0]; // YYYY-MM-DD
    const time = now.toLocaleTimeString("en-US", { hour12: true });

    const visit = new UserVisitUpdated({
      ip,
      country: geo?.country || null,
      country_code: geo?.country_code || null,
      is_eu: geo?.is_eu ?? null,
      city: geo?.city || null,
      continent: geo?.continent || null,
      latitude: geo?.latitude || null,
      longitude: geo?.longitude || null,
      time_zone: geo?.time_zone || null,
      postal_code: geo?.postal_code || null,
      subdivision: geo?.subdivision || null,
      currency_code: geo?.currency_code || null,
      calling_code: geo?.calling_code || null,
      is_anycast: geo?.is_anycast ?? null,
      is_satellite: geo?.is_satellite ?? null,

      asn: geo?.asn || {},
      privacy: geo?.privacy || {},
      company: geo?.company || {},
      abuse: geo?.abuse || {},

      device: agent.device.toString(),
      os: agent.os.toString(),
      browser: agent.toAgent(),
      date,
      time,
    });

    await visit.save();
    console.log(
      "User visit saved ✅:",
      "|",
      "Country: ",
      visit.country,
      "|",
      "City: ",
      visit.city,
      "|",
      "Time zone: ",
      visit.time_zone
    );
  } catch (err) {
    console.error("Error logging user visit:", err);
  }
}

export async function logSystemEvent(type, message, details = {}) {
  try {
    const now = new Date();
    const date = now.toISOString().split("T")[0];
    const time = now.toLocaleTimeString("en-US", { hour12: true });

    const log = new SystemLog({
      type,
      message,
      details,
      date,
      time,
    });

    await log.save();
    console.log(`[${type}] System log saved:`, message);
  } catch (err) {
    console.error("Error saving system log:", err);
  }
}

export async function userVisitLogger(req, res, next) {
  // Fire-and-forget, don't block the request
  logUserVisit(req).catch((err) => console.error(err));
  next();
}
