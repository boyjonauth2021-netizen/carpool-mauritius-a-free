import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ErrorNote, Notice, statusLabel } from "@/components/feedback";
import { TripMap } from "@/components/trip-map";
import {
  acceptRequest,
  averageStars,
  canSeeContact,
  cancelRide,
  completeRide,
  declineRequest,
  fileReport,
  rateRide,
  requestSeat,
  withdrawRequest,
} from "@/data/actions";
import { useApp } from "@/data/context";
import { formatMauritius } from "@/domain/time";
import { firstName } from "@/domain/text";
import { useI18n } from "@/i18n/context";
import { fill } from "@/i18n/messages";
import { browserMapsKey } from "@/maps/google-key";
import { navigate } from "@/router";

export function RidePage({ id }: { id: string }) {
  const { locale, messages } = useI18n();
  const { state, user, run } = useApp();
  const ride = state.rides.find((item) => item.id === id);
  const [seats, setSeats] = useState(1);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [report, setReport] = useState("");
  const [category, setCategory] = useState<"safety" | "no_show" | "behaviour" | "other">("safety");
  const [stars, setStars] = useState(5);

  if (!ride) return <p>{messages.errors.NOT_FOUND}</p>;
  const driver = state.users.find((item) => item.id === ride.driverId);
  const profile = state.profiles.find((item) => item.userId === ride.driverId);
  const mine = state.requests.find(
    (item) => item.rideId === ride.id && item.passengerId === user?.id && (item.status === "pending" || item.status === "accepted" || item.status === "declined"),
  );
  const visible = canSeeContact(state, ride, user?.id ?? null);
  const isDriver = user?.id === ride.driverId;
  const requests = state.requests.filter((item) => item.rideId === ride.id);
  const starsAvg = driver ? averageStars(state, driver.id) : null;
  const left = ride.seatsTotal - ride.seatsTaken;
  const subjectId = isDriver
    ? requests.find((item) => item.status === "accepted")?.passengerId
    : ride.driverId;
  const alreadyRated = user && subjectId
    ? state.ratings.some((item) => item.rideId === ride.id && item.authorId === user.id && item.subjectId === subjectId)
    : false;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="grid gap-4">
        <p className="text-sm text-primary">{statusLabel(messages, ride.status)}</p>
        <h1 className="font-heading text-4xl">
          {ride.originLabel}
          <span className="block text-2xl text-muted-foreground">→ {ride.destinationLabel}</span>
        </h1>
        <p>{formatMauritius(ride.departureAt, locale)}</p>
        <p className="text-sm">{left > 0 ? fill(messages.ride.seatsLeft, { count: left }) : messages.ride.full}</p>
        {ride.status === "hidden" && <p className="text-sm">{messages.ride.hidden}</p>}
        <dl className="grid gap-2 text-sm">
          <div>
            <dt className="text-muted-foreground">{messages.ride.driver}</dt>
            <dd>{driver ? firstName(driver.name) : "—"}{starsAvg !== null ? ` · ${starsAvg}/5` : ""}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{messages.ride.vehicle}</dt>
            <dd>{profile ? `${profile.vehicleColor} ${profile.vehicleMake} ${profile.vehicleModel}` : "—"}</dd>
          </div>
          {ride.notes && (
            <div>
              <dt className="text-muted-foreground">{messages.ride.notes}</dt>
              <dd>{ride.notes}</dd>
            </div>
          )}
          <div>
            <dt className="text-muted-foreground">{messages.ride.contact}</dt>
            {visible && driver && profile ? (
              <dd>
                {messages.ride.phone}: {isDriver ? driver.phone : driver.phone}
                <br />
                {messages.ride.plate}: {profile.plateNumber}
              </dd>
            ) : (
              <dd>{messages.ride.contactHidden}</dd>
            )}
          </div>
        </dl>
        {visible && !isDriver && (
          <p className="text-sm">
            {messages.ride.phone}: {driver?.phone}
          </p>
        )}

        {!user && ride.status === "open" && (
          <Button type="button" className="h-11 w-fit" onClick={() => navigate("/login")}>{messages.ride.loginToRequest}</Button>
        )}
        {user && !isDriver && ride.status === "open" && !mine && (
          <form
            className="grid gap-3 rounded-2xl bg-card p-4 ring-1 ring-foreground/10"
            onSubmit={(event) => {
              event.preventDefault();
              const code = run((current) => requestSeat(current, user.id, ride.id, seats, message, new Date()));
              setError(code);
            }}
          >
            <h2 className="font-heading text-2xl">{messages.ride.request}</h2>
            <label className="grid gap-1.5">
              <Label htmlFor="req-seats">{messages.search.seats}</Label>
              <Input id="req-seats" type="number" min={1} max={left || 1} className="h-11" value={seats} onChange={(event) => setSeats(Number(event.target.value))} />
            </label>
            <label className="grid gap-1.5">
              <Label htmlFor="req-message">{messages.ride.message}</Label>
              <Textarea id="req-message" value={message} onChange={(event) => setMessage(event.target.value)} />
            </label>
            <ErrorNote code={error} />
            <Button type="submit" className="h-11">{messages.ride.send}</Button>
          </form>
        )}
        {mine && (
          <div className="rounded-2xl bg-[#f6f1e7] p-4 text-sm">
            <p>{fill(messages.ride.yourRequest, { status: statusLabel(messages, mine.status) })}</p>
            {(mine.status === "pending" || mine.status === "accepted") && ride.status !== "completed" && ride.status !== "cancelled" && (
              <Button
                type="button"
                variant="outline"
                className="mt-3 h-10"
                onClick={() => setError(run((current) => withdrawRequest(current, user!.id, mine.id, new Date())))}
              >
                {messages.ride.withdraw}
              </Button>
            )}
          </div>
        )}
        {isDriver && (
          <section className="grid gap-3">
            <h2 className="font-heading text-2xl">{messages.ride.requests}</h2>
            {requests.length === 0 && <p className="text-sm text-muted-foreground">{messages.ride.noRequests}</p>}
            {requests.map((request) => {
              const passenger = state.users.find((item) => item.id === request.passengerId);
              const showPhone = request.status === "accepted";
              return (
                <article key={request.id} className="rounded-xl bg-card p-3 text-sm ring-1 ring-foreground/10">
                  <p className="font-medium">{passenger ? firstName(passenger.name) : "—"} · {request.seats} · {statusLabel(messages, request.status)}</p>
                  {request.message && <p className="mt-1 text-muted-foreground">{request.message}</p>}
                  {showPhone && passenger && <p className="mt-1">{messages.ride.phone}: {passenger.phone}</p>}
                  {request.status === "pending" && ride.status === "open" && (
                    <div className="mt-2 flex gap-2">
                      <Button type="button" className="h-9" onClick={() => setError(run((current) => acceptRequest(current, user.id, request.id, new Date())))}>{messages.ride.accept}</Button>
                      <Button type="button" variant="outline" className="h-9" onClick={() => setError(run((current) => declineRequest(current, user.id, request.id, new Date())))}>{messages.ride.decline}</Button>
                    </div>
                  )}
                </article>
              );
            })}
            {(ride.status === "open" || ride.status === "full") && (
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={() => setError(run((current) => cancelRide(current, user.id, ride.id, new Date())))}>{messages.ride.cancelRide}</Button>
                <Button type="button" onClick={() => setError(run((current) => completeRide(current, user.id, ride.id, new Date())))}>{messages.ride.complete}</Button>
              </div>
            )}
            <p className="text-xs text-muted-foreground">{messages.ride.completeHint}</p>
          </section>
        )}
        {user && ride.status === "completed" && subjectId && (isDriver || mine?.status === "accepted") && (
          <form
            className="grid gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              setError(run((current) => rateRide(current, user.id, ride.id, subjectId, stars, new Date())));
            }}
          >
            <h2 className="font-heading text-2xl">{messages.ride.rate}</h2>
            {alreadyRated ? (
              <p>{fill(messages.ride.rated, { stars: state.ratings.find((item) => item.authorId === user.id && item.rideId === ride.id)?.stars ?? stars })}</p>
            ) : (
              <>
                <Input type="number" min={1} max={5} className="h-11 w-24" value={stars} onChange={(event) => setStars(Number(event.target.value))} />
                <Button type="submit" className="h-10 w-fit">{messages.ride.rateSave}</Button>
              </>
            )}
          </form>
        )}
        {user && (
          <form
            className="grid gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              const code = run((current) => fileReport(current, user.id, { rideId: ride.id, subjectUserId: isDriver ? undefined : ride.driverId, category, details: report }, new Date()));
              setError(code);
              setSaved(code ? null : messages.ride.reportSaved);
            }}
          >
            <h2 className="font-heading text-2xl">{messages.ride.report}</h2>
            <select className="h-11 rounded-lg border bg-card px-2" value={category} onChange={(event) => setCategory(event.target.value as typeof category)}>
              <option value="safety">safety</option>
              <option value="no_show">no_show</option>
              <option value="behaviour">behaviour</option>
              <option value="other">other</option>
            </select>
            <Textarea value={report} onChange={(event) => setReport(event.target.value)} placeholder={messages.ride.reportDetails} />
            <Button type="submit" variant="outline" className="h-10 w-fit">{messages.ride.reportSend}</Button>
          </form>
        )}
        <ErrorNote code={error} />
        <Notice text={saved} />
      </div>
      <TripMap
        origin={{ lat: ride.originLat, lng: ride.originLng }}
        destination={{ lat: ride.destinationLat, lng: ride.destinationLng }}
        caption={browserMapsKey() ? messages.search.mapsOn : messages.search.mapsOff}
      />
    </div>
  );
}
