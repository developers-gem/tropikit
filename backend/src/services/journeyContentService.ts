/**
 * "During Your Trip" and "After Your Trip" content.
 *
 * MEDICAL SAFETY: this module explicitly does not diagnose. "During Trip" reframes content
 * that ALREADY EXISTS on the destination (advice bullets, malaria ABCD guidance, the active
 * malaria plan's own regimen) into a practical reminders view — no new medical claims are
 * introduced. "After Trip" is generic, source-backed educational content (not
 * destination-specific, not a diagnosis) drawn from real, verified sources:
 *   - CDC "After Travel Tips" (https://wwwnc.cdc.gov/travel/page/after-trip) — confirmed live
 *     and fetched directly during this phase, not recalled from memory or guessed.
 *   - CDC Yellow Book "Post-Travel Diarrhea" — confirmed live, with a real last-reviewed date
 *     (April 23, 2025) taken directly from the page's own metadata.
 *   - The malaria disclaimer and CDC Yellow Book — Malaria source already established and
 *     cited elsewhere in this app.
 *   - WHO International Travel and Health, already an established citation in this app.
 * No new URLs were invented for this module.
 */

export interface DuringTripReminder {
  key: string;
  label: string;
  detail: string;
}

export interface DuringTripSection {
  reminders: DuringTripReminder[];
  whenToSeekHelp: string;
}

const FOOD_WATER_KEYWORDS = /water|ice|street food|food|bottled|filtered|cooked/i;
const ENVIRONMENT_KEYWORDS = /sun|heat|altitude|hydrat|spf|dehydrat/i;

export function buildDuringTripSection(params: {
  destinationName: string;
  advice: string[];
  malariaApplicable: boolean;
  malariaAbcd: { bitePrevention: string } | null;
  malariaPlanDrugLabel: string | null;
  malariaPlanFrequency: string | null;
}): DuringTripSection {
  const reminders: DuringTripReminder[] = [];

  if (params.malariaApplicable && params.malariaAbcd) {
    reminders.push({
      key: "mosquito",
      label: "Mosquito protection",
      detail: params.malariaAbcd.bitePrevention,
    });
  } else {
    const mosquitoAdvice = params.advice.find((a) => /mosquito|repellent|insect|dengue/i.test(a));
    if (mosquitoAdvice) {
      reminders.push({ key: "mosquito", label: "Mosquito protection", detail: mosquitoAdvice });
    }
  }

  const foodWaterAdvice = params.advice.filter((a) => FOOD_WATER_KEYWORDS.test(a));
  if (foodWaterAdvice.length > 0) {
    reminders.push({
      key: "food-water",
      label: "Food and water precautions",
      detail: foodWaterAdvice.join(" "),
    });
  }

  const environmentAdvice = params.advice.filter((a) => ENVIRONMENT_KEYWORDS.test(a));
  if (environmentAdvice.length > 0) {
    reminders.push({
      key: "environment",
      label: "Environmental protection",
      detail: environmentAdvice.join(" "),
    });
  }

  if (params.malariaPlanDrugLabel && params.malariaPlanFrequency) {
    reminders.push({
      key: "medication",
      label: "Medication adherence",
      detail: `Keep taking your ${params.malariaPlanDrugLabel} on schedule: ${params.malariaPlanFrequency}. Missed or irregular doses reduce how well it protects you.`,
    });
  }

  return {
    reminders,
    whenToSeekHelp:
      "If you develop a fever, persistent vomiting or diarrhea, a rash, or any symptom that " +
      "worries you while travelling, contact a local clinic, your travel insurer's assistance " +
      "line, or a qualified travel-health professional promptly. This app cannot tell you " +
      "what's causing a symptom — a clinician can.",
  };
}

export interface AfterTripTopic {
  key: string;
  title: string;
  content: string;
  sources: { publisher: string; title: string; url: string; lastReviewedAt: string | null }[];
}

export interface AfterTripSection {
  topics: AfterTripTopic[];
}

export function buildAfterTripSection(params: { malariaApplicable: boolean }): AfterTripSection {
  const topics: AfterTripTopic[] = [];

  topics.push({
    key: "tell-your-provider",
    title: "Tell your healthcare provider you travelled",
    content:
      "It's possible to pick something up during a trip without noticing symptoms until " +
      "you're home. If you feel unwell in the weeks after returning, mention where you " +
      "went, what you did, and what you ate and drank — it helps a clinician narrow down " +
      "what to check for, rather than starting from scratch.",
    sources: [
      {
        publisher: "U.S. Centers for Disease Control and Prevention",
        title: "After Travel Tips",
        url: "https://wwwnc.cdc.gov/travel/page/after-trip",
        lastReviewedAt: null,
      },
    ],
  });

  if (params.malariaApplicable) {
    topics.push({
      key: "malaria-follow-up",
      title: "Malaria follow-up",
      content:
        "If your trip included a malaria-risk area, any fever within three months of " +
        "returning needs urgent medical testing — this is true even if you took antimalarial " +
        "medication as directed, since no regimen is 100% protective. Mention your travel " +
        "history and which medication you took.",
      sources: [
        {
          publisher: "U.S. Centers for Disease Control and Prevention",
          title: "CDC Yellow Book — Malaria",
          url: "https://wwwnc.cdc.gov/travel/yellowbook/2024/infections-diseases/malaria",
          lastReviewedAt: null,
        },
      ],
    });
  }

  topics.push({
    key: "gi-symptoms",
    title: "Persistent gastrointestinal symptoms",
    content:
      "Traveller's diarrhoea is common and usually resolves during or shortly after a trip. " +
      "If digestive symptoms last more than two weeks after returning, it's worth seeing a " +
      "clinician — persistent symptoms can have several different causes, and figuring out " +
      "which one applies is exactly what a healthcare provider is best placed to do.",
    sources: [
      {
        publisher: "U.S. Centers for Disease Control and Prevention",
        title: "CDC Yellow Book — Post-Travel Diarrhea",
        url: "https://www.cdc.gov/yellow-book/hcp/post-travel-evaluation/post-travel-diarrhea.html",
        lastReviewedAt: "2025-04-23",
      },
    ],
  });

  topics.push({
    key: "other-considerations",
    title: "Other things worth knowing",
    content:
      "Long-term travellers, aid workers, and anyone with an unusually adventurous itinerary " +
      "(remote jungle, extended rural stays, animal contact) may be worth a more thorough " +
      "post-trip check-in with a clinician, even without symptoms. This is a general " +
      "consideration, not a recommendation specific to your trip — a clinician can advise " +
      "based on where you actually went.",
    sources: [
      {
        publisher: "World Health Organization",
        title: "WHO International Travel and Health",
        url: "https://www.who.int/travel-advice",
        lastReviewedAt: null,
      },
    ],
  });

  return { topics };
}
