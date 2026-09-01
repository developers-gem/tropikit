import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronRight,
  ClipboardCheck,
  Compass,
  HeartPulse,
  MapPin,
  Menu,
  Play,
  ShieldCheck,
  Siren,
  Sparkles,
  Stethoscope,
  Volume2,
  Wifi,
} from "lucide-react";

import heroImage from "@/assets/tropical-hero.jpg";

type Feature = {
  icon: typeof HeartPulse;
  title: string;
  description: string;
  to: string;
};

const features: Feature[] = [
  {
    icon: MapPin,
    title: "Destination health",
    description:
      "Understand important health considerations for the places you're planning to visit.",
    to: "/destinations",
  },
  {
    icon: Stethoscope,
    title: "Vaccine information",
    description:
      "Review destination-specific vaccine information and prepare for your consultation.",
    to: "/destinations",
  },
  {
    icon: ShieldCheck,
    title: "Malaria planning",
    description:
      "Organize malaria prevention information around your travel dates and itinerary.",
    to: "/destinations",
  },
  {
    icon: ClipboardCheck,
    title: "Travel checklist",
    description:
      "Keep your preparation organized with a clear checklist and progress tracking.",
    to: "/checklist",
  },
  {
    icon: Volume2,
    title: "Stories & audio",
    description:
      "Learn important travel-health topics through simple, friendly stories and audio.",
    to: "/stories",
  },
  {
    icon: CalendarDays,
    title: "Reminders",
    description:
      "Keep important preparation tasks and health reminders connected to your trip.",
    to: "/account/trips",
  },
  {
    icon: Wifi,
    title: "Calendar planning",
    description:
      "Keep important travel-health dates organized with calendar-friendly planning.",
    to: "/account/trips",
  },
  {
    icon: Siren,
    title: "Emergency information",
    description:
      "Find reliable emergency and travel-health resources when you need them.",
    to: "/emergency",
  },
];

const journey = [
  {
    number: "01",
    title: "Choose a destination",
    description: "Explore health information for your destination before you travel.",
    icon: Compass,
  },
  {
    number: "02",
    title: "Understand the health considerations",
    description: "Review vaccines, malaria information and practical precautions.",
    icon: HeartPulse,
  },
  {
    number: "03",
    title: "Create your trip",
    description: "Bring your destination, dates and preparation into one place.",
    icon: MapPin,
  },
  {
    number: "04",
    title: "Prepare with confidence",
    description: "Use your checklist, reminders and travel-health resources.",
    icon: ClipboardCheck,
  },
];

const destinationFallback = [
  {
    name: "Tropical destinations",
    country: "Explore health information",
    image:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=85",
  },
  {
    name: "Island escapes",
    country: "Prepare before you go",
    image:
      "https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=900&q=85",
  },
  {
    name: "Adventure travel",
    country: "Plan for your activities",
    image:
      "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=900&q=85",
  },
];

