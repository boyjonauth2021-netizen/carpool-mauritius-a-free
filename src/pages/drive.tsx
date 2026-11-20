import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ErrorNote } from "@/components/feedback";
import { enableRole, submitDriverProfile } from "@/data/actions";
import { useApp } from "@/data/context";
import { useI18n } from "@/i18n/context";
import { navigate } from "@/router";

export function DrivePage() {
  const { messages } = useI18n();
  const { user, state, run } = useApp();
  const profile = state.profiles.find((item) => item.userId === user?.id);
  const [make, setMake] = useState(profile?.vehicleMake ?? "");
  const [model, setModel] = useState(profile?.vehicleModel ?? "");
  const [year, setYear] = useState(profile?.vehicleYear ?? 2018);
  const [color, setColor] = useState(profile?.vehicleColor ?? "");
  const [plate, setPlate] = useState(profile?.plateNumber ?? "");
  const [seats, setSeats] = useState(profile?.vehicleSeats ?? 5);
  const [licence, setLicence] = useState(profile?.licenceNumber ?? "");
  const [error, setError] = useState<string | null>(null);

  if (!user) return <Button type="button" className="h-11" onClick={() => navigate("/login")}>{messages.nav.login}</Button>;

  return (
    <div className="grid max-w-xl gap-4">
      <div>
        <h1 className="font-heading text-4xl">{messages.drive.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{messages.drive.lede}</p>
      </div>
      {!user.isDriver && (
        <Button type="button" className="h-11 w-fit" onClick={() => setError(run((current) => enableRole(current, user.id, "driver")))}>
          {messages.drive.enable}
        </Button>
      )}
      {profile?.status === "pending" && <p className="rounded-xl bg-[#f6f1e7] p-4 text-sm">{messages.drive.pending}</p>}
      {profile?.status === "approved" && (
        <div className="rounded-xl bg-primary/10 p-4 text-sm">
          <p>{messages.drive.approved}</p>
          <p className="mt-1">{profile.vehicleColor} {profile.vehicleMake} {profile.vehicleModel} · {profile.plateNumber}</p>
          <Button type="button" className="mt-3 h-10" onClick={() => navigate("/rides/new")}>{messages.nav.post}</Button>
        </div>
      )}
      {profile?.status === "rejected" && (
        <p className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive">
          {messages.drive.rejected} {profile.rejectionReason}
        </p>
      )}
      {user.isDriver && profile?.status !== "approved" && profile?.status !== "pending" && (
        <form
          className="grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            setError(run((current) => submitDriverProfile(current, user.id, {
              vehicleMake: make,
              vehicleModel: model,
              vehicleYear: Number(year),
              vehicleColor: color,
              plateNumber: plate,
              vehicleSeats: Number(seats),
              licenceNumber: licence,
            }, new Date())));
          }}
        >
          <label className="grid gap-1.5"><Label htmlFor="make">{messages.drive.make}</Label><Input id="make" className="h-11" value={make} onChange={(event) => setMake(event.target.value)} required /></label>
          <label className="grid gap-1.5"><Label htmlFor="model">{messages.drive.model}</Label><Input id="model" className="h-11" value={model} onChange={(event) => setModel(event.target.value)} required /></label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1.5"><Label htmlFor="year">{messages.drive.year}</Label><Input id="year" type="number" className="h-11" value={year} onChange={(event) => setYear(Number(event.target.value))} /></label>
            <label className="grid gap-1.5"><Label htmlFor="color">{messages.drive.color}</Label><Input id="color" className="h-11" value={color} onChange={(event) => setColor(event.target.value)} required /></label>
          </div>
          <label className="grid gap-1.5"><Label htmlFor="plate">{messages.drive.plate}</Label><Input id="plate" className="h-11" value={plate} onChange={(event) => setPlate(event.target.value)} required /></label>
          <label className="grid gap-1.5"><Label htmlFor="vseats">{messages.drive.seats}</Label><Input id="vseats" type="number" min={2} max={7} className="h-11" value={seats} onChange={(event) => setSeats(Number(event.target.value))} /></label>
          <label className="grid gap-1.5"><Label htmlFor="licence">{messages.drive.licence}</Label><Input id="licence" className="h-11" value={licence} onChange={(event) => setLicence(event.target.value)} required /></label>
          <ErrorNote code={error} />
          <Button type="submit" className="h-11">{profile?.status === "rejected" ? messages.drive.resubmit : messages.drive.submit}</Button>
        </form>
      )}
      {!user.isDriver && <p className="text-sm text-muted-foreground">{messages.drive.notDriver}</p>}
      <ErrorNote code={user.isDriver ? error : null} />
    </div>
  );
}
