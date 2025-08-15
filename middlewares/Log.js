import useragent from "useragent";
import geoip from "geoip-lite";
// ----------------- Helper Functions -----------------

import { SystemLog, UserVisit } from "../models/Log.js";

export async function logUserVisit(req) {
  try {
    const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    const agent = useragent.parse(req.headers["user-agent"]);
    const geo = geoip.lookup(ip) || {};

    const now = new Date();
    const date = now.toISOString().split("T")[0]; // YYYY-MM-DD
    const time = now.toLocaleTimeString("en-US", { hour12: true });

    const visit = new UserVisit({
      ipAddress: ip,
      location: geo.city
        ? `${geo.city}, ${geo.country}`
        : geo.country || "Unknown",
      device: agent.device.toString(),
      os: agent.os.toString(),
      browser: agent.toAgent(),
      date,
      time,
    });

    await visit.save();
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
