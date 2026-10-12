import type { CategoryId, Place } from "@/types";
import { CATEGORIES } from "@/data/categories";

// Local search: typo-tolerant name matching plus a synonym layer so a query
// like "pizza" or "coffee" finds places by what they are, not just by name.

export interface Synonym { terms: string[]; category?: CategoryId; keywords: string[]; osm?: string[] }

// osm entries are Overpass tag filters used for live category search.
export const SYNONYMS: Synonym[] = [
  { terms: ["pizza", "pizzeria", "pizzas"], category: "food", keywords: ["pizza", "pizzer", "trancio"], osm: ['"cuisine"~"pizza"', '"amenity"="restaurant"]["cuisine"~"pizza"'] },
  { terms: ["coffee", "cafe", "café", "caffè", "caffe", "espresso", "cappuccino"], category: "cafes", keywords: ["coffee", "caff", "espresso", "bar"], osm: ['"amenity"="cafe"'] },
  { terms: ["study", "library", "libraries", "biblioteca", "coworking", "laptop"], category: "cafes", keywords: ["library", "biblioteca", "study", "coworking", "reading"], osm: ['"amenity"="library"', '"amenity"="coworking_space"', '"office"="coworking"'] },
  { terms: ["gelato", "ice cream", "icecream", "gelateria"], category: "food", keywords: ["gelat", "ice cream", "granita"], osm: ['"amenity"="ice_cream"', '"shop"="ice_cream"'] },
  { terms: ["pasta", "trattoria", "osteria", "risotto", "italian"], category: "food", keywords: ["trattoria", "osteria", "pasta", "risotto", "milanese", "cotoletta"], osm: ['"amenity"="restaurant"]["cuisine"~"italian|regional"'] },
  { terms: ["restaurant", "dinner", "lunch", "eat", "food", "ristorante"], category: "food", keywords: [], osm: ['"amenity"="restaurant"'] },
  { terms: ["sushi", "japanese", "ramen"], category: "food", keywords: ["sushi", "japanese", "ramen", "temaki"], osm: ['"cuisine"~"japanese|sushi|ramen"'] },
  { terms: ["chinese", "dumpling", "dumplings", "asian", "ravioli cinesi"], category: "food", keywords: ["dumpling", "chinese", "asian", "ravioleria"], osm: ['"cuisine"~"chinese|asian"'] },
  { terms: ["indian", "curry"], category: "food", keywords: ["indian", "curry"], osm: ['"cuisine"~"indian"'] },
  { terms: ["vegan", "vegetarian", "veggie"], category: "food", keywords: ["vegan", "vegetarian"], osm: ['"diet:vegan"="yes"', '"diet:vegetarian"="yes"', '"cuisine"~"vegan|vegetarian"'] },
  { terms: ["burger", "burgers", "hamburger"], category: "food", keywords: ["burger"], osm: ['"cuisine"~"burger"'] },
  { terms: ["kebab", "doner", "döner"], category: "food", keywords: ["kebab"], osm: ['"cuisine"~"kebab"'] },
  { terms: ["bakery", "bread", "pastry", "pasticceria", "brioche", "croissant", "panificio"], category: "cafes", keywords: ["bakery", "pastry", "pasticceria", "brioche", "bread", "panificio", "sourdough"], osm: ['"shop"="bakery"', '"shop"="pastry"'] },
  { terms: ["aperitivo", "bar", "cocktail", "cocktails", "drinks", "pub", "beer", "wine"], category: "food", keywords: ["aperitivo", "cocktail", "bar", "negroni", "wine", "drinks", "beer"], osm: ['"amenity"="bar"', '"amenity"="pub"'] },
  { terms: ["museum", "museums", "museo", "gallery", "art", "exhibition"], category: "culture", keywords: ["museum", "museo", "galler", "art", "exhibition", "pinacoteca"], osm: ['"tourism"="museum"', '"tourism"="gallery"'] },
  { terms: ["church", "churches", "chiesa", "basilica", "cathedral", "duomo"], category: "culture", keywords: ["church", "chiesa", "basilica", "cathedral", "duomo", "chapel"], osm: ['"amenity"="place_of_worship"'] },
  { terms: ["cinema", "movie", "movies", "film"], category: "culture", keywords: ["cinema", "film", "screen"], osm: ['"amenity"="cinema"'] },
  { terms: ["theatre", "theater", "teatro", "concert", "opera", "music"], category: "culture", keywords: ["theatre", "teatro", "concert", "opera", "music"], osm: ['"amenity"="theatre"'] },
  { terms: ["park", "parks", "parco", "garden", "giardini", "green", "picnic", "run", "running"], category: "outdoors", keywords: ["park", "parco", "garden", "giardin", "lawn", "green"], osm: ['"leisure"="park"', '"leisure"="garden"'] },
  { terms: ["swim", "swimming", "pool", "piscina", "beach", "lido", "lake"], category: "outdoors", keywords: ["pool", "swim", "beach", "lido", "lake", "piscina"], osm: ['"leisure"="swimming_pool"', '"natural"="beach"'] },
  { terms: ["gym", "fitness", "yoga", "sport"], category: "outdoors", keywords: ["gym", "fitness", "yoga", "sport"], osm: ['"leisure"="fitness_centre"', '"leisure"="sports_centre"'] },
  { terms: ["supermarket", "grocery", "groceries", "supermercato", "shop food", "esselunga", "lidl", "carrefour", "conad"], category: "shopping", keywords: ["supermarket", "grocery", "esselunga", "lidl", "carrefour", "conad", "market"], osm: ['"shop"="supermarket"', '"shop"="convenience"'] },
  { terms: ["market", "mercato", "flea", "vintage", "second hand", "thrift"], category: "shopping", keywords: ["market", "mercato", "vintage", "flea", "stall"], osm: ['"amenity"="marketplace"', '"shop"="second_hand"'] },
  { terms: ["book", "books", "bookshop", "bookstore", "libreria"], category: "shopping", keywords: ["book", "libreria"], osm: ['"shop"="books"'] },
  { terms: ["clothes", "clothing", "fashion", "shopping", "mall"], category: "shopping", keywords: ["clothes", "fashion", "shopping", "boutique", "outlet"], osm: ['"shop"="clothes"', '"shop"="mall"'] },
  { terms: ["pharmacy", "farmacia", "chemist", "medicine"], category: "essentials", keywords: ["pharmac", "farmacia"], osm: ['"amenity"="pharmacy"'] },
  { terms: ["hospital", "doctor", "emergency", "ospedale", "pronto soccorso"], category: "essentials", keywords: ["hospital", "ospedale", "emergency", "pronto soccorso", "policlinico"], osm: ['"amenity"="hospital"', '"amenity"="clinic"'] },
  { terms: ["laundry", "laundromat", "lavanderia", "washing"], category: "essentials", keywords: ["laundr", "lavanderia"], osm: ['"shop"="laundry"'] },
  { terms: ["post", "post office", "poste", "parcel"], category: "essentials", keywords: ["post", "poste"], osm: ['"amenity"="post_office"'] },
  { terms: ["atm", "bank", "cash", "bancomat"], category: "essentials", keywords: ["atm", "bank"], osm: ['"amenity"="atm"', '"amenity"="bank"'] },
  { terms: ["metro", "station", "train", "tram", "bus", "stazione"], category: "essentials", keywords: ["metro", "station", "stazione", "train", "m1", "m3", "m4"], osm: ['"railway"="station"', '"station"="subway"'] },
  { terms: ["sim", "phone", "mobile"], category: "essentials", keywords: ["phone", "sim"], osm: ['"shop"="mobile_phone"'] },
  { terms: ["view", "rooftop", "sunset", "panorama", "terrace"], keywords: ["view", "rooftop", "sunset", "terrace", "spire", "skyline"], osm: ['"tourism"="viewpoint"'] },
  { terms: ["wine", "vineyard", "vineyards", "winery", "cantina", "franciacorta"], category: "trips", keywords: ["vineyard", "wine", "cellar", "franciacorta", "oltrep"], osm: ['"craft"="winery"'] },
  { terms: ["day trip", "trip", "lake", "lago", "como", "garda", "beach"], category: "trips", keywords: ["lake", "lago", "beach", "ferry", "train from"], osm: [] },
  { terms: ["spa", "terme", "sauna", "massage"], category: "gems", keywords: ["spa", "terme", "sauna"], osm: ['"amenity"="spa"', '"leisure"="sauna"'] },
  { terms: ["cheap", "budget", "student"], keywords: ["cheap", "student", "affordable", "fair price"], osm: [] },
  { terms: ["date", "romantic"], keywords: ["date", "romantic", "sunset"], osm: [] },
  { terms: ["quiet", "calm", "peaceful"], keywords: ["quiet", "calm", "peaceful", "silent"], osm: [] },
];

