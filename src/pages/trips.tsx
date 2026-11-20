import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { RideCard } from "@/components/ride-card";
import { markNotificationsRead } from "@/data/actions";
import { useApp } from "@/data/context";
import { useI18n } from "@/i18n/context";
import { fill } from "@/i18n/messages";
import { statusLabel } from "@/components/feedback";
import { navigate } from "@/router";

export function TripsPage() {
  const { messages } = useI18n();
  const { user, state, run } = useApp();
  if (!user) return <Button type="button" className="h-11" onClick={() => navigate("/login")}>{messages.nav.login}</Button>;
  const driving = state.rides.filter((ride) => ride.driverId === user.id);
  const ridingIds = new Set(state.requests.filter((request) => request.passengerId === user.id).map((request) => request.rideId));
  const riding = state.rides.filter((ride) => ridingIds.has(ride.id));
  const notes = state.notifications.filter((item) => item.userId === user.id);

  return (
    <div className="grid gap-4">
      <h1 className="font-heading text-4xl">{messages.trips.title}</h1>
      <Tabs defaultValue="driving">
        <TabsList>
          <TabsTrigger value="driving">{messages.trips.driving}</TabsTrigger>
          <TabsTrigger value="riding">{messages.trips.riding}</TabsTrigger>
          <TabsTrigger value="notes">{messages.trips.notesTab}</TabsTrigger>
        </TabsList>
        <TabsContent value="driving" className="grid gap-3 pt-4">
          {driving.length === 0 && <p className="text-sm text-muted-foreground">{messages.trips.emptyDriving}</p>}
          {driving.map((ride) => (
            <div key={ride.id} className="grid gap-1">
              <RideCard ride={ride} />
              <p className="text-xs text-muted-foreground">{statusLabel(messages, ride.status)}</p>
            </div>
          ))}
        </TabsContent>
        <TabsContent value="riding" className="grid gap-3 pt-4">
          {riding.length === 0 && <p className="text-sm text-muted-foreground">{messages.trips.emptyRiding}</p>}
          {riding.map((ride) => {
            const request = state.requests.find((item) => item.rideId === ride.id && item.passengerId === user.id);
            return (
              <div key={ride.id}>
                <RideCard ride={ride} />
                {request && <p className="mt-1 text-xs text-muted-foreground">{statusLabel(messages, request.status)}</p>}
              </div>
            );
          })}
        </TabsContent>
        <TabsContent value="notes" className="grid gap-3 pt-4">
          <Button type="button" variant="outline" className="h-9 w-fit" onClick={() => run((current) => markNotificationsRead(current, user.id, new Date()))}>
            {messages.trips.markRead}
          </Button>
          {notes.length === 0 && <p className="text-sm text-muted-foreground">{messages.trips.noNotes}</p>}
          {notes.map((note) => (
            <article key={note.id} className="rounded-xl bg-card p-3 text-sm ring-1 ring-foreground/10">
              <p>{fill(messages.notif[note.bodyKey as keyof typeof messages.notif] ?? note.bodyKey, note.params)}</p>
              <p className="mt-1 text-xs text-muted-foreground">{messages.trips.mail}</p>
            </article>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
