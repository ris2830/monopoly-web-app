export const PLAYER_COLORS = ["#d62246", "#1f7a8c", "#f2a541", "#4b8f29", "#6d4cbb", "#111827"];

export const GROUPS = {
  brown: { label: "Braun", color: "#7a4a2d", houseCost: 50 },
  lightBlue: { label: "Hellblau", color: "#9bd3e8", houseCost: 50 },
  pink: { label: "Pink", color: "#d85aa0", houseCost: 100 },
  orange: { label: "Orange", color: "#f28c28", houseCost: 100 },
  red: { label: "Rot", color: "#d52b1e", houseCost: 150 },
  yellow: { label: "Gelb", color: "#f6d548", houseCost: 150 },
  green: { label: "Gruen", color: "#1f8d45", houseCost: 200 },
  darkBlue: { label: "Dunkelblau", color: "#2347a5", houseCost: 200 },
};

const street = (name, group, price, rents) => ({
  type: "property",
  name,
  group,
  price,
  rents,
  mortgage: Math.floor(price / 2),
  houseCost: GROUPS[group].houseCost,
});

const railroad = (name) => ({ type: "railroad", name, price: 200, mortgage: 100 });
const utility = (name) => ({ type: "utility", name, price: 150, mortgage: 75 });

export const BOARD = [
  { type: "go", name: "LOS" },
  street("Badstrasse", "brown", 60, [2, 10, 30, 90, 160, 250]),
  { type: "community", name: "Gemeinschaftsfeld" },
  street("Turmstrasse", "brown", 60, [4, 20, 60, 180, 320, 450]),
  { type: "tax", name: "Einkommensteuer", amount: 200 },
  railroad("Suedbahnhof"),
  street("Chausseestrasse", "lightBlue", 100, [6, 30, 90, 270, 400, 550]),
  { type: "chance", name: "Ereignisfeld" },
  street("Elisenstrasse", "lightBlue", 100, [6, 30, 90, 270, 400, 550]),
  street("Poststrasse", "lightBlue", 120, [8, 40, 100, 300, 450, 600]),
  { type: "jail", name: "Gefaengnis / Nur zu Besuch" },
  street("Seestrasse", "pink", 140, [10, 50, 150, 450, 625, 750]),
  utility("Elektrizitaetswerk"),
  street("Hafenstrasse", "pink", 140, [10, 50, 150, 450, 625, 750]),
  street("Neue Strasse", "pink", 160, [12, 60, 180, 500, 700, 900]),
  railroad("Westbahnhof"),
  street("Muenchner Strasse", "orange", 180, [14, 70, 200, 550, 750, 950]),
  { type: "community", name: "Gemeinschaftsfeld" },
  street("Wiener Strasse", "orange", 180, [14, 70, 200, 550, 750, 950]),
  street("Berliner Strasse", "orange", 200, [16, 80, 220, 600, 800, 1000]),
  { type: "freeParking", name: "Frei Parken" },
  street("Theaterstrasse", "red", 220, [18, 90, 250, 700, 875, 1050]),
  { type: "chance", name: "Ereignisfeld" },
  street("Museumstrasse", "red", 220, [18, 90, 250, 700, 875, 1050]),
  street("Opernplatz", "red", 240, [20, 100, 300, 750, 925, 1100]),
  railroad("Nordbahnhof"),
  street("Lessingstrasse", "yellow", 260, [22, 110, 330, 800, 975, 1150]),
  street("Schillerstrasse", "yellow", 260, [22, 110, 330, 800, 975, 1150]),
  utility("Wasserwerk"),
  street("Goethestrasse", "yellow", 280, [24, 120, 360, 850, 1025, 1200]),
  { type: "goToJail", name: "Gehe in das Gefaengnis" },
  street("Rathausplatz", "green", 300, [26, 130, 390, 900, 1100, 1275]),
  street("Hauptstrasse", "green", 300, [26, 130, 390, 900, 1100, 1275]),
  { type: "community", name: "Gemeinschaftsfeld" },
  street("Bahnhofstrasse", "green", 320, [28, 150, 450, 1000, 1200, 1400]),
  railroad("Hauptbahnhof"),
  { type: "chance", name: "Ereignisfeld" },
  street("Parkstrasse", "darkBlue", 350, [35, 175, 500, 1100, 1300, 1500]),
  { type: "tax", name: "Zusatzsteuer", amount: 100 },
  street("Schlossallee", "darkBlue", 400, [50, 200, 600, 1400, 1700, 2000]),
];

export const CHANCE_CARDS = [
  { text: "Ruecke vor bis LOS. Ziehe 200 M ein.", effect: { moveTo: 0, collectGo: true } },
  { text: "Ruecke vor bis zur Schlossallee.", effect: { moveTo: 39 } },
  { text: "Ruecke vor bis zur Seestrasse. Wenn du ueber LOS kommst, ziehe 200 M ein.", effect: { moveTo: 11, collectGo: true } },
  { text: "Ruecke vor bis zum naechsten Bahnhof. Zahle dort doppelte Miete, falls er jemandem gehoert.", effect: { nearest: "railroad", doubleRent: true } },
  { text: "Ruecke vor bis zum naechsten Versorgungswerk.", effect: { nearest: "utility" } },
  { text: "Die Bank zahlt dir eine Dividende von 50 M.", effect: { money: 50 } },
  { text: "Gehe drei Felder zurueck.", effect: { moveBy: -3 } },
  { text: "Gehe direkt in das Gefaengnis.", effect: { jail: true } },
  { text: "Strafe fuer zu schnelles Fahren: Zahle 15 M.", effect: { money: -15 } },
  { text: "Ruecke vor bis zum Hauptbahnhof.", effect: { moveTo: 35 } },
  { text: "Du bist zum Vorstand gewaehlt worden. Zahle jedem Spieler 50 M.", effect: { payEachPlayer: 50 } },
  { text: "Dein Bausparvertrag wird faellig. Ziehe 150 M ein.", effect: { money: 150 } },
];

export const COMMUNITY_CARDS = [
  { text: "Ruecke vor bis LOS. Ziehe 200 M ein.", effect: { moveTo: 0, collectGo: true } },
  { text: "Bankirrtum zu deinen Gunsten. Ziehe 200 M ein.", effect: { money: 200 } },
  { text: "Arztkosten. Zahle 50 M.", effect: { money: -50 } },
  { text: "Aus Aktienverkaeufen erhaeltst du 50 M.", effect: { money: 50 } },
  { text: "Gehe direkt in das Gefaengnis.", effect: { jail: true } },
  { text: "Opernabend. Ziehe von jedem Spieler 50 M ein.", effect: { collectEachPlayer: 50 } },
  { text: "Einkommensteuer-Rueckerstattung. Ziehe 20 M ein.", effect: { money: 20 } },
  { text: "Geburtstag. Jeder Spieler schenkt dir 10 M.", effect: { collectEachPlayer: 10 } },
  { text: "Lebensversicherung wird faellig. Ziehe 100 M ein.", effect: { money: 100 } },
  { text: "Krankenhausgebuehren. Zahle 100 M.", effect: { money: -100 } },
  { text: "Schulgebuehren. Zahle 50 M.", effect: { money: -50 } },
  { text: "Du erbst 100 M.", effect: { money: 100 } },
];
