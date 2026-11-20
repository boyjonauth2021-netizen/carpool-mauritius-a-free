import { RideCard } from "@/components/ride-card";
import { SearchForm } from "@/components/search-form";
import { TripMap } from "@/components/trip-map";
import { useApp } from "@/data/context";
import { useI18n } from "@/i18n/context";
import { browserMapsKey } from "@/maps/google-key";

export function HomePage() {
  const { messages } = useI18n();
  const { state } = useApp();
  const now = Date.now();
  const open = state.rides
    .filter((ride) => ride.status === "open" && Date.parse(ride.departureAt) > now)
    .sort((a, b) => Date.parse(a.departureAt) - Date.parse(b.departureAt))
    .slice(0, 6);

  return (
    <div className="grid gap-12">
      <section className="grid items-start gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <p className="text-sm font-medium tracking-wide text-primary">{messages.home.eyebrow}</p>
          <h1 className="mt-2 max-w-xl font-heading text-4xl leading-[1.05] text-[#0e3f3c] md:text-6xl">
            {messages.home.title}
          </h1>
          <p className="mt-4 max-w-xl text-lg text-muted-foreground">{messages.home.lede}</p>
          <div className="mt-6">
            <SearchForm />
          </div>
        </div>
        <TripMap caption={browserMapsKey() ? messages.search.mapsOn : messages.search.mapsOff} />
      </section>
      <section className="grid gap-4 md:grid-cols-3">
        {messages.home.steps.map((step, index) => (
          <article key={step.title} className="rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
            <p className="font-heading text-3xl text-[#c6a15b]">0{index + 1}</p>
            <h2 className="mt-2 font-heading text-2xl">{step.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
          </article>
        ))}
      </section>
      <section className="rounded-2xl bg-[#f6f1e7] p-5 md:p-8">
        <h2 className="font-heading text-3xl">{messages.home.promiseTitle}</h2>
        <ul className="mt-4 grid gap-3 text-sm md:grid-cols-3">
          {messages.home.promises.map((item) => (
            <li key={item} className="rounded-xl bg-card/80 p-4">{item}</li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="font-heading text-3xl">{messages.home.openTitle}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{messages.home.sample}</p>
        {open.length === 0 ? (
          <p className="mt-4 text-muted-foreground">{messages.home.empty}</p>
        ) : (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {open.map((ride) => (
              <RideCard key={ride.id} ride={ride} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
