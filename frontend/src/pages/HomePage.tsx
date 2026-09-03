// frontend/src/pages/HomePage.tsx
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronRight,
  ChevronLeft,
  ClipboardCheck,
  Compass,
  HeartPulse,
  MapPin,
  Play,
  Pause,
  ShieldCheck,
  Siren,
  Sparkles,
  Stethoscope,
  Volume2,
  Wifi,
  Globe,
} from "lucide-react";

import heroFallbackImage from "@/assets/tropical-hero.jpg";

type Feature = {
  icon: typeof HeartPulse;
  title: string;
  description: string;
  to: string;
  tag?: string;
};

// Hero Carousel Slides
const HERO_SLIDES = [
  {
    image: heroFallbackImage,
    title: "Travel prepared. Stay healthy.",
    subtitle: "Tropical Coastlines & Southeast Asia",
    desc: "Verify endemic vaccine mandates, local malaria transmission risks, and water safety before departure.",
  },
  {
    image:
      "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=2000&q=85",
    title: "Smart Malaria & Vector Planning.",
    subtitle: "Sub-Saharan Africa & Highlands",
    desc: "Calculate clinical pre-travel chemoprophylaxis doses and generate calendar sync reminders seamlessly.",
  },
  {
    image:
      "https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=2000&q=85",
    title: "Central American Rainforests & Vector Watch.",
    subtitle: "Costa Rica & Panama Corridors",
    desc: "Comprehensive Dengue, Zika, and waterborne parasite advisories for rainforest expeditions.",
  },
  {
    image:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2000&q=85",
    title: "Complete Travel Health Dossiers.",
    subtitle: "Amazon Basin & South America",
    desc: "Personalized pre-travel checklists, medical evacuation contacts, and doctor-reviewed field audio guides.",
  },
  {
    image:
      "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=2000&q=85",
    title: "Altitude & Expedition Preparedness.",
    subtitle: "Andean Highlands & High Elevation",
    desc: "Acute mountain sickness prevention protocols, acetazolamide planning, and emergency rescue networks.",
  },
  {
    image:
      "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=2000&q=85",
    title: "Island Protocols & Marine Envenomation.",
    subtitle: "Indonesian Archipelago & Coral Atolls",
    desc: "Rabies bite prevention, sea-life sting treatments, and accredited regional travelers' medical clinics.",
  },
];

// Showcase Destinations
const ALL_DESTINATIONS = [
  {
    name: "Cambodia",
    region: "Southeast Asia",
    risk: "High Malaria & Dengue Zone",
    image:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=85",
    slug: "cambodia",
  },
  {
    name: "Kenya",
    region: "East Africa",
    risk: "Yellow Fever Mandated",
    image:
      "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=900&q=85",
    slug: "kenya",
  },
  {
    name: "Costa Rica",
    region: "Central America",
    risk: "Vector Protection Advisory",
    image:
      "https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=900&q=85",
    slug: "costa-rica",
  },
  {
    name: "Indonesia",
    region: "Southeast Asia",
    risk: "Rabies & Dengue Watch",
    image:
      "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=900&q=85",
    slug: "indonesia",
  },
  {
    name: "Brazil",
    region: "South America",
    risk: "Yellow Fever Recommended",
    image:
      "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?auto=format&fit=crop&w=900&q=85",
    slug: "brazil",
  },
  {
    name: "Peru",
    region: "South America",
    risk: "Altitude & Malaria Variance",
    image:
      "https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=900&q=85",
    slug: "peru",
  },
  {
    name: "Tanzania",
    region: "East Africa",
    risk: "Endemic Malaria Regimen",
    image:
      "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=900&q=85",
    slug: "tanzania",
  },
  {
    name: "Thailand",
    region: "Southeast Asia",
    risk: "Border Malaria Advisory",
    image:
      "https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=900&q=85",
    slug: "thailand",
  },
];