export default function HomePage() {
  const navigate = useNavigate();
  const [destination, setDestination] = useState("");
  const [travelDate, setTravelDate] = useState("");

  const scrollToFeatures = () => {
    document
      .getElementById("travel-health-tools")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  const handleDestinationSearch = () => {
    if (destination.trim()) {
      navigate(`/destinations?search=${encodeURIComponent(destination.trim())}`);
      return;
    }

    navigate("/destinations");
  };

  const displayedDestinations = useMemo(
    () => destinationFallback,
    [],
  );

  return (
    <div className="overflow-hidden bg-[#f6faf9] text-[#102a33]">
      {/* =========================================================
          HERO
      ========================================================== */}
      <section className="relative min-h-[760px] overflow-hidden bg-[#062c34]">
        <img
          src={heroImage}
          alt="Tropical coastline"
          className="absolute inset-0 h-full w-full object-cover"
        />

        <div className="absolute inset-0 bg-[#04242b]/55" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#03252d]/95 via-[#06343c]/75 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#062c34] via-transparent to-[#062c34]/20" />

        <div className="relative mx-auto flex min-h-[760px] max-w-7xl items-center px-5 pb-24 pt-24 sm:px-8 lg:px-10">
          <div className="max-w-3xl text-white">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur-md">
              <Sparkles className="h-4 w-4 text-[#66e0cf]" />
              Travel health, made simple
            </div>

            <h1 className="max-w-3xl text-5xl font-semibold leading-[1.03] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
              Travel prepared.
              <br />
              <span className="text-[#66e0cf]">Stay healthy.</span>
            </h1>

            <p className="mt-7 max-w-2xl text-base leading-7 text-white/80 sm:text-lg sm:leading-8">
              Tropikit brings destination health information, vaccine guidance,
              malaria planning, checklists, stories, reminders and emergency
              resources together in one simple travel-health companion.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigate("/destinations")}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#55d7c4] px-6 text-sm font-semibold text-[#062c34] shadow-lg shadow-[#55d7c4]/20 transition hover:-translate-y-0.5 hover:bg-[#70e0d0]"
              >
                Explore destinations
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => navigate("/register")}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
              >
                Create your trip
              </button>
            </div>

            <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3 text-sm text-white/75">
              {[
                "Source-based information",
                "Trip-focused planning",
                "Built for travelers",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#55d7c4]/20">
                    <Check className="h-3.5 w-3.5 text-[#70e0d0]" />
                  </span>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Search card */}
        <div className="absolute bottom-5 left-0 right-0 px-5 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-7xl">
            <div className="rounded-2xl border border-white/20 bg-white p-3 shadow-2xl shadow-black/20 sm:p-4">
              <div className="grid gap-3 md:grid-cols-[1fr_220px_auto]">
                <label className="flex min-h-14 items-center gap-3 rounded-xl bg-[#f3f8f7] px-4">
                  <MapPin className="h-5 w-5 shrink-0 text-[#168e81]" />
                  <span className="sr-only">Destination</span>
                  <input
                    value={destination}
                    onChange={(event) => setDestination(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        handleDestinationSearch();
                      }
                    }}
                    placeholder="Where are you travelling?"
                    className="w-full bg-transparent text-sm text-[#102a33] outline-none placeholder:text-[#789097]"
                  />
                </label>

                <label className="flex min-h-14 items-center gap-3 rounded-xl bg-[#f3f8f7] px-4">
                  <CalendarDays className="h-5 w-5 shrink-0 text-[#168e81]" />
                  <span className="sr-only">Travel date</span>
                  <input
                    type="date"
                    value={travelDate}
                    onChange={(event) => setTravelDate(event.target.value)}
                    className="w-full bg-transparent text-sm text-[#102a33] outline-none"
                  />
                </label>

                <button
                  type="button"
                  onClick={handleDestinationSearch}
                  className="min-h-14 rounded-xl bg-[#062c34] px-7 text-sm font-semibold text-white transition hover:bg-[#0a414b]"
                >
                  Explore destination
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          INTRO
      ========================================================== */}
      <section className="bg-white px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#168e81]">
              One place for your journey
            </p>

            <h2 className="mt-4 max-w-xl text-4xl font-semibold tracking-[-0.035em] text-[#082e37] sm:text-5xl">
              Health preparation should feel simple.
            </h2>

            <p className="mt-6 max-w-xl text-base leading-8 text-[#61777d]">
              Traveling somewhere new can mean keeping track of vaccines,
              malaria prevention, preparation tasks, reminders and emergency
              information. Tropikit keeps the important pieces connected to
              your trip.
            </p>

            <button
              type="button"
              onClick={() => navigate("/register")}
              className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[#087f73] hover:text-[#055f56]"
            >
              Start planning your trip
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                icon: MapPin,
                title: "Destination-first",
                text: "Start with where you're going and discover relevant health information.",
              },
              {
                icon: ClipboardCheck,
                title: "Everything organized",
                text: "Keep preparation tasks, health planning and reminders connected.",
              },
              {
                icon: ShieldCheck,
                title: "Source-based",
                text: "Health information should be reliable, reviewed and properly attributed.",
              },
              {
                icon: HeartPulse,
                title: "Traveler-focused",
                text: "Useful before, during and after your journey — without overwhelming you.",
              },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className="rounded-2xl border border-[#dcebe8] bg-[#f7fbfa] p-6"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#dff7f2] text-[#087f73]">
                    <Icon className="h-5 w-5" />
                  </div>

                  <h3 className="mt-5 font-semibold text-[#12343c]">
                    {item.title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-[#71858a]">
                    {item.text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================
          JOURNEY
      ========================================================== */}
      <section className="bg-[#f2f8f7] px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#168e81]">
              How Tropikit works
            </p>

            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.035em] text-[#082e37] sm:text-5xl">
              From destination to departure, all in one journey.
            </h2>

            <p className="mt-5 text-base leading-7 text-[#687e84]">
              A simple flow designed around what travelers actually need to
              know and do.
            </p>
          </div>

          <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {journey.map((step, index) => {
              const Icon = step.icon;

              return (
                <div key={step.number} className="relative">
                  <div className="h-full rounded-2xl border border-[#dce9e7] bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold tracking-[0.15em] text-[#8ba0a5]">
                        {step.number}
                      </span>

                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e0f7f3] text-[#087f73]">
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>

                    <h3 className="mt-7 text-lg font-semibold text-[#12343c]">
                      {step.title}
                    </h3>

                    <p className="mt-3 text-sm leading-6 text-[#71858a]">
                      {step.description}
                    </p>
                  </div>

                  {index < journey.length - 1 && (
                    <ChevronRight className="absolute -right-4 top-1/2 z-10 hidden h-7 w-7 -translate-y-1/2 rounded-full bg-[#f2f8f7] p-1 text-[#8ba0a5] lg:block" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================
          FEATURES
      ========================================================== */}
      <section
        id="travel-health-tools"
        className="bg-white px-5 py-20 sm:px-8 lg:px-10 lg:py-28"
      >
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#168e81]">
                Travel health tools
              </p>

              <h2 className="mt-4 text-4xl font-semibold tracking-[-0.035em] text-[#082e37] sm:text-5xl">
                Everything you need to prepare with confidence.
              </h2>
            </div>

            <p className="max-w-md text-sm leading-6 text-[#71858a]">
              Explore the tools that help you understand your destination,
              prepare for your trip and stay informed along the way.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <Link
                  key={feature.title}
                  to={feature.to}
                  className="group rounded-2xl border border-[#dcebe8] bg-[#f8fbfa] p-6 transition duration-300 hover:-translate-y-1 hover:border-[#b9dfd8] hover:bg-white hover:shadow-xl hover:shadow-[#0b5b54]/5"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#dff7f2] text-[#087f73] transition group-hover:bg-[#087f73] group-hover:text-white">
                    <Icon className="h-5 w-5" />
                  </div>

                  <h3 className="mt-6 text-lg font-semibold text-[#12343c]">
                    {feature.title}
                  </h3>

                  <p className="mt-3 min-h-[72px] text-sm leading-6 text-[#71858a]">
                    {feature.description}
                  </p>

                  <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[#087f73]">
                    Learn more
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================
          DESTINATIONS
      ========================================================== */}
      <section className="bg-[#062c34] px-5 py-20 text-white sm:px-8 lg:px-10 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#66e0cf]">
                Explore destinations
              </p>

              <h2 className="mt-4 text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">
                Start with where you're going.
              </h2>

              <p className="mt-5 max-w-2xl text-base leading-7 text-white/65">
                Discover destination health information and start building a
                preparation plan around your journey.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/destinations")}
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#66e0cf] hover:text-white"
            >
              View all destinations
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {displayedDestinations.map((destinationItem) => (
              <Link
                key={destinationItem.name}
                to="/destinations"
                className="group overflow-hidden rounded-2xl border border-white/10 bg-white/5"
              >
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={destinationItem.image}
                    alt={destinationItem.name}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-[#031d24] via-transparent to-transparent" />

                  <div className="absolute bottom-5 left-5 right-5">
                    <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#66e0cf]">
                      {destinationItem.country}
                    </p>

                    <h3 className="mt-1 text-xl font-semibold">
                      {destinationItem.name}
                    </h3>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================
          BEFORE / DURING / AFTER
      ========================================================== */}
      <section className="bg-white px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-6 lg:grid-cols-3">
            {[
              {
                phase: "Before your trip",
                title: "Prepare without the overwhelm.",
                text: "Review destination information, organize your checklist, understand vaccine and malaria considerations, and set reminders.",
                icon: ClipboardCheck,
              },
              {
                phase: "During your trip",
                title: "Keep useful guidance close.",
                text: "Access practical, source-backed guidance around mosquitoes, food and water, medication adherence and when to seek professional help.",
                icon: HeartPulse,
              },
              {
                phase: "After your trip",
                title: "Stay informed when you return.",
                text: "Keep general post-travel information available and know when to tell a healthcare professional about recent travel.",
                icon: ShieldCheck,
              },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.phase}
                  className="rounded-3xl border border-[#dcebe8] bg-[#f6faf9] p-8"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#dff7f2] text-[#087f73]">
                    <Icon className="h-5 w-5" />
                  </div>

                  <p className="mt-7 text-xs font-bold uppercase tracking-[0.16em] text-[#168e81]">
                    {item.phase}
                  </p>

                  <h3 className="mt-3 text-2xl font-semibold tracking-[-0.02em] text-[#12343c]">
                    {item.title}
                  </h3>

                  <p className="mt-4 text-sm leading-7 text-[#71858a]">
                    {item.text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================
          STORY CTA
      ========================================================== */}
      <section className="bg-[#e8f7f4] px-5 py-20 sm:px-8 lg:px-10 lg:py-24">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#087f73] shadow-sm">
              <Volume2 className="h-4 w-4" />
              Learn through stories
            </div>

            <h2 className="mt-6 max-w-2xl text-4xl font-semibold tracking-[-0.035em] text-[#082e37] sm:text-5xl">
              Health information doesn't have to feel like a textbook.
            </h2>

            <p className="mt-5 max-w-2xl text-base leading-8 text-[#60777d]">
              Explore simple travel-health stories designed to help you learn
              about important topics before and during your journey.
            </p>

            <button
              type="button"
              onClick={() => navigate("/stories")}
              className="mt-8 inline-flex h-12 items-center gap-2 rounded-xl bg-[#062c34] px-6 text-sm font-semibold text-white transition hover:bg-[#0a414b]"
            >
              Explore stories
              <Play className="h-4 w-4 fill-current" />
            </button>
          </div>

          <div className="relative mx-auto w-full max-w-md">
            <div className="rounded-3xl bg-[#062c34] p-5 shadow-2xl shadow-[#062c34]/15">
              <div className="rounded-2xl bg-white/10 p-6 backdrop-blur">
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#55d7c4] text-[#062c34]">
                    <Play className="h-5 w-5 fill-current" />
                  </div>

                  <span className="text-xs font-medium text-white/60">
                    Travel health story
                  </span>
                </div>

                <p className="mt-8 text-xs uppercase tracking-[0.15em] text-[#66e0cf]">
                  Mosquito protection
                </p>

                <h3 className="mt-2 text-2xl font-semibold text-white">
                  A few simple habits can make a big difference.
                </h3>

                <div className="mt-8 h-1 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-[42%] rounded-full bg-[#55d7c4]" />
                </div>

                <div className="mt-3 flex justify-between text-xs text-white/45">
                  <span>01:24</span>
                  <span>03:18</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          TRUST
      ========================================================== */}
      <section className="bg-white px-5 py-20 sm:px-8 lg:px-10 lg:py-24">
        <div className="mx-auto max-w-5xl text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#dff7f2] text-[#087f73]">
            <ShieldCheck className="h-7 w-7" />
          </div>

          <p className="mt-7 text-sm font-semibold uppercase tracking-[0.18em] text-[#168e81]">
            Built around reliable information
          </p>

          <h2 className="mx-auto mt-4 max-w-3xl text-4xl font-semibold tracking-[-0.035em] text-[#082e37] sm:text-5xl">
            Clear guidance, responsible health information.
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-[#71858a]">
            Tropikit is designed as an informational travel-health companion.
            Medical information should be source-based and reviewed, and
            Tropikit does not replace professional medical advice.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-3">
            {[
              "Source attribution",
              "Review status",
              "No diagnosis",
              "Traveler-focused",
            ].map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-2 rounded-full border border-[#dcebe8] bg-[#f7fbfa] px-4 py-2 text-sm font-medium text-[#36545b]"
              >
                <Check className="h-4 w-4 text-[#168e81]" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================
          FINAL CTA
      ========================================================== */}
      <section className="px-5 pb-20 sm:px-8 lg:px-10 lg:pb-28">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-[#062c34] px-6 py-14 text-center text-white sm:px-12 sm:py-20">
          <div className="mx-auto max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#66e0cf]">
              Your journey starts here
            </p>

            <h2 className="mt-5 text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">
              Travel smart. Stay healthy. Enjoy the journey.
            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-white/65">
              Choose your destination, create your trip and bring your
              travel-health preparation together in one place.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => navigate("/register")}
                className="inline-flex h-12 items-center gap-2 rounded-xl bg-[#55d7c4] px-6 text-sm font-semibold text-[#062c34] transition hover:bg-[#70e0d0]"
              >
                Create your trip
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => navigate("/destinations")}
                className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-6 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                Explore destinations
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}