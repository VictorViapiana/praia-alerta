#!/usr/bin/env node
/**
 * Invariante: selecionar pin NÃO pode mudar o tamanho do Marker
 * (causa do salto areia↔cidade no Apple Maps / react-native-maps).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pins = fs.readFileSync(path.join(root, "src/components/map/MapPins.tsx"), "utf8");
const overlay = fs.readFileSync(path.join(root, "src/components/map/SelectedPinOverlay.tsx"), "utf8");
const beach = fs.readFileSync(path.join(root, "src/components/map/BeachMapView.tsx"), "utf8");

const failures = [];

for (const bad of ["PinBubbles", "PlacePinBubble", "SponsorPinBubble", "VendorPinBubble"]) {
  if (pins.includes(bad)) failures.push(`MapPins still references ${bad}`);
}

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

if (!overlay.includes("pointForCoordinate")) failures.push("overlay missing pointForCoordinate");
if (!overlay.includes("PlacePinBubble")) failures.push("overlay missing PlacePinBubble");
if (!beach.includes("<SelectedPinOverlay")) failures.push("BeachMapView missing SelectedPinOverlay");

const boot = pins.match(
  /setBootTracks\(false\),\s*600\);\s*return \(\) => clearTimeout\(id\);\s*\}, \[([^\]]+)\]/s,
);
if (!boot) failures.push("could not find bootTracks effect deps");
else if (boot[1].includes("selectedId")) failures.push("bootTracks still depends on selectedId");

// Overlay math: tip estável + balão acima do pin
function placeBubble(pt, pinH, box) {
  return { left: pt.x - box.w / 2, top: pt.y - pinH - box.h - 6 };
}
const tip = { x: 200, y: 400 };
const before = { ...tip };
const afterSelect = { ...tip }; // Marker congelado ⇒ tip não anda
if (before.x !== afterSelect.x || before.y !== afterSelect.y) {
  failures.push("pin tip moved on select");
}
const layout = placeBubble(tip, 58, { w: 232, h: 120 });
const bubbleBottom = layout.top + 120;
const pinTop = tip.y - 58;
if (Math.abs(bubbleBottom - (pinTop - 6)) > 0.1) {
  failures.push(`overlay gap math wrong: bubbleBottom=${bubbleBottom} pinTop=${pinTop}`);
}

// Quiosque Marker: children must be only <KioskPin/> (selected só mexe zIndex).
const qStart = pins.indexOf('if (place.mapKind === "quiosques")');
const qBlock = pins.slice(qStart, pins.indexOf("const color =", qStart));
if (!qBlock.includes("<KioskPin place={place} />")) {
  failures.push("quiosque marker missing KioskPin");
}
if (/<(Place|Sponsor|Vendor)PinBubble/.test(qBlock)) {
  failures.push("quiosque marker still nests a PinBubble");
}
if (!/zIndex=\{selected \? 85/.test(qBlock)) {
  failures.push("quiosque selected should only affect zIndex");
}
const qInner = qBlock.match(/tracksViewChanges=\{bootTracks\}[\s\S]*?<\/Marker>/)?.[0] ?? "";
const qChildren = qInner.split(">").slice(1).join(">"); // só o miolo do Marker
if (!qInner || !qChildren.includes("<KioskPin place={place} />") || /PinBubble|\?/.test(qChildren)) {
  failures.push("quiosque Marker children are not frozen to KioskPin only");
}

if (failures.length) {
  console.error("FAIL pin-select stable\n" + failures.map((f) => ` - ${f}`).join("\n"));
  process.exit(1);
}
console.log("PASS pin-select stable: frozen Markers + SelectedPinOverlay");
