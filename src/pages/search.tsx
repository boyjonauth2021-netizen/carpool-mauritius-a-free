import { RideCard } from "@/components/ride-card";
import { SearchForm } from "@/components/search-form";
import { searchRides } from "@/data/actions";
import { useApp } from "@/data/context";
import { searchWindow } from "@/domain/time";
import { useI18n } from "@/i18n/context";
import { estimateRoute } from "@/maps/estimate";
import { fill } from "@/i18n/messages";
import type { AppLocation } from "@/router";

function num(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function SearchPage({ location }: { location: AppLocation }) {
  const { messages } = useI18n();
  const { state, user } = useApp();
  const originLat = num(location.params.get("originLat"));
  const originLng = num(location.params.get("originLng"));
  const destLat = num(location.params.get("destLat"));
  const destLng = num(location.params.get("destLng"));
  const date = location.params.get("date") ?? "";
  const time = location.params.get("time") ?? "";
  const seats = Number(location.params.get("seats") ?? "1");
  const ready = originLat !== null && originLng !== null && destLat !== null && destLng !== null && date;
  let hits: ReturnType<typeof searchRides> = [];
  let estimate: ReturnType<typeof estimateRoute> | null = null;
  if (ready) {
    try {
      const window = searchWindow({ date, time: time || undefined });
      estimate = estimateRoute({ lat: originLat!, lng: originLng! }, { lat: destLat!, lng: destLng! });
      hits = searchRides(state, {
        origin: { lat: originLat!, lng: originLng! },
        destination: { lat: destLat!, lng: destLng! },
        start: window.start,
        end: window.end,
        seats: Number.isInteger(seats) ? seats : 1,
        excludeDriverId: user?.id,
      });
    } catch {
      hits = [];
    }
  }
  const from = ready
    ? { id: "from", label: location.params.get("originLabel") ?? "", lat: originLat!, lng: originLng! }
    : null;
  const to = ready
    ? { id: "to", label: location.params.get("destLabel") ?? "", lat: destLat!, lng: destLng! }
    : null;

  return (
    <div className="grid gap-6">
      <h1 className="font-heading text-4xl">{messages.search.title}</h1>
      <p className="max-w-2xl text-sm text-muted-foreground">{messages.search.prompt}</p>
      <SearchForm initial={{ from, to, date, time, seats: String(seats || 1) }} />
      {estimate && (
        <p className="text-sm text-muted-foreground">
          {fill(messages.search.estimate, { km: estimate.distanceKm, min: estimate.durationMin })}
        </p>
      )}
      {ready && (
        <section className="grid gap-3">
          <h2 className="font-heading text-2xl">{messages.search.results}</h2>
          {hits.length === 0 && <p className="text-muted-foreground">{messages.search.empty}</p>}
          {hits.map((hit) => (
            <RideCard key={hit.ride.id} ride={hit.ride} />
          ))}
        </section>
      )}
    </div>
  );
}
