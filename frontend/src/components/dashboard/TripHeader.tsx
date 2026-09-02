import { Calendar, MapPin, Trash2, Download } from "lucide-react";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function TripHeader({
  destinationName,
  region,
  departureDate,
  returnDate,
  daysUntilDeparture,
  durationDays,
  tripType,
  accommodationType,
  activities,
  onDelete,
  onOpenPlanner,
  onDownloadCalendar,
  isDownloadingCalendar,
}: {
  destinationName: string;
  region: string;
  departureDate: string;
  returnDate: string;
  daysUntilDeparture: number;
  durationDays: number;
  tripType?: string;
  accommodationType?: string;
  activities?: string[];
  onDelete: () => void;
  onOpenPlanner?: () => void;
  onDownloadCalendar?: () => void;
  isDownloadingCalendar?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border overflow-hidden shadow-soft mb-6">
      <div className="px-6 py-6 text-primary-foreground" style={{ background: "var(--gradient-hero)" }}>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-white/80">
              <MapPin className="h-4 w-4" />
              {region}
            </div>
            <h1 className="text-3xl font-semibold mt-1">{destinationName}</h1>

            {/* Trip Personalization Badges */}
            {(tripType || accommodationType || (activities && activities.length > 0)) && (
              <div className="flex flex-wrap items-center gap-2 mt-3">
                {tripType && (
                  <span className="text-xs bg-white/20 px-2.5 py-0.5 rounded-full backdrop-blur-sm">
                    {tripType}
                  </span>
                )}
                {accommodationType && (
                  <span className="text-xs bg-white/20 px-2.5 py-0.5 rounded-full backdrop-blur-sm">
                    {accommodationType}
                  </span>
                )}
                {activities?.map((act) => (
                  <span
                    key={act}
                    className="text-xs bg-white/15 px-2.5 py-0.5 rounded-full backdrop-blur-sm text-white/90"
                  >
                    {act}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {onDownloadCalendar && (
              <button
                onClick={onDownloadCalendar}
                disabled={isDownloadingCalendar}
                aria-label="Export trip calendar"
                className="text-xs font-medium bg-white/15 hover:bg-white/25 rounded-md px-3 py-2 flex items-center gap-1.5 transition-colors disabled:opacity-60"
              >
                <Download className="h-3.5 w-3.5" />
                {isDownloadingCalendar ? "Exporting..." : "Export .ics"}
              </button>
            )}
            {onOpenPlanner && (
              <button
                onClick={onOpenPlanner}
                className="text-xs font-medium bg-white/15 hover:bg-white/25 rounded-md px-3 py-2 transition-colors"
              >
                Destination guide
              </button>
            )}
            <button
              onClick={onDelete}
              aria-label="Delete trip"
              className="text-xs font-medium bg-white/15 hover:bg-white/25 rounded-md px-3 py-2 flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-border bg-card">
        <div className="p-4">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
            <Calendar className="h-3.5 w-3.5" /> Departure
          </div>
          <div className="text-sm font-medium text-foreground">{fmtDate(departureDate)}</div>
        </div>
        <div className="p-4">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
            <Calendar className="h-3.5 w-3.5" /> Return
          </div>
          <div className="text-sm font-medium text-foreground">{fmtDate(returnDate)}</div>
        </div>
        <div className="p-4">
          <div className="text-xs text-muted-foreground mb-1">Days until departure</div>
          <div className="text-sm font-medium text-foreground">
            {daysUntilDeparture > 0
              ? `${daysUntilDeparture} day${daysUntilDeparture === 1 ? "" : "s"}`
              : daysUntilDeparture === 0
              ? "Today"
              : "Departed"}
          </div>
        </div>
        <div className="p-4">
          <div className="text-xs text-muted-foreground mb-1">Trip duration</div>
          <div className="text-sm font-medium text-foreground">
            {durationDays} day{durationDays === 1 ? "" : "s"}
          </div>
        </div>
      </div>
    </div>
  );
}