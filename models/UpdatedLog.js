import mongoose from "mongoose";

const UserVisitSchema = new mongoose.Schema(
  {
    ip: { type: String, required: true },
    country: { type: String },
    country_code: { type: String },
    is_eu: { type: Boolean },
    city: { type: String },
    continent: { type: String },
    latitude: { type: Number },
    longitude: { type: Number },
    time_zone: { type: String },
    postal_code: { type: String },
    subdivision: { type: String },
    currency_code: { type: String },
    calling_code: { type: String },
    is_anycast: { type: Boolean },
    is_satellite: { type: Boolean },

    asn: {
      asn: { type: String },
      route: { type: String },
      netname: { type: String },
      name: { type: String },
      country_code: { type: String },
      domain: { type: String },
      type: { type: String },
      rir: { type: String },
    },

    privacy: {
      is_abuser: { type: Boolean },
      is_anonymous: { type: Boolean },
      is_bogon: { type: Boolean },
      is_hosting: { type: Boolean },
      is_icloud_relay: { type: Boolean },
      is_proxy: { type: Boolean },
      is_tor: { type: Boolean },
      is_vpn: { type: Boolean },
    },

    company: {
      name: { type: String },
      domain: { type: String },
      country_code: { type: String },
      type: { type: String },
    },

    abuse: {
      address: { type: String },
      country_code: { type: String },
      email: { type: String },
      name: { type: String },
      network: { type: String },
      phone: { type: String },
    },

    // Extra fields for user device/session info
    device: { type: String },
    os: { type: String },
    browser: { type: String },
    date: { type: String }, // formatted date (YYYY-MM-DD)
    time: { type: String }, // formatted time (hh:mm:ss AM/PM)
  },
  { timestamps: true }
); // adds createdAt & updatedAt automatically

const UserVisitUpdated = mongoose.model("UserVisitUpdated", UserVisitSchema);

export default UserVisitUpdated;
