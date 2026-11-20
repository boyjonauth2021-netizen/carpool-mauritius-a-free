import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ErrorNote, statusLabel } from "@/components/feedback";
import { approveDriver, closeReport, hideRide, rejectDriver, restoreUser, suspendUser } from "@/data/actions";
import { useApp } from "@/data/context";
import { formatMauritius } from "@/domain/time";
import { useI18n } from "@/i18n/context";

export function AdminPage() {
  const { locale, messages } = useI18n();
  const { user, state, run } = useApp();
  const [error, setError] = useState<string | null>(null);
  const [reasons, setReasons] = useState<Record<string, string>>({});
  if (!user?.isAdmin) return <p>{messages.admin.forbidden}</p>;

  const pending = state.profiles.filter((profile) => profile.status === "pending");
  const openRides = state.rides.filter((ride) => ride.status === "open" || ride.status === "full");
  const reports = state.reports.filter((report) => report.status === "open");

  return (
    <div className="grid gap-8">
      <div>
        <h1 className="font-heading text-4xl">{messages.admin.title}</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{messages.admin.lede}</p>
      </div>
      <ErrorNote code={error} />
      <section className="grid gap-3">
        <h2 className="font-heading text-2xl">{messages.admin.pending}</h2>
        {pending.length === 0 && <p className="text-sm text-muted-foreground">{messages.admin.emptyPending}</p>}
        {pending.map((profile) => {
          const person = state.users.find((item) => item.id === profile.userId);
          return (
            <article key={profile.id} className="grid gap-2 rounded-2xl bg-card p-4 text-sm ring-1 ring-foreground/10">
              <p className="font-medium">{person?.name} · {person?.phone}</p>
              <p>{profile.vehicleColor} {profile.vehicleMake} {profile.vehicleModel} ({profile.vehicleYear})</p>
              <p>{messages.drive.plate}: {profile.plateNumber}</p>
              <p>{messages.admin.licence}: {profile.licenceNumber}</p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button type="button" className="h-10" onClick={() => setError(run((current) => approveDriver(current, user.id, profile.userId, new Date())))}>{messages.admin.approve}</Button>
                <Input
                  className="h-10"
                  placeholder={messages.admin.reason}
                  value={reasons[profile.userId] ?? ""}
                  onChange={(event) => setReasons({ ...reasons, [profile.userId]: event.target.value })}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="h-10"
                  onClick={() => setError(run((current) => rejectDriver(current, user.id, profile.userId, reasons[profile.userId] ?? "", new Date())))}
                >
                  {messages.admin.reject}
                </Button>
              </div>
            </article>
          );
        })}
      </section>
      <section className="grid gap-3">
        <h2 className="font-heading text-2xl">{messages.admin.users}</h2>
        {state.users.map((person) => (
          <article key={person.id} className="flex flex-col justify-between gap-2 rounded-xl bg-card p-3 text-sm ring-1 ring-foreground/10 sm:flex-row sm:items-center">
            <div>
              <p className="font-medium">{person.name}</p>
              <p className="text-muted-foreground">{person.email} · {statusLabel(messages, person.status)}{person.isAdmin ? " · admin" : ""}{person.isDriver ? " · driver" : ""}{person.isPassenger ? " · passenger" : ""}</p>
            </div>
            {person.id !== user.id && (
              person.status === "active" ? (
                <Button type="button" variant="outline" className="h-9" onClick={() => setError(run((current) => suspendUser(current, user.id, person.id, new Date())))}>{messages.admin.suspend}</Button>
              ) : (
                <Button type="button" className="h-9" onClick={() => setError(run((current) => restoreUser(current, user.id, person.id, new Date())))}>{messages.admin.restore}</Button>
              )
            )}
          </article>
        ))}
      </section>
      <section className="grid gap-3">
        <h2 className="font-heading text-2xl">{messages.admin.rides}</h2>
        {openRides.map((ride) => (
          <article key={ride.id} className="flex flex-col justify-between gap-2 rounded-xl bg-card p-3 text-sm sm:flex-row sm:items-center">
            <p>{ride.originLabel} → {ride.destinationLabel} · {formatMauritius(ride.departureAt, locale)}</p>
            <Button type="button" variant="outline" className="h-9" onClick={() => setError(run((current) => hideRide(current, user.id, ride.id, new Date())))}>{messages.admin.hide}</Button>
          </article>
        ))}
      </section>
      <section className="grid gap-3">
        <h2 className="font-heading text-2xl">{messages.admin.reports}</h2>
        {reports.length === 0 && <p className="text-sm text-muted-foreground">{messages.admin.emptyReports}</p>}
        {reports.map((report) => (
          <article key={report.id} className="rounded-xl bg-card p-3 text-sm ring-1 ring-foreground/10">
            <p className="font-medium">{report.category}</p>
            <p className="mt-1">{report.details}</p>
            <Button type="button" className="mt-2 h-9" onClick={() => setError(run((current) => closeReport(current, user.id, report.id, new Date())))}>{messages.admin.close}</Button>
          </article>
        ))}
      </section>
      <section>
        <h2 className="font-heading text-2xl">{messages.admin.audit}</h2>
        <ul className="mt-2 grid gap-1 text-sm text-muted-foreground">
          {state.audit.slice(0, 8).map((entry) => (
            <li key={entry.id}>{entry.action} · {entry.entityId}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
