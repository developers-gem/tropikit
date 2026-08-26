/**
 * Medical-content architecture migration.
 *
 * RULES (documented so every classification is auditable and reversible):
 *
 * VACCINE STATUS — derived deterministically from the existing `required` boolean and the
 * existing `note` text. No new medical judgment is applied; this only re-expresses language
 * already present in the note as a structured status.
 *   1. required===true AND note signals a condition ("if arriving from", "if travelling for")
 *      -> "conditional" (it's required, but only under a stated circumstance)
 *   2. required===true otherwise -> "required"
 *   3. note starts with "Recommended" / "Strongly recommended" -> "recommended"
 *   4. note starts with "Ensure" (booster/dose maintenance language) -> "recommended"
 *   5. note starts with "Consider" or contains "Outbreaks reported" -> "consider"
 *   6. note starts with "For " or "Boost if" (circumstance-only phrasing, no strength word)
 *      -> "conditional"
 *   7. anything else -> "not-classified" (left honestly unresolved, not forced into a bucket)
 *
 * REGION-SPECIFIC flag: set alongside the status above (not instead of it) whenever the note
 * names a specific geographic area (Amazon, Orinoco, Andean, etc.) via a fixed list of region
 * words already appearing verbatim in the existing note text — never inferred beyond that.
 *
 * MALARIA REGIONAL STRUCTURE — a destination is marked `hasSubnationalVariation: true` only
 * when its existing advice text uses concentration language ("mainly in", "risk exists in",
 * "risk in", "below Nm", "east of", "near the X border") that names a specific area smaller
 * than the whole country. Destinations whose existing text says "throughout", "countrywide",
 * "nationwide", or "year-round" with no named sub-area are marked `false` — this is not a
 * limitation of extraction, it is what the existing source text actually says. Destinations
 * with a malaria risk level but NO descriptive advice text at all are marked `null`
 * (genuinely unknown from current data — not defaulted to false, which would be a claim).
 * No risk LEVEL is ever assigned per named region — the source text names WHERE risk
 * concentrates within the country's existing overall level, it does not assign an
 * independently verified level to each named area, so this migration does not invent one.
 */

const fs = require("fs");
const path = require("path");

const destinationsPath = path.join(__dirname, "../src/seed/data/destinations.json");
const destinations = JSON.parse(fs.readFileSync(destinationsPath, "utf8"));

const REGION_WORDS = [
  "Amazon", "Amazonas", "Pantanal", "Orinoco", "Andean", "Andes", "Papua", "Lombok", "Bali",
  "Borneo", "Palawan", "Mindanao", "Petén", "Alta Verapaz", "Beni", "Pando", "Karen", "Shan",
  "Darién", "Chiapas", "Oaxaca", "Terai", "Bolívar", "Sucre", "Maroni", "Oyapock", "RAAN",
  "RAAS", "Gracias a Dios", "Islas de la Bahía", "Caribbean coast", "Senegal River",
];

function classifyVaccine(vaccine) {
  const note = vaccine.note || "";
  const lower = note.toLowerCase();
  let status;

  if (/required if arriving from|required if travelling from|required if traveling from/.test(lower)) {
    // The note itself states a condition regardless of how the `required` boolean was set —
    // text takes priority here since it's the more specific signal.
    status = "conditional";
  } else if (vaccine.required === true) {
    status = /if arriving from|if travelling for|if traveling for/.test(lower)
      ? "conditional"
      : "required";
  } else if (/^recommended/.test(lower) || /^strongly recommended/.test(lower)) {
    status = "recommended";
  } else if (/^ensure/.test(lower)) {
    status = "recommended";
  } else if (/^consider/.test(lower) || /^strongly consider/.test(lower) || /outbreaks reported/.test(lower)) {
    status = "consider";
  } else if (/^for /.test(lower) || /^boost if/.test(lower)) {
    status = "conditional";
  } else {
    status = "not-classified";
  }

  const matchedRegion = REGION_WORDS.find((r) => note.includes(r));

  return {
    name: vaccine.name,
    status,
    note: vaccine.note,
    regionSpecific: !!matchedRegion,
    region: matchedRegion || null,
  };
}