export function normalize(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
}

export function matchSynonyms(query: string): Synonym[] {
  const q = normalize(query);
  if (!q) return [];
  const words = q.split(" ");
  const termHit = (t: string) => {
    const nt = normalize(t);
    if (q === nt) return true;
    if (nt.includes(" ")) return q.includes(nt);
    // whole-word match, prefix while typing, or one typo on longer words
    return words.some((w) => w === nt || (w.length >= 3 && nt.startsWith(w)) || (w.length >= 5 && nt.length >= 5 && lev(w, nt) <= 1));
  };
  return SYNONYMS.filter((s) => s.terms.some(termHit));
}

// Damerau-free Levenshtein, enough for one or two typos in a name.
function lev(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (!m) return n; if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[n];
}

function fuzzyWordHit(qWord: string, text: string): boolean {
  if (qWord.length < 3) return text.includes(qWord);
  if (text.includes(qWord)) return true;
  const tol = qWord.length <= 5 ? 1 : 2;
  return text.split(" ").some((w) => w.length >= 3 && (w.startsWith(qWord) || lev(qWord, w.slice(0, qWord.length + tol)) <= tol));
}

export interface Scored { place: Place; score: number }

export function scoreLocal(query: string, places: Place[]): Scored[] {
  const q = normalize(query);
  if (!q) return [];
  const words = q.split(" ").filter(Boolean);
  const syns = matchSynonyms(query);
  const synCats = new Set(syns.map((s) => s.category).filter(Boolean) as CategoryId[]);
  const synKeys = syns.flatMap((s) => s.keywords.map(normalize));
  const catLabelHits = CATEGORIES.filter((c) => fuzzyWordHit(q, normalize(c.label))).map((c) => c.id);

  const out: Scored[] = [];
  for (const p of places) {
    const name = normalize(p.name);
    const desc = normalize(p.shortDescription ?? "");
    const tags = (p.tags ?? []).map(normalize).join(" ");
    const hood = normalize(`${p.neighbourhood ?? ""} ${p.address ?? ""}`);
    let score = 0;
    if (name === q) score += 100;
    else if (name.startsWith(q)) score += 80;
    else if (name.includes(q)) score += 60;
    else if (words.every((w) => fuzzyWordHit(w, name))) score += 45;
    if (synKeys.some((k) => name.includes(k))) score += 55;
    else if (synKeys.some((k) => desc.includes(k) || tags.includes(k))) score += 40;
    if (synCats.has(p.category)) score += 20;
    if (catLabelHits.includes(p.category)) score += 30;
    if (words.some((w) => w.length >= 3 && (tags.includes(w) || desc.includes(w)))) score += 15;
    else if (words.some((w) => w.length >= 5 && fuzzyWordHit(w, desc))) score += 10;
    if (words.some((w) => w.length >= 3 && hood.includes(w))) score += 12;
    if (score > 0) out.push({ place: p, score });
  }
  return out.sort((a, b) => b.score - a.score);
}
