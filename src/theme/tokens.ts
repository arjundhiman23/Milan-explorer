// Milan Explorer design tokens
// Concept: a premium, cinematic travel guide laid over a quiet map.
// Palette draws on the city itself: ink of a well-thumbed guidebook,
// saffron of risotto alla milanese, verdigris of Navigli water,
// Candoglia marble of the Duomo for surfaces.

export const colors = {
  ink: "#14181C",
  inkSoft: "#2A3138",
  inkMuted: "#6B737B",
  inkFaint: "#A6ADB4",
  marble: "#F7F4EE",
  marbleDeep: "#EDE8DF",
  line: "#E1DCD2",
  white: "#FFFFFF",
  saffron: "#D99A2B",
  saffronDeep: "#B47C15",
  saffronSoft: "#F6E7C4",
  verdigris: "#2F8F86",
  verdigrisSoft: "#D5ECE9",
  rosso: "#B6453B",
  rossoSoft: "#F3DAD7",
  slate: "#4A6B8A",
  slateSoft: "#DCE6EF",
  overlay: "rgba(20,24,28,0.55)",
};

export const categoryColors: Record<string, string> = {
  cafes: "#8A5A2B",
  food: "#C7542F",
  culture: "#6C4FA1",
  outdoors: "#3E8A4F",
  shopping: "#B8742A",
  essentials: "#4A6B8A",
  gems: "#D99A2B",
  trips: "#2F6F9F",
};

export const verdictColors = {
  want: colors.saffron,
  again: colors.verdigris,
  once: colors.slate,
  never: colors.rosso,
} as const;

export const fonts = {
  display: "Fraunces_600SemiBold",
  displayItalic: "Fraunces_500Medium_Italic",
  body: "InstrumentSans_400Regular",
  bodyMedium: "InstrumentSans_500Medium",
  bodySemi: "InstrumentSans_600SemiBold",
};

export const type = {
  hero: { fontFamily: fonts.display, fontSize: 40, lineHeight: 44, letterSpacing: -0.8 },
  title: { fontFamily: fonts.display, fontSize: 28, lineHeight: 32, letterSpacing: -0.5 },
  heading: { fontFamily: fonts.display, fontSize: 22, lineHeight: 26, letterSpacing: -0.3 },
  cardTitle: { fontFamily: fonts.display, fontSize: 18, lineHeight: 22, letterSpacing: -0.2 },
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22 },
  bodyMedium: { fontFamily: fonts.bodyMedium, fontSize: 15, lineHeight: 22 },
  small: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18 },
  smallMedium: { fontFamily: fonts.bodyMedium, fontSize: 13, lineHeight: 18 },
  label: { fontFamily: fonts.bodySemi, fontSize: 12, lineHeight: 16 },
};

export const radius = { sm: 10, md: 16, lg: 22, xl: 28, pill: 999 };
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

export const shadow = {
  card: {
    shadowColor: "#14181C",
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  float: {
    shadowColor: "#14181C",
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
};

export const MAP_STYLE_URL = "https://tiles.openfreemap.org/styles/positron";
