/**
 * Emergency contact categorization migration. Separate from migrate-medical-content.js
 * deliberately — that script assumes the pre-migration vaccine/malaria shape as input, and
 * destinations.json has already been transformed by it. Re-running that script against
 * already-migrated data would misinterpret the new `status` field as absent and corrupt it.
 * This script only touches `emergencyContacts` and the standalone global emergency file.
 *
 * RULES (deterministic, documented):
 *   - label matches police/gendarmerie/civil protection/coast guard -> "police"
 *   - label matches ambulance/SAMU/Red Cross/Flying Doctors/AMREF/rescue/referral hospital
 *     -> "ambulance"
 *   - label matches fire -> "fire"
 *   - anything else (generic/combined dispatch numbers like "Emergency", "Tourist
 *     Assistance") -> "other", not forced into one of the three specific buckets
 *
 * No `source` or `lastVerifiedAt` is set for any contact — no live verification pass against
 * an authoritative source has been performed. Per project policy, this is left honestly null
 * rather than defaulted to a value implying verification that hasn't happened.
 */

const fs = require("fs");
const path = require("path");

const destinationsPath = path.join(__dirname, "../src/seed/data/destinations.json");
const globalEmergencyPath = path.join(__dirname, "../src/seed/data/globalEmergency.json");

const destinations = JSON.parse(fs.readFileSync(destinationsPath, "utf8"));
const globalEmergency = JSON.parse(fs.readFileSync(globalEmergencyPath, "utf8"));

function classifyLocalContact(contact) {
  const label = contact.label || "";
  let category;
  if (/police|gendarmerie|civil protection|coast guard/i.test(label)) {
    category = "police";
  } else if (/ambulance|samu|red cross|flying doctors|amref|rescue|referral hospital|sos .* clinic/i.test(label)) {
    category = "ambulance";
  } else if (/fire/i.test(label)) {
    category = "fire";
  } else {
    category = "other";
  }
  return { ...contact, category, source: null, lastVerifiedAt: null };
}

const categoryLog = {};
const migratedDestinations = destinations.map((d) => {
  const contacts = d.emergencyContacts.map((c) => {
    const classified = classifyLocalContact(c);
    categoryLog[classified.category] = (categoryLog[classified.category] || 0) + 1;
    return classified;
  });
  return { ...d, emergencyContacts: contacts };
});

// Global emergency contacts get a fixed, hand-verified-by-inspection mapping (only 4 entries,
// each individually reasoned about rather than pattern-matched) plus the one source that was
// already implicitly present in the data (WHO's own URL, already visible in the old `number`
// field for "WHO Global Outbreak").
const migratedGlobal = globalEmergency.map((c) => {
  if (c.label === "International SOS") {
    return { ...c, category: "assistance-provider", source: null, lastVerifiedAt: null };
  }
  if (c.label === "Your travel insurer") {
    return { ...c, category: "insurance", source: null, lastVerifiedAt: null };
  }
  if (c.label === "Nearest embassy / consulate") {
    return { ...c, category: "embassy", source: null, lastVerifiedAt: null };
  }
  if (c.label === "WHO Global Outbreak") {
    return {
      ...c,
      category: "health-authority",
      source: "https://www.who.int/emergencies",
      lastVerifiedAt: null,
    };
  }
  return { ...c, category: "other", source: null, lastVerifiedAt: null };
});

fs.writeFileSync(destinationsPath, JSON.stringify(migratedDestinations, null, 2));
fs.writeFileSync(globalEmergencyPath, JSON.stringify(migratedGlobal, null, 2));

console.log("Local emergency contact categories:", categoryLog);
console.log("Global emergency contacts migrated:", migratedGlobal.length);