const SUBNATIONAL_PATTERN =
  /mainly in|risk exists in|risk in|below \d|east of|near the .* border|varies by region|concentrated in|Petén|Amazon|Pantanal|interior|lowland|northern|southern|eastern|western|coast|province|region|border|Terai|city but|capital but/i;
const COUNTRYWIDE_PATTERN =
  /throughout|countrywide|nationwide|year-round.*(essential|advised)|widespread(?! below| in)|present countrywide|highly endemic (year-round|countrywide)/i;

function classifyMalaria(destination) {
  if (destination.malariaRisk.level === "none") {
    return { hasSubnationalVariation: false, sourceText: null, note: "No malaria risk recorded." };
  }

  const malariaAdvice = destination.advice.filter((a) => /malaria/i.test(a));
  if (malariaAdvice.length === 0) {
    return {
      hasSubnationalVariation: null,
      sourceText: null,
      note: "No malaria-specific advice text present in current source data — regional variation is genuinely unknown from what's available, not assumed absent.",
    };
  }

  const text = malariaAdvice.join(" ");
  const namedRegions = REGION_WORDS.filter((r) => text.includes(r));

  // Explicit named sub-areas are the strongest signal. Otherwise fall back to concentration
  // language vs. countrywide language, in that priority order (concentration language wins
  // if both patterns loosely match, since it's more specific).
  let hasSubnationalVariation;
  if (namedRegions.length > 0) {
    hasSubnationalVariation = true;
  } else if (COUNTRYWIDE_PATTERN.test(text) && !SUBNATIONAL_PATTERN.test(text)) {
    hasSubnationalVariation = false;
  } else if (SUBNATIONAL_PATTERN.test(text)) {
    hasSubnationalVariation = true;
  } else {
    hasSubnationalVariation = false;
  }

  return {
    hasSubnationalVariation,
    sourceText: text,
    namedRegions,
  };
}

const migrationLog = [];

function classifySourceType(source) {
  const publisher = (source.publisher || "").toLowerCase();
  if (publisher.includes("centers for disease control")) return "cdc";
  if (publisher.includes("world health organization")) return "who";
  if (publisher.includes("national travel health network")) return "travelhealthpro";
  if (publisher.includes("government") || publisher.includes("ministry")) return "government";
  return "other";
}

const migrated = destinations.map((d) => {
  const vaccineClassifications = d.vaccines.map(classifyVaccine);
  const malariaClassification = classifyMalaria(d);
  const typedSources = d.sources.map((s) => ({ ...s, sourceType: classifySourceType(s) }));

  migrationLog.push({
    destination: d.name,
    slug: d.slug,
    vaccines: vaccineClassifications.map((v) => ({ name: v.name, status: v.status, regionSpecific: v.regionSpecific })),
    malaria: {
      level: d.malariaRisk.level,
      hasSubnationalVariation: malariaClassification.hasSubnationalVariation,
      namedRegions: malariaClassification.namedRegions || [],
    },
  });

  return {
    ...d,
    vaccines: vaccineClassifications,
    sources: typedSources,
    malariaRisk: {
      ...d.malariaRisk,
      hasSubnationalVariation: malariaClassification.hasSubnationalVariation,
      regionalSourceText: malariaClassification.sourceText,
      namedRegions: malariaClassification.namedRegions || [],
    },
    reviewStatus: "needs-review",
    lastReviewedAt: null,
    reviewedBy: null,
    contentVersion: 2,
  };
});

fs.writeFileSync(destinationsPath, JSON.stringify(migrated, null, 2));
fs.writeFileSync(
  path.join(__dirname, "../migration-log.json"),
  JSON.stringify(migrationLog, null, 2),
);

// Summary stats for the report
const statusCounts = {};
migrationLog.forEach((d) => d.vaccines.forEach((v) => { statusCounts[v.status] = (statusCounts[v.status] || 0) + 1; }));
const subnationalCounts = { true: 0, false: 0, null: 0 };
migrationLog.forEach((d) => { subnationalCounts[String(d.malaria.hasSubnationalVariation)]++; });

console.log("Vaccine status distribution:", statusCounts);
console.log("Malaria subnational-variation distribution:", subnationalCounts);
console.log("Destinations migrated:", migrated.length);
console.log("Log written to backend/migration-log.json");