const features: Feature[] = [
  {
    icon: MapPin,
    title: "Destination Health",
    description: "Inspect clinical risk profiles, disease prevalence, and mandatory entry requirements.",
    to: "/destinations",
    tag: "Directory",
  },
  {
    icon: Stethoscope,
    title: "Vaccine Guidance",
    description: "Review Yellow Fever, Typhoid, and routine boosters tailored to your exact itinerary.",
    to: "/destinations",
    tag: "Clinical",
  },
  {
    icon: ShieldCheck,
    title: "Malaria Planning",
    description: "Automate start dates, trip duration, and terminal post-travel liver-stage eradications.",
    to: "/destinations",
    tag: "Regimens",
  },
  {
    icon: ClipboardCheck,
    title: "Interactive Checklist",
    description: "Track prescription medications, vector nets, insect repellent, and visa documentation.",
    to: "/checklist",
    tag: "Tracker",
  },
  {
    icon: Volume2,
    title: "Stories & Audio",
    description: "Listen to firsthand traveler experiences, regional food protocols, and medical advice on the go.",
    to: "/stories",
    tag: "Audio",
  },
  {
    icon: CalendarDays,
    title: "Timed Reminders",
    description: "Automatic alerts for clinic consultations, vaccine booster windows, and packing milestones.",
    to: "/account/trips",
    tag: "Schedule",
  },
  {
    icon: Wifi,
    title: "Calendar Sync (.ICS)",
    description: "Bundle antimalarial doses and preparation checkpoints directly into Google Calendar or Apple iCal.",
    to: "/account/trips",
    tag: "Export",
  },
  {
    icon: Siren,
    title: "Emergency Directory",
    description: "Immediate local dispatch lines for police, ambulance, medical repatriation, and consulates.",
    to: "/emergency",
    tag: "24/7 Lines",
  },
];

const journey = [
  {
    number: "01",
    title: "Choose a Destination",
    description: "Discover verified endemic risks, seasonal transmission patterns, and entry rules.",
    icon: Compass,
  },
  {
    number: "02",
    title: "Review Health Directives",
    description: "Inspect necessary immunizations, mosquito bite precautions, and prophylactic drugs.",
    icon: HeartPulse,
  },
  {
    number: "03",
    title: "Build Your Trip Hub",
    description: "Synchronize dates to calculate precise medication schedules and due dates.",
    icon: MapPin,
  },
  {
    number: "04",
    title: "Travel with Confidence",
    description: "Access offline checklist items, audio stories, and verified emergency hotlines on arrival.",
    icon: ClipboardCheck,
  },
];

const TRENDING_SEARCHES = ["Kenya", "Cambodia", "Brazil", "Costa Rica", "Indonesia", "Peru"];

