import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addDays, mauritiusToday } from "@/domain/time";
import { useI18n } from "@/i18n/context";
import type { Place } from "@/maps/places";
import { navigate } from "@/router";
import { ErrorNote } from "./feedback";
import { PlaceField } from "./place-field";

export function SearchForm({
  initial,
}: {
  initial?: { from: Place | null; to: Place | null; date: string; time: string; seats: string };
}) {
  const { messages } = useI18n();
  const [from, setFrom] = useState<Place | null>(initial?.from ?? null);
  const [to, setTo] = useState<Place | null>(initial?.to ?? null);
  const [date, setDate] = useState(initial?.date || addDays(mauritiusToday(), 1));
  const [time, setTime] = useState(initial?.time ?? "");
  const [seats, setSeats] = useState(initial?.seats || "1");
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="grid gap-3 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-foreground/10"
      onSubmit={(event) => {
        event.preventDefault();
        if (!from || !to) {
          setError("INVALID_PLACE");
          return;
        }
        const params = new URLSearchParams({
          originLat: String(from.lat),
          originLng: String(from.lng),
          originLabel: from.label,
          destLat: String(to.lat),
          destLng: String(to.lng),
          destLabel: to.label,
          date,
          seats,
        });
        if (time) params.set("time", time);
        navigate(`/rides?${params.toString()}`);
      }}
    >
      <div className="grid gap-3 md:grid-cols-2">
        <PlaceField id="from" label={messages.search.from} value={from} onChange={setFrom} emptyText={messages.search.none} />
        <PlaceField id="to" label={messages.search.to} value={to} onChange={setTo} emptyText={messages.search.none} />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="grid gap-1.5 text-sm font-medium">
          <Label htmlFor="date">{messages.search.date}</Label>
          <Input id="date" type="date" required className="h-11 bg-background" value={date} min={mauritiusToday()} onChange={(event) => setDate(event.target.value)} />
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          <Label htmlFor="time">{messages.search.time}</Label>
          <Input id="time" type="time" className="h-11 bg-background" value={time} onChange={(event) => setTime(event.target.value)} />
          <span className="text-xs font-normal text-muted-foreground">{messages.search.timeHint}</span>
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          <Label htmlFor="seats">{messages.search.seats}</Label>
          <Input id="seats" type="number" min={1} max={6} className="h-11 bg-background" value={seats} onChange={(event) => setSeats(event.target.value)} />
        </label>
      </div>
      <ErrorNote code={error} />
      <Button type="submit" className="h-11">{messages.search.submit}</Button>
    </form>
  );
}
