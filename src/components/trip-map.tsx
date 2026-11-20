import { useEffect, useRef, useState } from "react";
import type { LatLng } from "@/domain/geo";
import { browserMapsKey } from "@/maps/google-key";
import { IslandMap } from "./island-map";

type GoogleLike = {
  maps: {
    Map: new (el: HTMLElement, opts: object) => unknown;
    Marker: new (opts: object) => unknown;
    DirectionsService: new () => {
      route: (req: object, cb: (result: object | null, status: string) => void) => void;
    };
    DirectionsRenderer: new (opts: object) => unknown;
    TravelMode: { DRIVING: string };
  };
};

function loadGoogle(key: string): Promise<GoogleLike> {
  const existing = (window as unknown as { google?: GoogleLike }).google;
  if (existing?.maps) return Promise.resolve(existing);
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}`;
    script.async = true;
    script.onload = () => {
      const google = (window as unknown as { google?: GoogleLike }).google;
      if (google?.maps) resolve(google);
      else reject(new Error("maps"));
    };
    script.onerror = () => reject(new Error("maps"));
    document.head.appendChild(script);
  });
}

export function TripMap({
  origin,
  destination,
  caption,
}: {
  origin?: LatLng | null;
  destination?: LatLng | null;
  caption: string;
}) {
  const key = browserMapsKey();
  const ref = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!key || !origin || !destination || !ref.current) return;
    let cancelled = false;
    loadGoogle(key)
      .then((google) => {
        if (cancelled || !ref.current) return;
        const map = new google.maps.Map(ref.current, {
          center: origin,
          zoom: 10,
          mapTypeControl: false,
          streetViewControl: false,
        });
        const service = new google.maps.DirectionsService();
        service.route(
          { origin, destination, travelMode: google.maps.TravelMode.DRIVING, region: "mu" },
          (result, status) => {
            if (cancelled) return;
            if (status === "OK" && result) {
              new google.maps.DirectionsRenderer({ map, directions: result });
            } else {
              new google.maps.Marker({ map, position: origin });
              new google.maps.Marker({ map, position: destination });
            }
          },
        );
      })
      .catch(() => setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [key, origin, destination]);

  if (!key || failed || !origin || !destination) {
    return <IslandMap origin={origin} destination={destination} caption={caption} />;
  }

  return (
    <figure className="overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10">
      <div ref={ref} className="h-72 w-full" />
      <figcaption className="px-3 py-2 text-xs text-muted-foreground">{caption}</figcaption>
    </figure>
  );
}