export default function HomePage() {
  const navigate = useNavigate();
  const [destination, setDestination] = useState("");
  const [travelDate, setTravelDate] = useState("");

  // 1. Hero Auto-Slider (Every 6s, slide right-to-left)
  const [heroIndex, setHeroIndex] = useState(0);
  const [isHeroPaused, setIsHeroPaused] = useState(false);

  // 2. Destinations Auto-Slider (Every 6s, slide right-to-left)
  const [destIndex, setDestIndex] = useState(0);
  const [isDestPaused, setIsDestPaused] = useState(false);

  // Audio Preview Simulation State
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState(42);

  // Auto-slide Hero Carousel (every 6 seconds)
  useEffect(() => {
    if (isHeroPaused) return;
    const timer = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [isHeroPaused]);

  // Auto-slide Destinations Carousel (every 6 seconds)
  useEffect(() => {
    if (isDestPaused) return;
    const timer = setInterval(() => {
      setDestIndex((prev) => (prev + 1) % (ALL_DESTINATIONS.length - 2));
    }, 6000);
    return () => clearInterval(timer);
  }, [isDestPaused]);

  // Audio simulator timer
  useEffect(() => {
    if (!isPlayingAudio) return;
    const interval = setInterval(() => {
      setAudioProgress((prev) => (prev >= 100 ? 0 : prev + 1));
    }, 400);
    return () => clearInterval(interval);
  }, [isPlayingAudio]);

  const handleDestinationSearch = () => {
    if (destination.trim()) {
      navigate(`/destinations?search=${encodeURIComponent(destination.trim())}`);
      return;
    }
    navigate("/destinations");
  };

  const nextHeroSlide = () => {
    setHeroIndex((prev) => (prev + 1) % HERO_SLIDES.length);
  };

  const prevHeroSlide = () => {
    setHeroIndex((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  };

  const maxDestSlide = ALL_DESTINATIONS.length - 3;

  const nextDestSlide = () => {
    setDestIndex((prev) => (prev >= maxDestSlide ? 0 : prev + 1));
  };

  const prevDestSlide = () => {
    setDestIndex((prev) => (prev <= 0 ? maxDestSlide : prev - 1));
  };

  return (
    <div className="overflow-hidden bg-[#f8faf9] text-[#0d262d]">
      {/* =========================================================
          HERO CAROUSEL SECTION (RIGHT-TO-LEFT HORIZONTAL SLIDE)
      ========================================================== */}
      <section
        className="relative min-h-[760px] sm:min-h-[820px] overflow-hidden bg-[#042127]"
        onMouseEnter={() => setIsHeroPaused(true)}
        onMouseLeave={() => setIsHeroPaused(false)}
      >
        {/* Sliding image track moving to the left */}
        <div
          className="absolute inset-0 flex h-full w-full transition-transform duration-1000 ease-out"
          style={{ transform: `translateX(-${heroIndex * 100}%)` }}
        >
          {HERO_SLIDES.map((slide, idx) => (
            <div key={idx} className="relative h-full w-full shrink-0">
              <img
                src={slide.image}
                alt={slide.subtitle}
                className="h-full w-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-[#031c21]/60 backdrop-brightness-95" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#02181d] via-[#04282f]/85 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#042127] via-transparent to-black/30" />
            </div>
          ))}
        </div>

        {/* Hero Content (Floating over slider) */}
        <div className="relative mx-auto flex min-h-[720px] sm:min-h-[780px] max-w-7xl items-center px-4 pt-20 pb-36 sm:px-6 lg:px-8 pointer-events-none">
          <div className="max-w-3xl text-white space-y-6 pointer-events-auto">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-semibold backdrop-blur-md shadow-xs animate-in fade-in duration-500">
              <Sparkles className="h-3.5 w-3.5 text-[#55d7c4]" />
              <span className="text-white/90">Clinical Intelligence • Built For Travelers</span>
            </div>

            <div className="space-y-2">
              <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-[#55d7c4]">
                {HERO_SLIDES[heroIndex].subtitle}
              </p>
              <h1 className="text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl">
                Travel prepared. <br />
                <span className="bg-gradient-to-r from-[#55d7c4] to-teal-200 bg-clip-text text-transparent">
                  Stay healthy.
                </span>
              </h1>
            </div>

            <p className="max-w-2xl text-sm sm:text-base leading-relaxed text-white/80">
              {HERO_SLIDES[heroIndex].desc}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate("/destinations")}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#55d7c4] px-6 text-xs sm:text-sm font-bold text-[#05282f] shadow-lg shadow-[#55d7c4]/25 transition hover:-translate-y-0.5 hover:bg-[#6de2cf] cursor-pointer"
              >
                Explore Destinations
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => navigate("/register")}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-6 text-xs sm:text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/20 cursor-pointer"
              >
                Plan Your Trip
              </button>
            </div>

            {/* Trust Bulletpoints */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-4 text-xs font-medium text-white/70">
              {["CDC & WHO Indexed", "Antimalarial Dosing Calculations", "Offline Access Ready"].map(
                (item) => (
                  <div key={item} className="flex items-center gap-2">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#55d7c4]/20 text-[#55d7c4]">
                      <Check className="h-2.5 w-2.5" />
                    </span>
                    <span>{item}</span>
                  </div>
                )
              )}
            </div>
          </div>
        </div>

        {/* Carousel Slide Indicators & Controls */}
        <div className="absolute right-5 bottom-32 sm:right-10 hidden sm:flex items-center gap-3 z-20">
          <button
            type="button"
            onClick={prevHeroSlide}
            aria-label="Previous slide"
            className="h-9 w-9 rounded-full border border-white/20 bg-black/30 backdrop-blur-md text-white flex items-center justify-center hover:bg-white/20 transition cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-1.5">
            {HERO_SLIDES.map((_, index) => (
              <button
                type="button"
                key={index}
                onClick={() => setHeroIndex(index)}
                aria-label={`Go to slide ${index + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  index === heroIndex ? "w-6 bg-[#55d7c4]" : "w-2 bg-white/35 hover:bg-white/60"
                }`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={nextHeroSlide}
            aria-label="Next slide"
            className="h-9 w-9 rounded-full border border-white/20 bg-black/30 backdrop-blur-md text-white flex items-center justify-center hover:bg-white/20 transition cursor-pointer"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Floating Search Bar */}
        <div className="absolute bottom-4 left-0 right-0 px-4 sm:px-6 lg:px-8 z-20">
          <div className="mx-auto max-w-7xl">
            <div className="rounded-2xl border border-white/20 bg-card/95 backdrop-blur-xl p-3 sm:p-4 shadow-2xl shadow-black/30">
              <div className="grid gap-2.5 md:grid-cols-[1fr_220px_auto]">
                <label className="flex min-h-12 items-center gap-3 rounded-xl bg-muted/50 border border-border/50 px-3.5">
                  <MapPin className="h-4 w-4 shrink-0 text-primary" />
                  <span className="sr-only">Destination</span>
                  <input
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleDestinationSearch();
                    }}
                    placeholder="Where are you traveling to? (e.g. Cambodia, Kenya, Brazil)"
                    className="w-full bg-transparent text-xs sm:text-sm text-foreground outline-none placeholder:text-muted-foreground"
                  />
                </label>

                <label className="flex min-h-12 items-center gap-2.5 rounded-xl bg-muted/50 border border-border/50 px-3.5">
                  <CalendarDays className="h-4 w-4 shrink-0 text-primary" />
                  <span className="sr-only">Travel date</span>
                  <input
                    type="date"
                    value={travelDate}
                    onChange={(e) => setTravelDate(e.target.value)}
                    className="w-full bg-transparent text-xs sm:text-sm text-foreground outline-none cursor-pointer"
                  />
                </label>

                <button
                  type="button"
                  onClick={handleDestinationSearch}
                  className="min-h-12 rounded-xl bg-primary px-6 text-xs sm:text-sm font-bold text-primary-foreground transition hover:bg-primary/90 shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Compass className="h-4 w-4" />
                  Explore Health Guide
                </button>
              </div>

              {/* Trending Quick Tags */}
              <div className="flex items-center gap-2 pt-2.5 text-[11px] text-muted-foreground overflow-x-auto scrollbar-none">
                <span className="font-semibold text-foreground shrink-0">Popular:</span>
                {TRENDING_SEARCHES.map((country) => (
                  <button
                    key={country}
                    type="button"
                    onClick={() => {
                      setDestination(country);
                      navigate(`/destinations?search=${encodeURIComponent(country)}`);
                    }}
                    className="rounded-lg bg-muted/70 px-2 py-0.5 hover:bg-primary/10 hover:text-primary transition cursor-pointer shrink-0"
                  >
                    {country}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          VALUE PROPOSITION & METRICS
      ========================================================== */}
      <section className="bg-background px-4 py-16 sm:px-6 lg:px-8 lg:py-24 border-b border-border">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
              <Globe className="h-3.5 w-3.5" />
              Unified Travel Health Companion
            </div>

            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
              Pre-departure preparation, without the overwhelm.
            </h2>

            <p className="text-sm sm:text-base leading-relaxed text-muted-foreground">
              Planning international trips typically requires navigating confusing government warnings,
              vaccination schedules, malaria drug interactions, and emergency numbers. Tropikit unites all
              critical travel medicine directives into one clean, interactive dashboard.
            </p>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => navigate("/register")}
                className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-primary hover:underline cursor-pointer"
              >
                Create your itinerary profile
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              {
                icon: MapPin,
                title: "Destination First",
                text: "Country-specific profiles mapping malaria endemicity, climate, and required entry inoculations.",
              },
              {
                icon: ClipboardCheck,
                title: "Smart Checklists",
                text: "Pre-categorized clinical packing checklists with local storage and account cloud syncing.",
              },
              {
                icon: ShieldCheck,
                title: "Evidence-Based",
                text: "Compiled from global health authorities (CDC, WHO, NaTHNaC) and verified regularly.",
              },
              {
                icon: Siren,
                title: "Emergency Support",
                text: "Localized short-code responder numbers, ambulance lines, and embassy registries accessible offline.",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="rounded-2xl border border-border bg-card p-5 shadow-xs hover:border-primary/40 hover:shadow-sm transition-all"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-sm sm:text-base font-bold text-foreground">
                    {item.title}
                  </h3>
                  <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                    {item.text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================
          THE 4-STEP TRAVEL JOURNEY
      ========================================================== */}
      <section className="bg-muted/30 px-4 py-16 sm:px-6 lg:px-8 lg:py-24 border-b border-border">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center space-y-3">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
              <Compass className="h-3.5 w-3.5" />
              Preparation Workflow
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              From Dream Destination to Safe Departure
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              A four-stage framework designed around medical best practices and traveler timelines.
            </p>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {journey.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.number} className="relative group">
                  <div className="h-full rounded-2xl border border-border bg-card p-6 shadow-xs hover:border-primary/40 transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black tracking-widest text-primary/60">
                          {step.number}
                        </span>
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <Icon className="h-4 w-4" />
                        </div>
                      </div>
                      <h3 className="mt-5 text-base font-bold text-foreground">
                        {step.title}
                      </h3>
                      <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                        {step.description}
                      </p>
                    </div>

                    <div className="mt-6 flex items-center gap-1 text-[11px] font-semibold text-primary">
                      <span>Phase {step.number}</span>
                      <ChevronRight className="h-3 w-3" />
                    </div>
                  </div>

                  {index < journey.length - 1 && (
                    <ChevronRight className="absolute -right-3 top-1/2 z-10 hidden h-6 w-6 -translate-y-1/2 rounded-full border border-border bg-card p-1 text-muted-foreground lg:block shadow-xs" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================
          FEATURED TOOLS GRID
      ========================================================== */}
      <section id="travel-health-tools" className="bg-background px-4 py-16 sm:px-6 lg:px-8 lg:py-24 border-b border-border">
        <div className="mx-auto max-w-7xl space-y-10">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                Comprehensive Feature Suite
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                All the tools you need to travel prepared.
              </h2>
            </div>
            <p className="max-w-md text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Every tool is source-referenced and built to minimize travel disruption before, during, and after your trip.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Link
                  key={feature.title}
                  to={feature.to}
                  className="group rounded-2xl border border-border bg-card p-5 shadow-xs hover:border-primary/50 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <Icon className="h-5 w-5" />
                      </div>
                      {feature.tag && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-muted text-muted-foreground">
                          {feature.tag}
                        </span>
                      )}
                    </div>

                    <h3 className="mt-4 text-base font-bold text-foreground group-hover:text-primary transition-colors">
                      {feature.title}
                    </h3>
                    <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>

                  <span className="mt-5 inline-flex items-center gap-1 text-xs font-bold text-primary">
                    Open Tool
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================
          DESTINATION SHOWCASE (RIGHT-TO-LEFT HORIZONTAL CAROUSEL)
      ========================================================== */}
      <section
        className="bg-[#05242b] px-4 py-16 text-white sm:px-6 lg:px-8 lg:py-24 overflow-hidden"
        onMouseEnter={() => setIsDestPaused(true)}
        onMouseLeave={() => setIsDestPaused(false)}
      >
        <div className="mx-auto max-w-7xl space-y-8">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-[#55d7c4]">
                GLOBAL DIRECTORY
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Inspect High-Traffic Destinations.
              </h2>
              <p className="text-xs sm:text-sm text-white/70 max-w-xl">
                Browse detailed health profiles across tropical regions, malaria zones, and island territories.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Manual Carousel Controls */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={prevDestSlide}
                  aria-label="Previous destinations"
                  className="h-9 w-9 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={nextDestSlide}
                  aria-label="Next destinations"
                  className="h-9 w-9 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => navigate("/destinations")}
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#55d7c4] hover:text-white transition cursor-pointer ml-2"
              >
                Browse all 76+ destinations
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Animated Carousel Track: Cards slide right-to-left */}
          <div className="relative overflow-hidden w-full">
            <div
              className="flex gap-5 transition-transform duration-700 ease-out"
              style={{
                transform: `translateX(-${destIndex * (100 / 3)}%)`,
              }}
            >
              {ALL_DESTINATIONS.map((item) => (
                <div
                  key={item.name}
                  className="w-[calc(100%-1.25rem)] sm:w-[calc(50%-1.25rem)] md:w-[calc(33.333%-0.85rem)] shrink-0"
                >
                  <Link
                    to={`/destinations/${item.slug}`}
                    className="group relative block overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-lg"
                  >
                    <div className="relative h-72 w-full overflow-hidden">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#041a1f] via-[#041a1f]/40 to-transparent" />

                      <div className="absolute bottom-4 left-4 right-4 space-y-1">
                        <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#55d7c4]/20 text-[#55d7c4] border border-[#55d7c4]/30 backdrop-blur-xs">
                          {item.risk}
                        </span>
                        <h3 className="text-xl font-bold text-white group-hover:text-[#55d7c4] transition-colors">
                          {item.name}
                        </h3>
                        <p className="text-xs text-white/60">{item.region}</p>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Destination Carousel Indicator Dots */}
          <div className="flex items-center justify-center gap-1.5 pt-2">
            {Array.from({ length: maxDestSlide + 1 }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setDestIndex(i)}
                aria-label={`Show destination slide ${i + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  i === destIndex ? "w-6 bg-[#55d7c4]" : "w-2 bg-white/20 hover:bg-white/40"
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================
          AUDIO STORYTELLING HIGHLIGHT (Interactive Preview)
      ========================================================== */}
      <section className="bg-gradient-to-br from-primary/5 via-background to-secondary/20 px-4 py-16 sm:px-6 lg:px-8 lg:py-24 border-b border-border">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-3.5 py-1.5 text-xs font-bold text-primary">
              <Volume2 className="h-4 w-4" />
              Field Audio & Personal Experiences
            </div>

            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
              Medical knowledge that doesn't sound like a textbook.
            </h2>

            <p className="text-sm sm:text-base leading-relaxed text-muted-foreground">
              Listen to concise 3-minute field summaries recorded for each tropical destination.
              Understand realistic daily habits for repellent application, water treatment, and early fever identification.
            </p>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => navigate("/stories")}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-xs sm:text-sm font-bold text-primary-foreground shadow-xs hover:bg-primary/90 transition cursor-pointer"
              >
                Listen to Traveler Stories
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Interactive Player Card */}
          <div className="relative mx-auto w-full max-w-md">
            <div className="rounded-3xl bg-[#062c34] p-5 shadow-xl text-white space-y-4 border border-white/10">
              <div className="rounded-2xl bg-white/10 p-5 backdrop-blur-md space-y-5">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                    className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#55d7c4] text-[#062c34] shadow-md transition hover:scale-105 active:scale-95 cursor-pointer"
                    aria-label={isPlayingAudio ? "Pause preview" : "Play preview"}
                  >
                    {isPlayingAudio ? (
                      <Pause className="h-5 w-5 fill-current" />
                    ) : (
                      <Play className="h-5 w-5 fill-current ml-0.5" />
                    )}
                  </button>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-[#55d7c4] block">
                      Field Audio Log
                    </span>
                    <span className="text-xs text-white/60">Episode • Vector Protection</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-bold text-white leading-snug">
                    "A few simple habits can make the difference between dengue and a dream trip."
                  </h4>
                  <p className="text-xs text-white/60 mt-1">
                    Recorded by Dr. K. Martinez • Tropical Medicine Fellow
                  </p>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/20">
                    <div
                      className="h-full bg-[#55d7c4] transition-all duration-300 rounded-full"
                      style={{ width: `${audioProgress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-white/50 font-mono">
                    <span>
                      0{Math.floor((audioProgress * 1.8) / 60)}:
                      {Math.floor((audioProgress * 1.8) % 60)
                        .toString()
                        .padStart(2, "0")}
                    </span>
                    <span>03:18</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-white/60 px-1">
                <span>Available with full transcript</span>
                <span className="text-[#55d7c4] font-semibold">Free to listen</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          FINAL CALL TO ACTION
      ========================================================== */}
      <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-3xl bg-linear-to-br from-[#062c34] to-[#041a1f] p-8 sm:p-14 text-center text-white shadow-xl relative border border-white/10">
          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#55d7c4]">
              <Sparkles className="h-3.5 w-3.5" />
              Prepare Before You Pack
            </div>

            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
              Ready for your next journey?
            </h2>

            <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
              Create an account to save trips, generate custom antimalarial regimen timelines,
              and sync medical preparation tasks across all your devices.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
              <button
                type="button"
                onClick={() => navigate("/register")}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#55d7c4] px-6 text-xs sm:text-sm font-bold text-[#062c34] transition hover:bg-[#6de2cf] cursor-pointer shadow-md"
              >
                Create Free Account
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => navigate("/destinations")}
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 text-xs sm:text-sm font-semibold text-white transition hover:bg-white/15 cursor-pointer backdrop-blur-xs"
              >
                Browse Destinations
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}