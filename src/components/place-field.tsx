import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { filterPlaces, type Place } from "@/maps/places";

export function PlaceField({
  id,
  label,
  value,
  onChange,
  emptyText,
}: {
  id: string;
  label: string;
  value: Place | null;
  onChange: (place: Place | null) => void;
  emptyText: string;
}) {
  const [text, setText] = useState(value?.label ?? "");
  const [open, setOpen] = useState(false);
  const results = filterPlaces(text);

  useEffect(() => {
    setText(value?.label ?? "");
  }, [value?.label]);

  return (
    <div className="relative grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={text}
        autoComplete="off"
        className="h-11 bg-card"
        onFocus={() => setOpen(true)}
        onBlur={() => {
          window.setTimeout(() => setOpen(false), 120);
        }}
        onChange={(event) => {
          setText(event.target.value);
          onChange(null);
          setOpen(true);
        }}
      />
      {open && (
        <ul className="absolute top-[calc(100%-0.25rem)] z-30 mt-2 max-h-56 w-full overflow-auto rounded-lg bg-card p-1 shadow-lg ring-1 ring-foreground/10">
          {results.length === 0 && <li className="px-2 py-2 text-sm text-muted-foreground">{emptyText}</li>}
          {results.map((place) => (
            <li key={place.id}>
              <button
                type="button"
                className="w-full rounded-md px-2 py-2 text-left text-sm hover:bg-muted"
                onMouseDown={(event) => {
                  event.preventDefault();
                  onChange(place);
                  setText(place.label);
                  setOpen(false);
                }}
              >
                {place.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
