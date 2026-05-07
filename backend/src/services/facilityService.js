// ============================================================
// RemoTriage v4 — Facility Service
// src/services/facilityService.js
//
// Provides nearby facility lookup via MongoDB (when connected)
// with a comprehensive offline static fallback for each county.
// Also exports KENYA_EMERGENCY_CONTACTS used in error responses.
// ============================================================

"use strict";

const logger = require("../utils/logger");

// ── KENYA EMERGENCY CONTACTS ─────────────────────────────────
const KENYA_EMERGENCY_CONTACTS = {
  national: {
    name: "Kenya Emergency Medical Services",
    number: "0800 723 253",
    free: true,
    available: "24/7",
  },
  ambulance: {
    name: "Ambulance (Nairobi / major towns)",
    number: "999",
    free: true,
    available: "24/7",
  },
  fire: {
    name: "Fire & Rescue",
    number: "999",
    free: true,
    available: "24/7",
  },
  stAmbulance: {
    name: "St John Ambulance Kenya",
    number: "0722 211 888",
    free: false,
    available: "24/7",
  },
  // Backward-compatible alias for older clients.
  stAmbulanace: {
    name: "St John Ambulance Kenya",
    number: "0722 211 888",
    free: false,
    available: "24/7",
  },
};

// ── STATIC COUNTY REFERRAL DATA ──────────────────────────────
// Offline fallback covering all 47 counties.
// Populated with actual Level 5 / Level 6 referral hospitals.
const COUNTY_REFERRAL = {
  Nairobi: {
    referralHospital: { name: "Kenyatta National Hospital", level: "L6", phone: "0800 724 800" },
    dispensary: { name: "Mama Lucy Kibaki Hospital", level: "L4", phone: "020 2042000" },
  },
  Mombasa: {
    referralHospital: { name: "Coast General Teaching & Referral Hospital", level: "L6", phone: "041 2314201" },
    dispensary: { name: "Port Reitz District Hospital", level: "L4", phone: "041 4490163" },
  },
  Kisumu: {
    referralHospital: { name: "Jaramogi Oginga Odinga Teaching & Referral Hospital", level: "L6", phone: "057 2022225" },
    dispensary: { name: "Kisumu County Hospital", level: "L4", phone: "057 2023305" },
  },
  Nakuru: {
    referralHospital: { name: "Nakuru County Referral Hospital", level: "L5", phone: "051 2212006" },
    dispensary: { name: "Naivasha District Hospital", level: "L4", phone: "0722 205 568" },
  },
  Eldoret: {
    referralHospital: { name: "Moi Teaching & Referral Hospital", level: "L6", phone: "053 2063000" },
    dispensary: { name: "Eldoret District Hospital", level: "L4", phone: "053 2062225" },
  },
  "Uasin Gishu": {
    referralHospital: { name: "Moi Teaching & Referral Hospital", level: "L6", phone: "053 2063000" },
    dispensary: { name: "Burnt Forest Sub-District Hospital", level: "L3", phone: "0722 200 455" },
  },
  Kiambu: {
    referralHospital: { name: "Thika Level 5 Hospital", level: "L5", phone: "0725 221 000" },
    dispensary: { name: "Kiambu Level 4 Hospital", level: "L4", phone: "066 22150" },
  },
  Nyeri: {
    referralHospital: { name: "Nyeri County Referral Hospital", level: "L5", phone: "061 2030002" },
    dispensary: { name: "Karatina District Hospital", level: "L4", phone: "0720 200 456" },
  },
  Meru: {
    referralHospital: { name: "Meru Teaching & Referral Hospital", level: "L5", phone: "064 31027" },
    dispensary: { name: "Nkubu Sub-District Hospital", level: "L3", phone: "0723 500 123" },
  },
  Machakos: {
    referralHospital: { name: "Machakos Level 5 Hospital", level: "L5", phone: "044 21304" },
    dispensary: { name: "Kathiani Sub-District Hospital", level: "L3", phone: "0726 560 123" },
  },
  Kisii: {
    referralHospital: { name: "Kisii Teaching & Referral Hospital", level: "L5", phone: "058 30071" },
    dispensary: { name: "Ogembo District Hospital", level: "L4", phone: "0728 730 101" },
  },
  Kakamega: {
    referralHospital: { name: "Kakamega County General Teaching & Referral Hospital", level: "L5", phone: "056 30320" },
    dispensary: { name: "Mumias District Hospital", level: "L4", phone: "0726 630 230" },
  },
  Kilifi: {
    referralHospital: { name: "Kilifi County Hospital", level: "L5", phone: "041 7522003" },
    dispensary: { name: "Malindi District Hospital", level: "L4", phone: "042 21090" },
  },
  Kwale: {
    referralHospital: { name: "Kwale County Referral Hospital", level: "L4", phone: "0722 567 890" },
    dispensary: { name: "Msambweni District Hospital", level: "L4", phone: "040 4020145" },
  },
  Garissa: {
    referralHospital: { name: "Garissa County Referral Hospital", level: "L5", phone: "046 2062001" },
    dispensary: { name: "Bura Sub-District Hospital", level: "L3", phone: "0721 445 677" },
  },
  Wajir: {
    referralHospital: { name: "Wajir County Referral Hospital", level: "L4", phone: "046 4421050" },
    dispensary: { name: "Habaswein District Hospital", level: "L3", phone: "0720 111 222" },
  },
  Mandera: {
    referralHospital: { name: "Mandera County Referral Hospital", level: "L4", phone: "046 5221064" },
    dispensary: { name: "Elwak Sub-District Hospital", level: "L3", phone: "0721 333 444" },
  },
  "Homa Bay": {
    referralHospital: { name: "Homa Bay County Teaching & Referral Hospital", level: "L5", phone: "059 22002" },
    dispensary: { name: "Oyugis District Hospital", level: "L4", phone: "0726 570 234" },
  },
  Migori: {
    referralHospital: { name: "Migori County Referral Hospital", level: "L4", phone: "0724 445 566" },
    dispensary: { name: "Awendo District Hospital", level: "L4", phone: "0722 566 677" },
  },
  Siaya: {
    referralHospital: { name: "Siaya County Referral Hospital", level: "L4", phone: "0726 788 900" },
    dispensary: { name: "Yala Sub-District Hospital", level: "L3", phone: "0720 234 567" },
  },
  Bungoma: {
    referralHospital: { name: "Bungoma County Referral Hospital", level: "L5", phone: "055 30122" },
    dispensary: { name: "Webuye District Hospital", level: "L4", phone: "0722 445 677" },
  },
  Embu: {
    referralHospital: { name: "Embu Level 5 Hospital", level: "L5", phone: "068 31099" },
    dispensary: { name: "Runyenjes Sub-District Hospital", level: "L3", phone: "0721 234 567" },
  },
  Kitui: {
    referralHospital: { name: "Kitui County Referral Hospital", level: "L4", phone: "044 22052" },
    dispensary: { name: "Mwingi District Hospital", level: "L4", phone: "0726 234 112" },
  },
  Makueni: {
    referralHospital: { name: "Makindu District Hospital", level: "L4", phone: "0726 345 678" },
    dispensary: { name: "Sultan Hamud Sub-District Hospital", level: "L3", phone: "0720 678 901" },
  },
  Laikipia: {
    referralHospital: { name: "Nanyuki Teaching & Referral Hospital", level: "L5", phone: "062 32130" },
    dispensary: { name: "Rumuruti District Hospital", level: "L4", phone: "0720 234 456" },
  },
  Narok: {
    referralHospital: { name: "Narok County Referral Hospital", level: "L4", phone: "050 22010" },
    dispensary: { name: "Kilgoris District Hospital", level: "L3", phone: "0720 890 123" },
  },
  Kajiado: {
    referralHospital: { name: "Kajiado County Referral Hospital", level: "L4", phone: "0722 567 012" },
    dispensary: { name: "Ngong District Hospital", level: "L4", phone: "0726 012 345" },
  },
  Kericho: {
    referralHospital: { name: "Kericho County Referral Hospital", level: "L5", phone: "052 21241" },
    dispensary: { name: "Londiani Sub-District Hospital", level: "L3", phone: "0721 345 678" },
  },
  Turkana: {
    referralHospital: { name: "Lodwar County Referral Hospital", level: "L4", phone: "054 22023" },
    dispensary: { name: "Kakuma District Hospital", level: "L4", phone: "0726 789 012" },
  },
  "Tana River": {
    referralHospital: { name: "Hola District Hospital", level: "L4", phone: "0722 123 456" },
    dispensary: { name: "Garsen Sub-District Hospital", level: "L3", phone: "0720 456 789" },
  },
  Lamu: {
    referralHospital: { name: "King Fahad District Hospital", level: "L4", phone: "042 6331010" },
    dispensary: { name: "Faza Sub-District Hospital", level: "L3", phone: "0720 321 654" },
  },
  Marsabit: {
    referralHospital: { name: "Marsabit County Referral Hospital", level: "L4", phone: "069 2020001" },
    dispensary: { name: "Moyale District Hospital", level: "L3", phone: "0721 234 890" },
  },
  Isiolo: {
    referralHospital: { name: "Isiolo County Referral Hospital", level: "L4", phone: "064 52014" },
    dispensary: { name: "Merti Sub-District Hospital", level: "L3", phone: "0720 678 234" },
  },
  Baringo: {
    referralHospital: { name: "Kabarnet District Hospital", level: "L4", phone: "053 22018" },
    dispensary: { name: "Marigat Sub-District Hospital", level: "L3", phone: "0726 890 123" },
  },
  Vihiga: {
    referralHospital: { name: "Vihiga District Hospital", level: "L4", phone: "056 62178" },
    dispensary: { name: "Hamisi Sub-District Hospital", level: "L3", phone: "0721 567 890" },
  },
  Busia: {
    referralHospital: { name: "Busia County Referral Hospital", level: "L4", phone: "055 22083" },
    dispensary: { name: "Port Victoria Sub-District Hospital", level: "L3", phone: "0722 234 567" },
  },
  Nyamira: {
    referralHospital: { name: "Nyamira County Referral Hospital", level: "L4", phone: "0726 987 654" },
    dispensary: { name: "Keroka District Hospital", level: "L4", phone: "0720 456 012" },
  },
  Nandi: {
    referralHospital: { name: "Nandi Hills District Hospital", level: "L4", phone: "053 32061" },
    dispensary: { name: "Kapsabet District Hospital", level: "L4", phone: "053 34014" },
  },
  "Trans Nzoia": {
    referralHospital: { name: "Kitale Level 4 Hospital", level: "L4", phone: "054 30246" },
    dispensary: { name: "Endebess Sub-District Hospital", level: "L3", phone: "0721 678 901" },
  },
  "West Pokot": {
    referralHospital: { name: "Kapenguria County Referral Hospital", level: "L4", phone: "054 52011" },
    dispensary: { name: "Lodwar Sub-District Hospital", level: "L3", phone: "0720 901 234" },
  },
  Samburu: {
    referralHospital: { name: "Maralal County Referral Hospital", level: "L4", phone: "065 62071" },
    dispensary: { name: "Baragoi Sub-District Hospital", level: "L3", phone: "0722 123 890" },
  },
  Nyandarua: {
    referralHospital: { name: "Nyahururu District Hospital", level: "L4", phone: "065 32078" },
    dispensary: { name: "Ol Kalou District Hospital", level: "L4", phone: "0720 567 123" },
  },
  Kirinyaga: {
    referralHospital: { name: "Kerugoya County Referral Hospital", level: "L4", phone: "060 22030" },
    dispensary: { name: "Sagana Sub-District Hospital", level: "L3", phone: "0726 456 789" },
  },
  "Murang'a": {
    referralHospital: { name: "Murang'a Level 5 Hospital", level: "L5", phone: "060 30075" },
    dispensary: { name: "Kangema District Hospital", level: "L4", phone: "0720 789 012" },
  },
  "Taita-Taveta": {
    referralHospital: { name: "Moi District Hospital Voi", level: "L4", phone: "043 30087" },
    dispensary: { name: "Wundanyi District Hospital", level: "L4", phone: "0726 012 678" },
  },
  "Tharaka-Nithi": {
    referralHospital: { name: "Chuka District Hospital", level: "L4", phone: "0724 567 890" },
    dispensary: { name: "Marimanti Sub-District Hospital", level: "L3", phone: "0720 345 678" },
  },
  "Elgeyo-Marakwet": {
    referralHospital: { name: "Iten County Referral Hospital", level: "L4", phone: "053 72017" },
    dispensary: { name: "Kapcherop Sub-District Hospital", level: "L3", phone: "0721 890 123" },
  },
  Bomet: {
    referralHospital: { name: "Longisa County Referral Hospital", level: "L4", phone: "0726 345 901" },
    dispensary: { name: "Bomet District Hospital", level: "L4", phone: "052 22022" },
  },
};

