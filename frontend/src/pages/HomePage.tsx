import { useNavigate } from "react-router-dom";
import { ShieldPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/tropical-hero.jpg";

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <header className="relative overflow-hidden">
      <img
        src={heroImage}
        alt="Tropical coastline at sunset"
        width={1920}
        height={1080}
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0" style={{ background: "var(--gradient-sunset)" }} aria-hidden />
      <div className="relative mx-auto max-w-6xl px-6 py-24 sm:py-32 text-primary-foreground">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs backdrop-blur">
          <ShieldPlus className="h-3.5 w-3.5" />
          Travel health, made simple
        </div>
        <h1 className="mt-5 text-4xl sm:text-6xl font-semibold tracking-tight max-w-3xl">
          Stay healthy across the tropics.
        </h1>
        <p className="mt-4 max-w-2xl text-base sm:text-lg text-white/85">
          Destination-specific vaccine guidance, malaria prevention, a smart pre-trip checklist
          and emergency contacts — all in one place.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button
            size="lg"
            className="bg-accent text-accent-foreground hover:bg-accent/90"
            onClick={() => navigate("/destinations")}
          >
            Explore destinations
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="bg-white/10 text-white border-white/40 hover:bg-white/20 hover:text-white"
            onClick={() => navigate("/checklist")}
          >
            Open checklist
          </Button>
        </div>
      </div>
    </header>
  );
}
