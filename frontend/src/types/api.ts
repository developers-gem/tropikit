export type VaccineRecommendationStatus =
  | "required"
  | "recommended"
  | "conditional"
  | "consider"
  | "not-routinely-recommended"
  | "not-classified";

export interface Vaccine {
  name: string;
  status: VaccineRecommendationStatus;
  note: string;
  regionSpecific: boolean;
  region: string | null;
}

export type EmergencyCategory =
  | "police"
  | "ambulance"
  | "fire"
  | "embassy"
  | "insurance"
  | "assistance-provider"
  | "health-authority"
  | "travel-health-source"
  | "other";

export interface EmergencyContact {
  label: string;
  number: string;
  note?: string;
  category: EmergencyCategory;
  source: string | null;
  lastVerifiedAt: string | null;
}

export type SourceType = "cdc" | "who" | "travelhealthpro" | "government" | "other";

export interface Source {
  publisher: string;
  title: string;
  url: string;
  contentType?: string;
  sourceType?: SourceType;
  needsReview?: boolean;
  lastReviewedAt?: string | null;
}

export interface MalariaRisk {
  level: "high" | "moderate" | "low" | "none";
  description: string;
  hasSubnationalVariation: boolean | null;
  regionalSourceText: string | null;
  namedRegions: string[];
}

export interface MalariaAbcd {
  awareness: string;
  bitePrevention: string;
  chemoprophylaxis: string;
  diagnosis: string;
}

export interface Destination {
  _id: string;
  name: string;
  slug: string;
  region: string;
  malariaRisk: MalariaRisk;
  advice: string[];
  vaccines: Vaccine[];
  malaria: { abcd: MalariaAbcd } | null;
  emergencyContacts: EmergencyContact[];
  sources: Source[];
  isActive: boolean;
}

export type DrugKey = "atovaquone-proguanil" | "doxycycline" | "mefloquine" | "chloroquine";

export interface DrugRegimen {
  key: DrugKey;
  label: string;
  startBefore: number;
  continueAfter: number;
  frequency: string;
  notes: string;
  isWeekly: boolean;
}

export interface MalariaPlan {
  drug: DrugRegimen;
  beginMeds: string;
  tripStart: string;
  tripEnd: string;
  stopMeds: string;
  totalDoseDays: number;
  disclaimer: string;
  startDateInPast: boolean;
}

export interface ChecklistGroup {
  category: string;
  items: string[];
}

export interface Trip {
  _id: string;
  userId: string;
  destinationId: string;
  departureDate: string;
  returnDate: string;
  tripType?: string;
  accommodationType?: string;
  activities?: string[];
  selectedAntimalarial?: string;
  vaccineStatus: VaccineStatus;
  malariaPlanStatus: MalariaPlanStatus;
  malariaPlanConfirmedAt: string | null;
  emergencyAcknowledged: boolean;
}

export type VaccineStatus = "not-reviewed" | "in-progress" | "reviewed";
export type MalariaPlanStatus = "not-planned" | "planned" | "confirmed";

export const TRIP_TYPES = [
  "Leisure",
  "Business",
  "Backpacking",
  "Adventure",
  "Safari",
  "Beach",
  "Family",
  "Other",
] as const;

export const ACCOMMODATION_TYPES = [
  "Hotel",
  "Resort",
  "Hostel",
  "Camping",
  "Rural",
  "Jungle lodge",
  "Other",
] as const;

export const ACTIVITY_TYPES = [
  "Hiking",
  "Safari",
  "Jungle travel",
  "Diving",
  "Swimming",
  "Rural travel",
  "Animal exposure",
  "Other",
] as const;

export interface ReadinessResult {
  completed: number;
  total: number;
  percentage: number;
}

export interface TimelineMilestone {
  label: string;
  weeksBefore: number;
  date: string;
  status: "passed" | "today" | "upcoming";
}

export interface PersistedMalariaPlan extends MalariaPlan {
  id: string;
  tripId: string;
  destinationId: string;
  timezone: string;
  sources: Source[];
  createdAt: string;
  updatedAt: string;
}

export interface ReminderItem {
  type:
    | "timeline"
    | "medication"
    | "final-dose"
    | "checklist"
    | "consultation"
    | "travel-preparation"
    | "bite-prevention";
  label: string;
  date: string | null;
}

export interface DashboardStoryGroup {
  key: string;
  label: string;
  stories: Story[];
}

export interface DuringTripReminder {
  key: string;
  label: string;
  detail: string;
}

export interface DuringTripSection {
  reminders: DuringTripReminder[];
  whenToSeekHelp: string;
}

export interface AfterTripSourceRef {
  publisher: string;
  title: string;
  url: string;
  lastReviewedAt: string | null;
}

export interface AfterTripTopic {
  key: string;
  title: string;
  content: string;
  sources: AfterTripSourceRef[];
}

export interface AfterTripSection {
  topics: AfterTripTopic[];
}

export interface TripDashboard {
  trip: Trip & { daysUntilDeparture: number; durationDays: number };
  destination: {
    id: string;
    name: string;
    slug: string;
    region: string;
    malariaRisk: MalariaRisk;
    vaccines: Vaccine[];
    emergencyContacts: EmergencyContact[];
    sources: Source[];
  };
  readiness: ReadinessResult;
  checklist: {
    checkedItemKeys: string[];
    total: number;
    completed: number;
    template: ChecklistGroup[];
  };
  malariaPlan: PersistedMalariaPlan | null;
  malariaApplicable: boolean;
  drugRegimens: DrugRegimen[];
  timeline: TimelineMilestone[];
  reminders: ReminderItem[];
  stories: DashboardStoryGroup[];
  duringTrip: DuringTripSection;
  afterTrip: AfterTripSection;
}

export interface UserPreferences {
  defaultTimezone?: string | null;
  emailNotifications?: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role?: string;
  preferences?: UserPreferences;
}

export interface AudioAsset {
  url: string | null;
  provider: "none" | "external" | "object-storage" | "cdn";
  mimeType: string | null;
  durationSeconds: number | null;
  fileSizeBytes: number | null;
}

export type StoryStatus = "draft" | "in-review" | "reviewed" | "published";

export interface Story {
  _id: string;
  destinationId: { _id: string; name: string; slug: string } | string;
  category: string;
  title: string;
  description: string;
  transcript: string;
  audio: AudioAsset;
  sources: Source[];
  status: StoryStatus;
  isPublished: boolean;
  reviewedAt: string | null;
}