// ── DEFAULT FALLBACK (unknown county) ────────────────────────
const DEFAULT_REFERRAL = {
  referralHospital: {
    name: "Kenyatta National Hospital",
    level: "L6",
    phone: "0800 724 800",
    note: "National referral — contact your county health office for the nearest facility",
  },
  dispensary: {
    name: "Nearest Government Dispensary",
    level: "L3",
    phone: "Call 0800 723 253 for directions",
  },
};

// ── getEmergencyReferral ─────────────────────────────────────
/**
 * Returns the static referral hospital for a county.
 * Used as offline fallback in the triage controller.
 */
function getEmergencyReferral(county) {
  return COUNTY_REFERRAL[county] || DEFAULT_REFERRAL;
}

// ── getNearbyFacilities ──────────────────────────────────────
/**
 * Attempts to query the MongoDB Facility collection.
 * Falls back to static county data if DB is unavailable or no results found.
 *
 * @param {Object} params
 * @param {number|null} params.lat
 * @param {number|null} params.lng
 * @param {string}      params.county
 * @param {string}      params.facilityType
 * @param {number}      params.radiusKm
 * @returns {Promise<Object>} facilityData
 */
async function getNearbyFacilities({ lat, lng, county, facilityType, radiusKm = 25 }) {
  try {
    // Attempt live DB query only if mongoose is connected
    const mongoose = require("mongoose");
    if (mongoose.connection.readyState !== 1) {
      throw new Error("MongoDB not connected");
    }

    const Facility = require("../models/Facility");
    let query = {};

    if (lat && lng) {
      // Geospatial query — find nearest facilities
      query = {
        location: {
          $near: {
            $geometry: { type: "Point", coordinates: [lng, lat] },
            $maxDistance: radiusKm * 1000,
          },
        },
      };
      if (facilityType && facilityType !== "all") {
        query.type = facilityType;
      }
    } else if (county) {
      // Fallback: county-based text query
      query.county = { $regex: new RegExp(`^${county}$`, "i") };
      if (facilityType && facilityType !== "all") {
        query.type = facilityType;
      }
    } else {
      throw new Error("No location or county provided");
    }

    const facilities = await Facility.find(query)
      .select("name county level type phone services location")
      .limit(5)
      .lean();

    if (facilities.length === 0) {
      logger.info(`[FACILITIES] No DB results for county=${county}, using static fallback`);
      return getEmergencyReferral(county);
    }

    // Shape the response
    const referral = facilities.find((f) => f.level === "L5" || f.level === "L6") || facilities[0];
    const nearest = facilities.find((f) => f !== referral) || null;

    return {
      referralHospital: referral
        ? { name: referral.name, level: referral.level, phone: referral.phone }
        : null,
      dispensary: nearest
        ? { name: nearest.name, level: nearest.level, phone: nearest.phone }
        : null,
      all: facilities,
      source: "live_db",
    };
  } catch (err) {
    logger.warn(`[FACILITIES] Live query failed (${err.message}), using static fallback for county=${county}`);
    const staticData = COUNTY_REFERRAL[county] || DEFAULT_REFERRAL;
    return { ...staticData, source: "static_fallback" };
  }
}

module.exports = {
  getNearbyFacilities,
  getEmergencyReferral,
  KENYA_EMERGENCY_CONTACTS,
};
