import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ErrorNote } from "@/components/feedback";
import { PlaceField } from "@/components/place-field";
import { postRide } from "@/data/actions";
import { useApp } from "@/data/context";
import { addDays, mauritiusInstant, mauritiusToday } from "@/domain/time";
import { useI18n } from "@/i18n/context";
import { fill } from "@/i18n/messages";
import { estimateRoute } from "@/maps/estimate";
import type { Place } from "@/maps/places";
import { navigate } from "@/router";

export function PostPage() {
  const { messages } = useI18n();
  const { user, state, run } = useApp();
  const profile = state.profiles.find((item) => item.userId === user?.id);
  const [from, setFrom] = useState<Place | null>(null);
  const [to, setTo] = useState<Place | null>(null);
  const [date, setDate] = useState(addDays(mauritiusToday(), 1));
  const [time, setTime] = useState("07:30");
  const [seats, setSeats] = useState(1);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const maxSeats = Math.max(1, (profile?.vehicleSeats ?? 5) - 1);
  const estimate = useMemo(
    () => (from && to ? estimateRoute(from, to) : null),
    [from, to],
  );

  if (!user) {
    return (
      <div className="grid gap-3">
        <h1 className="font-heading text-4xl">{messages.post.title}</h1>
        <Button type="button" className="h-11 w-fit" onClick={() => navigate("/login")}>{messages.nav.login}</Button>
      </div>
    );
  }

  return (
    <div className="grid max-w-2xl gap-5">
      <div>
        <h1 className="font-heading text-4xl">{messages.post.title}</h1>
        <p className="mt-2 text-muted-foreground">{messages.post.lede}</p>
      </div>
      {profile?.status !== "approved" && (
        <div className="rounded-xl bg-[#f6f1e7] p-4 text-sm">
          <p>{messages.post.needApproval}</p>
          <Button type="button" className="mt-3 h-10" onClick={() => navigate("/drive")}>{messages.post.goDrive}</Button>
        </div>
      )}
      <form
        className="grid gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          if (!from || !to || !user) {
            setError("INVALID_PLACE");
            return;
          }
          const code = run((current) =>
            postRide(
              current,
              user.id,
              {
                originLabel: from.label,
                originLat: from.lat,
                originLng: from.lng,
                destinationLabel: to.label,
                destinationLat: to.lat,
                destinationLng: to.lng,
                departureAt: mauritiusInstant(date, time).toISOString(),
                seatsTotal: seats,
                notes,
              },
              new Date(),
            ),
          );
          setError(code);
          if (!code) navigate("/trips");
        }}
      >
        <PlaceField id="post-from" label={messages.search.from} value={from} onChange={setFrom} emptyText={messages.search.none} />
        <PlaceField id="post-to" label={messages.search.to} value={to} onChange={setTo} emptyText={messages.search.none} />
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="grid gap-1.5">
            <Label htmlFor="post-date">{messages.post.date}</Label>
            <Input id="post-date" type="date" className="h-11" min={mauritiusToday()} value={date} onChange={(event) => setDate(event.target.value)} />
          </label>
          <label className="grid gap-1.5">
            <Label htmlFor="post-time">{messages.post.time}</Label>
            <Input id="post-time" type="time" required className="h-11" value={time} onChange={(event) => setTime(event.target.value)} />
          </label>
          <label className="grid gap-1.5">
            <Label htmlFor="post-seats">{messages.post.seats}</Label>
            <Input id="post-seats" type="number" min={1} max={maxSeats} className="h-11" value={seats} onChange={(event) => setSeats(Number(event.target.value))} />
          </label>
        </div>
        <label className="grid gap-1.5">
          <Label htmlFor="notes">{messages.post.notes}</Label>
          <Textarea id="notes" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder={messages.post.notesHint} />
        </label>
        {estimate && (
          <p className="text-sm text-muted-foreground">
            {messages.post.preview}: {fill(messages.search.estimate, { km: estimate.distanceKm, min: estimate.durationMin })}
          </p>
        )}
        <ErrorNote code={error} />
        <Button type="submit" className="h-11" disabled={profile?.status !== "approved"}>{messages.post.submit}</Button>
      </form>
    </div>
  );
}
