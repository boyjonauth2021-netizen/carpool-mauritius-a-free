export type Place = {
  id: string;
  label: string;
  lat: number;
  lng: number;
};

export const PLACES: Place[] = [
  { id: "port-louis", label: "Port Louis", lat: -20.1609, lng: 57.5012 },
  { id: "caudan", label: "Caudan, Port Louis", lat: -20.1615, lng: 57.4985 },
  { id: "ebene", label: "Ebène Cybercity", lat: -20.241, lng: 57.489 },
  { id: "rose-hill", label: "Rose Hill", lat: -20.243, lng: 57.472 },
  { id: "beau-bassin", label: "Beau Bassin", lat: -20.228, lng: 57.465 },
  { id: "quatre-bornes", label: "Quatre Bornes", lat: -20.265, lng: 57.479 },
  { id: "vacoas", label: "Vacoas", lat: -20.298, lng: 57.478 },
  { id: "phoenix", label: "Phoenix", lat: -20.289, lng: 57.508 },
  { id: "curepipe", label: "Curepipe", lat: -20.3167, lng: 57.5263 },
  { id: "floreal", label: "Floréal", lat: -20.326, lng: 57.521 },
  { id: "moka", label: "Moka", lat: -20.219, lng: 57.496 },
  { id: "saint-pierre", label: "Saint Pierre", lat: -20.217, lng: 57.524 },
  { id: "reduit", label: "Réduit", lat: -20.227, lng: 57.497 },
  { id: "bagatelle", label: "Bagatelle", lat: -20.231, lng: 57.496 },
  { id: "triolet", label: "Triolet", lat: -20.055, lng: 57.545 },
  { id: "pamplemousses", label: "Pamplemousses", lat: -20.106, lng: 57.57 },
  { id: "grand-baie", label: "Grand Baie", lat: -20.013, lng: 57.581 },
  { id: "pereybere", label: "Pereybère", lat: -19.995, lng: 57.583 },
  { id: "trou-aux-biches", label: "Trou aux Biches", lat: -20.034, lng: 57.547 },
  { id: "cap-malheureux", label: "Cap Malheureux", lat: -19.984, lng: 57.614 },
  { id: "goodlands", label: "Goodlands", lat: -20.035, lng: 57.643 },
  { id: "grand-gaube", label: "Grand Gaube", lat: -20.006, lng: 57.661 },
  { id: "riviere-du-rempart", label: "Rivière du Rempart", lat: -20.103, lng: 57.685 },
  { id: "centre-de-flacq", label: "Centre de Flacq", lat: -20.19, lng: 57.714 },
  { id: "bel-air", label: "Bel Air", lat: -20.258, lng: 57.755 },
  { id: "belle-mare", label: "Belle Mare", lat: -20.195, lng: 57.762 },
  { id: "palmar", label: "Palmar", lat: -20.21, lng: 57.77 },
  { id: "mahebourg", label: "Mahébourg", lat: -20.408, lng: 57.7 },
  { id: "blue-bay", label: "Blue Bay", lat: -20.443, lng: 57.713 },
  { id: "plaine-magnien", label: "Plaine Magnien", lat: -20.43, lng: 57.67 },
  { id: "rose-belle", label: "Rose Belle", lat: -20.4, lng: 57.597 },
  { id: "nouvelle-france", label: "Nouvelle France", lat: -20.37, lng: 57.561 },
  { id: "souillac", label: "Souillac", lat: -20.517, lng: 57.525 },
  { id: "chemin-grenier", label: "Chemin Grenier", lat: -20.487, lng: 57.466 },
  { id: "riviere-des-anguilles", label: "Rivière des Anguilles", lat: -20.485, lng: 57.55 },
  { id: "flic-en-flac", label: "Flic en Flac", lat: -20.274, lng: 57.363 },
  { id: "tamarin", label: "Tamarin", lat: -20.325, lng: 57.37 },
  { id: "bambous", label: "Bambous", lat: -20.256, lng: 57.406 },
  { id: "cascavelle", label: "Cascavelle", lat: -20.286, lng: 57.407 },
  { id: "albion", label: "Albion", lat: -20.212, lng: 57.404 },
  { id: "black-river", label: "Black River", lat: -20.36, lng: 57.428 },
  { id: "le-morne", label: "Le Morne", lat: -20.455, lng: 57.33 },
  { id: "la-gaulette", label: "La Gaulette", lat: -20.43, lng: 57.36 },
  { id: "chamarel", label: "Chamarel", lat: -20.426, lng: 57.391 },
  { id: "pointe-aux-piments", label: "Pointe aux Piments", lat: -20.063, lng: 57.513 },
  { id: "baie-du-tombeau", label: "Baie du Tombeau", lat: -20.12, lng: 57.508 },
  { id: "terre-rouge", label: "Terre Rouge", lat: -20.126, lng: 57.524 },
  { id: "pailles", label: "Pailles", lat: -20.192, lng: 57.488 },
  { id: "pointe-aux-sables", label: "Pointe aux Sables", lat: -20.17, lng: 57.45 },
];

export function fold(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

export function filterPlaces(query: string): Place[] {
  const folded = fold(query.trim());
  if (folded.length < 2) return PLACES.slice(0, 8);
  return PLACES.filter((place) => fold(place.label).includes(folded)).slice(0, 8);
}

export function placeByLabel(label: string): Place {
  const found = PLACES.find((place) => place.label === label);
  if (!found) throw new Error(`Missing place: ${label}`);
  return found;
}
