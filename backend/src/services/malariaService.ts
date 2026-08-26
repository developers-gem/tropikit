import { AppError } from "../utils/AppError";

export type DrugKey = "atovaquone-proguanil" | "doxycycline" | "mefloquine" | "chloroquine";

export interface DrugRegimen {
  key: DrugKey;
  label: string;
  /** Days before departure to start taking the drug. */
  startBefore: number;
  /** Days after returning home to keep taking the drug. */
  continueAfter: number;
  frequency: string;
  notes: string;
  isWeekly: boolean;
}

/**
 * Source-backed regimen shapes, ported from the original prototype and cross-checked
 * against the general structure of CDC Yellow Book / TravelHealthPro guidance:
 *  - Atovaquone-proguanil (Malarone): short pre/post course, daily.
 *  - Doxycycline: daily, 4-week post-trip course, photosensitivity caution.
 *  - Mefloquine: weekly, long pre-trip lead time to surface side effects before travel.
 *  - Chloroquine: weekly, only where local parasites remain chloroquine-sensitive.
 *
 * IMPORTANT: These are general shapes for a planning tool, not a prescription. Every
 * destination and malaria-tab response using this service must carry the disclaimer
 * that medication choice and regimen must be confirmed with a qualified travel-health
 * clinician (see DISCLAIMER export below), per project medical-safety policy.
 */
export const DRUG_REGIMENS: Record<DrugKey, DrugRegimen> = {
  "atovaquone-proguanil": {
    key: "atovaquone-proguanil",
    label: "Atovaquone / proguanil (Malarone)",
    startBefore: 2,
    continueAfter: 7,
    frequency: "Daily, with food",
    notes: "Shortest post-trip course. Suitable for most short trips.",
    isWeekly: false,
  },
  doxycycline: {
    key: "doxycycline",
    label: "Doxycycline",
    startBefore: 2,
    continueAfter: 28,
    frequency: "Daily, with water — avoid lying down for 30 min",
    notes: "Photosensitivity — use SPF 30+ and cover up.",
    isWeekly: false,
  },
  mefloquine: {
    key: "mefloquine",
    label: "Mefloquine (Lariam)",
    startBefore: 21,
    continueAfter: 28,
    frequency: "Weekly, same day each week",
    notes: "Start 2-3 weeks early to detect side effects before travel.",
    isWeekly: true,
  },
  chloroquine: {
    key: "chloroquine",
    label: "Chloroquine",
    startBefore: 7,
    continueAfter: 28,
    frequency: "Weekly, same day each week",
    notes: "Only where local parasites remain sensitive — confirm with a clinician.",
    isWeekly: true,
  },
};

export const MALARIA_DISCLAIMER =
  "This planner provides general guidance only. Medication choice and regimen must be " +
  "confirmed with a qualified travel-health clinician before departure. Any fever within " +
  "3 months of return needs urgent testing — mention your travel history to the clinician.";

export interface MalariaPlanInput {
  drug: DrugKey;
  tripStart: Date;
  tripEnd: Date;
}

export interface MalariaPlan {
  drug: DrugRegimen;
  beginMeds: Date;
  tripStart: Date;
  tripEnd: Date;
  stopMeds: Date;
  totalDoseDays: number;
  disclaimer: string;
  /** True when beginMeds falls before today — the trip is too close for this drug's
   *  recommended lead time. Surfaced explicitly rather than silently shown as a past date. */
  startDateInPast: boolean;
}

function addDays(d: Date, days: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + days);
  return r;
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

export function calculateMalariaPlan(input: MalariaPlanInput): MalariaPlan {
  const { drug, tripStart, tripEnd } = input;

  if (!(drug in DRUG_REGIMENS)) {
    throw AppError.validation(`Unsupported antimalarial: ${drug}`);
  }
  if (Number.isNaN(tripStart.getTime()) || Number.isNaN(tripEnd.getTime())) {
    throw AppError.validation("tripStart and tripEnd must be valid dates");
  }
  if (tripEnd < tripStart) {
    throw AppError.validation("tripEnd must be on or after tripStart");
  }

  const regimen = DRUG_REGIMENS[drug];
  const beginMeds = addDays(tripStart, -regimen.startBefore);
  const stopMeds = addDays(tripEnd, regimen.continueAfter);
  const totalDoseDays = daysBetween(beginMeds, stopMeds) + 1;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return {
    drug: regimen,
    beginMeds,
    tripStart,
    tripEnd,
    stopMeds,
    totalDoseDays,
    disclaimer: MALARIA_DISCLAIMER,
    startDateInPast: beginMeds < today,
  };
}

export function listDrugRegimens(): DrugRegimen[] {
  return Object.values(DRUG_REGIMENS);
}
