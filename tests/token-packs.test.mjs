import assert from "node:assert/strict";
import path from "node:path";

async function loadTokenPacks() {
  const sourcePath = path.resolve("scripts/data/token-packs.js");
  return import(`file://${sourcePath}?t=${Date.now()}`);
}

const tokenPacks = await loadTokenPacks();

assert.equal(
  tokenPacks.mapPathfinderCategoriesToType(["aberrant", "monstrous"]),
  "Monstrosity",
  "aberrant/monstrous should map to Monstrosity",
);
assert.equal(
  tokenPacks.mapPathfinderCategoriesToType(["humanoid", "kobold"]),
  "Dragon",
  "humanoid/kobold should map to Dragon",
);
assert.equal(
  tokenPacks.mapPathfinderCategoriesToType(["humanoid", "orc"]),
  "Humanoid",
  "unmatched humanoid subfolders should map to Humanoid",
);
assert.equal(
  tokenPacks.mapPathfinderCategoriesToType(["planar", "petitioner"]),
  "Celestial",
  "planar folders should map to Celestial",
);

assert.equal(
  tokenPacks.tokenImagePath("Original_Tokens", "Beast/wolf.webp"),
  "modules/quick-creatures/assets/Original_Tokens/Beast/wolf.webp",
  "built-in packs should keep Quick Creatures asset paths",
);
assert.equal(
  tokenPacks.tokenImagePath("pf2e-tokens-bestiaries", "modules/pf2e-tokens-bestiaries/tokens/bestial/wolf.webp"),
  "modules/pf2e-tokens-bestiaries/tokens/bestial/wolf.webp",
  "external PF token paths should not be prefixed with Quick Creatures assets",
);

const inactiveGame = { modules: new Map([["pf2e-tokens-bestiaries", { active: false }]]) };
const activeGame = { modules: new Map([["pf2e-tokens-bestiaries", { active: true }]]) };
assert.equal(tokenPacks.isPathfinderTokensBestiariesAvailable(inactiveGame), false);
assert.equal(tokenPacks.isPathfinderTokensBestiariesAvailable(activeGame), true);
assert.deepEqual(
  Object.keys(tokenPacks.getTokenSetChoices(inactiveGame)),
  ["Original_Tokens", "Cute_Tokens"],
  "PF pack should not be offered when module is inactive",
);
assert.deepEqual(
  Object.keys(tokenPacks.getTokenSetChoices(activeGame)),
  ["Original_Tokens", "Cute_Tokens", "pf2e-tokens-bestiaries"],
  "PF pack should be offered when module is active",
);

const sampleDatasheet = [
  {
    label: "Caged Petitioner",
    art: {
      token: "modules/pf2e-tokens-bestiaries/tokens/planar/petitioner/caged.webp",
      subject: "modules/pf2e-tokens-bestiaries/subjects/planar/petitioner/caged.webp",
      portrait: "modules/pf2e-tokens-bestiaries/portraits/planar/petitioner/caged.webp",
    },
    tags: { category: ["planar", "petitioner"] },
  },
  {
    label: "Kobold Warrior",
    art: {
      token: "modules/pf2e-tokens-bestiaries/tokens/humanoid/kobold/warrior.webp",
      subject: "modules/pf2e-tokens-bestiaries/subjects/humanoid/kobold/warrior.webp",
      scale: 1.5,
    },
    tags: { category: ["humanoid", "kobold"] },
  },
];
const pfPack = tokenPacks.createPathfinderBestiariesPack(sampleDatasheet);
assert.equal(pfPack.id, "pf2e-tokens-bestiaries");
assert.equal(pfPack.tokens.Celestial[0].file, sampleDatasheet[0].art.token);
assert.equal(pfPack.tokens.Celestial[0].subject, sampleDatasheet[0].art.subject);
assert.equal(pfPack.tokens.Dragon[0].file, sampleDatasheet[1].art.token);
assert.equal(pfPack.tokens.Dragon[0].scale, 1.5);

console.log("token pack tests passed");
