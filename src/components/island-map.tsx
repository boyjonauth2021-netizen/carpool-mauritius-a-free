import type { LatLng } from "@/domain/geo";

const OUTLINE: Array<[number, number]> = [
  [57.57, -19.98],
  [57.66, -20.0],
  [57.75, -20.08],
  [57.8, -20.18],
  [57.79, -20.3],
  [57.74, -20.41],
  [57.67, -20.49],
  [57.55, -20.525],
  [57.42, -20.5],
  [57.33, -20.46],
  [57.3, -20.36],
  [57.32, -20.24],
  [57.37, -20.14],
  [57.47, -20.03],
];

function project(lat: number, lng: number): { x: number; y: number } {
  return {
    x: ((lng - 57.28) / (57.82 - 57.28)) * 200 + 20,
    y: ((-19.96 - lat) / (-19.96 - -20.55)) * 220 + 18,
  };
}

const CITIES: Array<{ label: string; lat: number; lng: number }> = [
  { label: "Port Louis", lat: -20.16, lng: 57.5 },
  { label: "Curepipe", lat: -20.32, lng: 57.53 },
  { label: "Grand Baie", lat: -20.01, lng: 57.58 },
  { label: "Mahébourg", lat: -20.41, lng: 57.7 },
  { label: "Flic en Flac", lat: -20.27, lng: 57.36 },
];

export function IslandMap({
  origin,
  destination,
  caption,
}: {
  origin?: LatLng | null;
  destination?: LatLng | null;
  caption: string;
}) {
  const points = OUTLINE.map(([lng, lat]) => {
    const p = project(lat, lng);
    return `${p.x},${p.y}`;
  }).join(" ");
  const pins = [origin, destination].filter((item): item is LatLng => Boolean(item));

  return (
    <figure className="rounded-2xl bg-[#0e3f3c] p-3 text-[#f6f1e7]">
      <svg viewBox="0 0 240 260" role="img" aria-label={caption} className="h-auto w-full">
        <polygon points={points} fill="#d7ebe4" stroke="#f6f1e7" strokeWidth="1.5" />
        {CITIES.map((city) => {
          const p = project(city.lat, city.lng);
          const flip = p.x > 150;
          return (
            <g key={city.label}>
              <circle cx={p.x} cy={p.y} r="2" fill="#0e3f3c" />
              <text
                x={flip ? p.x - 4 : p.x + 4}
                y={p.y - 4}
                fontSize="8"
                textAnchor={flip ? "end" : "start"}
                fill="#14302c"
              >
                {city.label}
              </text>
            </g>
          );
        })}
        {pins.length === 2 && (
          <line
            x1={project(pins[0].lat, pins[0].lng).x}
            y1={project(pins[0].lat, pins[0].lng).y}
            x2={project(pins[1].lat, pins[1].lng).x}
            y2={project(pins[1].lat, pins[1].lng).y}
            stroke="#d4654a"
            strokeWidth="1.5"
            strokeDasharray="3 2"
          />
        )}
        {pins.map((pin, index) => {
          const p = project(pin.lat, pin.lng);
          return <circle key={index} cx={p.x} cy={p.y} r="4" fill={index === 0 ? "#0e6b66" : "#d4654a"} stroke="#fff" />;
        })}
      </svg>
      <figcaption className="px-1 pb-1 text-xs text-[#d7ebe4]">{caption}</figcaption>
    </figure>
  );
}
