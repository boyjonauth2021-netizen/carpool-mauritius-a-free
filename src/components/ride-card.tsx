import { averageStars } from "@/data/actions";
import { useApp } from "@/data/context";
import type { Ride } from "@/data/types";
import { useI18n } from "@/i18n/context";
import { fill } from "@/i18n/messages";
import { formatMauritius } from "@/domain/time";
import { firstName } from "@/domain/text";
import { navigate } from "@/router";

export function RideCard({ ride }: { ride: Ride }) {
  const { state } = useApp();
  const { locale, messages } = useI18n();
  const driver = state.users.find((user) => user.id === ride.driverId);
  const profile = state.profiles.find((item) => item.userId === ride.driverId);
  const stars = driver ? averageStars(state, driver.id) : null;
  const left = ride.seatsTotal - ride.seatsTaken;

  return (
    <a
      href={`#/rides/${ride.id}`}
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey || event.button !== 0) return;
        event.preventDefault();
        navigate(`/rides/${ride.id}`);
      }}
      className="block rounded-2xl bg-card p-4 ring-1 ring-foreground/10 transition hover:-translate-y-0.5 hover:ring-primary/40"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-heading text-lg">{ride.originLabel}</p>
          <p className="text-sm text-muted-foreground">→ {ride.destinationLabel}</p>
        </div>
        <p className="text-right text-sm font-medium text-primary">
          {left > 0 ? fill(messages.ride.seatsLeft, { count: left }) : messages.ride.full}
        </p>
      </div>
      <p className="mt-3 text-sm">{formatMauritius(ride.departureAt, locale)}</p>
      <p className="mt-1 text-sm text-muted-foreground">
        {driver ? firstName(driver.name) : "—"}
        {profile ? ` · ${profile.vehicleColor} ${profile.vehicleMake} ${profile.vehicleModel}` : ""}
        {stars !== null ? ` · ${stars}/5` : ""}
      </p>
    </a>
  );
}
