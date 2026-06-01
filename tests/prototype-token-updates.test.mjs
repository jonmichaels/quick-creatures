import assert from "node:assert/strict";
import path from "node:path";

globalThis.game = { system: { id: "dnd5e" } };

const sourcePath = path.resolve("scripts/app/quick-creatures-create.js");
const { buildPrototypeTokenUpdates } = await import(`file://${sourcePath}?t=${Date.now()}`);

const mediumUpdates = buildPrototypeTokenUpdates(
  "Medium",
  1.5,
  false,
  "modules/pf2e-tokens-bestiaries/tokens/bestial/angazhani.webp",
);

assert.equal(mediumUpdates["system.traits.size"], "med");
assert.equal(mediumUpdates["prototypeToken.width"], 1);
assert.equal(mediumUpdates["prototypeToken.height"], 1);
assert.equal(mediumUpdates["prototypeToken.texture.scaleX"], 1.5);
assert.equal(mediumUpdates["prototypeToken.texture.scaleY"], 1.5);
assert.equal(mediumUpdates["prototypeToken.ring.subject.scale"], undefined);

const largeRingUpdates = buildPrototypeTokenUpdates(
  "Large",
  1.5,
  true,
  "modules/pf2e-tokens-bestiaries/tokens/bestial/angazhani.webp",
  "modules/pf2e-tokens-bestiaries/subjects/bestial/angazhani.webp",
);

assert.equal(largeRingUpdates["prototypeToken.width"], 2);
assert.equal(largeRingUpdates["prototypeToken.height"], 2);
assert.equal(largeRingUpdates["prototypeToken.texture.scaleX"], 1.5);
assert.equal(largeRingUpdates["prototypeToken.texture.scaleY"], 1.5);
assert.equal(largeRingUpdates["prototypeToken.ring.enabled"], true);
assert.equal(
  largeRingUpdates["prototypeToken.ring.subject.texture"],
  "modules/pf2e-tokens-bestiaries/subjects/bestial/angazhani.webp",
);
assert.equal(largeRingUpdates["prototypeToken.ring.subject.scale"], 1.5);

const fallbackRingUpdates = buildPrototypeTokenUpdates(
  "Large",
  1.25,
  true,
  "modules/pf2e-tokens-bestiaries/tokens/bestial/fallback.webp",
  null,
);
assert.equal(
  fallbackRingUpdates["prototypeToken.ring.subject.texture"],
  "modules/pf2e-tokens-bestiaries/tokens/bestial/fallback.webp",
);
assert.equal(fallbackRingUpdates["prototypeToken.ring.subject.scale"], 1.25);

globalThis.game.system.id = "black-flag";
const blackFlagUpdates = buildPrototypeTokenUpdates(
  "Huge",
  0.8,
  false,
  "modules/pf2e-tokens-bestiaries/tokens/bestial/huge.webp",
);
assert.equal(blackFlagUpdates["system.traits.size"], "huge");
assert.equal(blackFlagUpdates["prototypeToken.width"], 3);
assert.equal(blackFlagUpdates["prototypeToken.height"], 3);
assert.equal(blackFlagUpdates["prototypeToken.texture.scaleX"], 0.8);
assert.equal(blackFlagUpdates["prototypeToken.texture.scaleY"], 0.8);

console.log("prototype token update tests passed");
