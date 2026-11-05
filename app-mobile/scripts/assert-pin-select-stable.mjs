#!/usr/bin/env node
/**
 * Invariante:
 * 1) Pin Marker nunca embute balão / nunca liga tracks no select
 * 2) Balão vive em SelectedPinBubbleMarker (Marker separado + spacer)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pins = fs.readFileSync(path.join(root, "src/components/map/MapPins.tsx"), "utf8");
const bubble = fs.readFileSync(
  path.join(root, "src/components/map/SelectedPinBubbleMarker.tsx"),
  "utf8",
);
const beach = fs.readFileSync(path.join(root, "src/components/map/BeachMapView.tsx"), "utf8");
const failures = [];

for (const bad of ["PinBubbles", "PlacePinBubble", "SponsorPinBubble", "VendorPinBubble"]) {
  if (pins.includes(bad)) failures.push(`MapPins still references ${bad}`);
}
if (fs.existsSync(path.join(root, "src/components/map/SelectedPinOverlay.tsx"))) {
  failures.push("SelectedPinOverlay.tsx must be removed (pointForCoordinate misaligned on iOS)");
}
if (beach.includes("SelectedPinOverlay") || beach.includes("pointForCoordinate")) {
  failures.push("BeachMapView must not use overlay/pointForCoordinate");
}
if (!beach.includes("<SelectedPinBubbleMarker")) {
  failures.push("BeachMapView missing SelectedPinBubbleMarker");
}
if (!bubble.includes("pinH") || !bubble.includes("height: target.pinH")) {
  failures.push("bubble marker missing pinH spacer");
}
if (!bubble.includes("PlacePinBubble")) failures.push("bubble marker missing PlacePinBubble");

const markerBlocks = pins.split("<Marker");
for (let i = 1; i < markerBlocks.length; i++) {
  const block = markerBlocks[i].split("</Marker>")[0];
  if (/<(Place|Sponsor|Vendor)PinBubble/.test(block)) {
    failures.push(`Marker #${i} still nests a PinBubble`);
  }
  const m = block.match(/tracksViewChanges=\{([^}]+)\}/);
  if (m && /selected/.test(m[1])) {
    failures.push(`Marker #${i} tracksViewChanges depends on selected: ${m[1]}`);
  }
}

const qStart = pins.indexOf('if (place.mapKind === "quiosques")');
const qBlock = pins.slice(qStart, pins.indexOf("const color =", qStart));
const qInner = qBlock.match(/tracksViewChanges=\{bootTracks\}[\s\S]*?<\/Marker>/)?.[0] ?? "";
const qChildren = qInner.split(">").slice(1).join(">");
if (!qInner || !qChildren.includes("<KioskPin place={place} />") || /PinBubble|\?/.test(qChildren)) {
  failures.push("quiosque Marker children are not frozen to KioskPin only");
}

// Spacer geometry: tip of bubble sits pinH+margin above latlng (= pin tip)
const pinH = 62;
const margin = 12;
const tipAboveLatLng = pinH + margin;
if (tipAboveLatLng < pinH) failures.push("bubble tip would overlap pin");

if (failures.length) {
  console.error("FAIL pin-select stable\n" + failures.map((f) => ` - ${f}`).join("\n"));
  process.exit(1);
}
console.log("PASS pin-select stable: frozen pin Marker + separate bubble Marker with spacer");
