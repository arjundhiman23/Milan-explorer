# Milan Explorer

A personal, animated map of places to discover, visit and remember — built from the PRD (Draft 1.0, 12 Oct 2026). Expo / React Native / TypeScript, one codebase for the web preview and the Android APK.

## Stack

| Layer | Choice |
|---|---|
| App | Expo SDK 57, Expo Router, TypeScript, Reanimated 4 |
| Map | MapLibre — `maplibre-gl` on web, `@maplibre/maplibre-react-native` on Android; OpenFreeMap "positron" tiles (no API key) |
| Live search | Photon for names + Overpass for categories ("pizza" → every pizzeria near the base); OpenStreetMap data, no API key |
| Local data | Zustand store persisted to AsyncStorage (local-first, works offline) |
| Account & backup | Supabase auth + Postgres + private storage bucket (`supabase/schema.sql`) |
| Navigation handoff | `geo:` intent on Android → Google Maps / any maps app; web falls back to Google Maps |

## Run the web preview

```bash
npm install            # also copies the map worker into public/
cp .env.example .env   # add your Supabase URL + anon key (optional — app runs local-only without them)
npm run web            # opens http://localhost:8081
```

Open DevTools and toggle the device toolbar to a phone size (e.g. 390 × 844). Use **Chrome**; it has the best MapLibre WebGL support.

Without Supabase keys, Settings shows "Cloud backup is off" and everything is saved in the browser / on the device. Reset the app by clearing site data (web) or clearing app storage (Android).

## Supabase setup (one time)

1. Create a project at supabase.com.
2. SQL editor → paste and run `supabase/schema.sql`. It creates `places`, `user_places`, `bases`, row-level security (each user sees only their own data) and a private `visit-photos` bucket.
3. Authentication → Providers → Email: enable. Optionally turn off "Confirm email" while testing.
4. Project Settings → API → copy the URL and anon key into `.env`.

Sync is local-first: every change is pushed ~1.5 s later when signed in; on sign-in the account's data is pulled and merged newest-wins. Deletions are tombstoned so they sync across devices.

## Database migrations

New projects: run `supabase/schema.sql` once. Existing projects: run each file in `supabase/migrations/` that you haven't run yet, in order, in the SQL editor.

- `002_base_tombstones.sql` — lets base deletions sync (adds `updated_at` / `deleted_at` to `bases`) and retires the Comasina default base. The app keeps working before it's run, using hard deletes as a fallback.

## Build the Android APK

**Cloud (recommended, no Android Studio needed):**

```bash
npm i -g eas-cli && eas login
eas build --platform android --profile preview
```

`eas.json` has a `preview` profile that produces a signed, installable `.apk`. Put the Supabase keys in that profile's `env` block (or in EAS secrets) so they're baked into the build. Share the download link with the user; she enables "Install unknown apps" for her browser and taps it.

**Local (needs Android SDK + JDK 17):**

```bash
npm run apk:local      # expo prebuild + gradlew assembleRelease
# → android/app/build/outputs/apk/release/app-release.apk
```

The native map module is not in Expo Go; use a development build (`eas build --profile development`) or the APK above to test on a phone.

## iOS (native app)

The same codebase builds for iOS; `@maplibre/maplibre-react-native` and every other module here support it. Two routes:

- **Simulator build (free, Mac only):** `eas build --platform ios --profile preview` produces a `.app` you drag into the iOS Simulator (needs Xcode installed).
- **Install on a real iPhone:** requires an Apple Developer account (US$99/yr). `eas build --platform ios --profile production`, then install via TestFlight, or `eas build --profile development` + `eas device:create` for ad-hoc installs. EAS manages the certificates and provisioning profiles for you.

Without a Mac, the simulator route isn't available but the TestFlight route still works entirely through EAS cloud builds.

## Project layout

```
app/                 Expo Router screens
  (tabs)/            index (Explore map) · discover · places (My Places) · settings
  onboarding.tsx     welcome → choose base → location consent
  auth.tsx           sign in / sign up / reset
  search.tsx         local + OpenStreetMap search
  place/[id].tsx     place details, verdict, notes, directions
  review/[id].tsx    visit log: stars, verdict, date, note, tags, photos
  bases.tsx          manage home/base locations
src/
  components/map/    ExploreMap.web.tsx · ExploreMap.native.tsx · MarkerPin.tsx
  data/              places.seed.ts (curated ~55 places) · categories.ts · bases.ts
  store/useStore.ts  state + persistence + selectors
  lib/               supabase · sync · photon · photos · export · navigation · geo
  theme/tokens.ts    palette, type scale, map style URL
supabase/schema.sql  tables, RLS policies, storage bucket
```

## Curated places

`src/data/places.seed.ts` + `places.seed.extra.ts` are the hand-picked layer: ~165 places across eight categories — cafés and libraries around Via Festa del Perdono and Via Conservatorio, groceries and transit, museums, parks and lidos, markets, and a Day trips category for the lakes, beaches and vineyards outside the city. Coordinates are approximate and opening hours are deliberately omitted — the app never claims a place is open. Edit the file freely; the seed is merged into the store on every launch, so edits appear after a restart without losing the user's own data.

## Privacy (as shipped)

- Location: foreground only, requested on tap of the locate button. `ACCESS_BACKGROUND_LOCATION` is explicitly blocked in `app.json`.
- Photos: the picker opens only from the "Add" button on the review sheet. Uploaded to a private bucket under `<user_id>/…`; served via short-lived signed URLs.
- Third parties see only what they must: OpenFreeMap sees tile requests, Photon sees search text. No analytics.

## Attribution

Map © [OpenFreeMap](https://openfreemap.org) · Data © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright) · Search by [Photon](https://photon.komoot.io).
