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
  tokenPacks.mapPathfinderCategoriesToType(["angel", "divine"]),
  "Celestial",
  "Monster Core categories should map using the same PF type mappings even when the mapped category is not first",
);
assert.equal(
  tokenPacks.mapPathfinderCategoriesToType(["aquatic", "bestial"]),
  "Beast",
  "Monster Core reversed bestial categories should map to Beast",
);
assert.equal(
  tokenPacks.mapPathfinderCategoriesToType(["hag"]),
  "Fey",
  "Monster Core standalone hag category should map to Fey",
);
assert.equal(
  tokenPacks.mapPathfinderCategoriesToType(["ooze"]),
  "Ooze",
  "Monster Core standalone ooze category should map to Ooze",
);
assert.equal(
  tokenPacks.mapPathfinderCategoriesToType(["troll"]),
  "Giant",
  "Monster Core standalone troll category should map to Giant",
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

const inactiveGame = {
  modules: new Map([
    ["pf2e-tokens-bestiaries", { active: false }],
    ["pf2e-tokens-monster-core", { active: false }],
  ]),
};
const activeBestiariesGame = {
  modules: new Map([
    ["pf2e-tokens-bestiaries", { active: true }],
    ["pf2e-tokens-monster-core", { active: false }],
  ]),
};
const activeBothGame = {
  modules: new Map([
    ["pf2e-tokens-bestiaries", { active: true }],
    ["pf2e-tokens-monster-core", { active: true }],
  ]),
};
assert.equal(tokenPacks.isPathfinderTokensBestiariesAvailable(inactiveGame), false);
assert.equal(tokenPacks.isPathfinderTokensBestiariesAvailable(activeBestiariesGame), true);
assert.equal(tokenPacks.isPathfinderTokensMonsterCoreAvailable(inactiveGame), false);
assert.equal(tokenPacks.isPathfinderTokensMonsterCoreAvailable(activeBothGame), true);
assert.deepEqual(
  Object.keys(tokenPacks.getTokenSetChoices(inactiveGame)),
  ["Original_Tokens", "Cute_Tokens"],
  "PF packs should not be offered when modules are inactive",
);
assert.deepEqual(
  Object.keys(tokenPacks.getTokenSetChoices(activeBestiariesGame)),
  ["Original_Tokens", "Cute_Tokens", "pf2e-tokens-bestiaries"],
  "Bestiaries pack should be offered when that module is active",
);
assert.deepEqual(
  Object.keys(tokenPacks.getTokenSetChoices(activeBothGame)),
  ["Original_Tokens", "Cute_Tokens", "pf2e-tokens-bestiaries", "pf2e-tokens-monster-core"],
  "PF packs should be offered after built-in packs when active",
);

const disabledSettingsGame = {
  modules: activeBothGame.modules,
  settings: {
    get: (_namespace, key) => ({
      enablePathfinderTokensBestiaries: false,
      enablePathfinderTokensMonsterCore: false,
    }[key]),
  },
};
assert.deepEqual(
  Object.keys(tokenPacks.getTokenSetChoices(disabledSettingsGame)),
  ["Original_Tokens", "Cute_Tokens"],
  "PF packs should be disabled by their settings",
);
assert.deepEqual(
  Object.keys(tokenPacks.getTokenSetChoices(disabledSettingsGame, { respectSettings: false })),
  ["Original_Tokens", "Cute_Tokens", "pf2e-tokens-bestiaries", "pf2e-tokens-monster-core"],
  "defaultTokenSet registration can list active PF modules before the last toggle settings are registered",
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
const pfPack = tokenPacks.createPathfinderTokenPack(
  "pf2e-tokens-bestiaries",
  "Pathfinder Tokens: Bestiaries",
  sampleDatasheet,
);
assert.equal(pfPack.id, "pf2e-tokens-bestiaries");
assert.equal(pfPack.tokens.Celestial[0].file, sampleDatasheet[0].art.token);
assert.equal(pfPack.tokens.Celestial[0].subject, sampleDatasheet[0].art.subject);
assert.equal(pfPack.tokens.Dragon[0].file, sampleDatasheet[1].art.token);
assert.equal(pfPack.tokens.Dragon[0].scale, 1.5);

const monsterCorePack = tokenPacks.createPathfinderTokenPack(
  "pf2e-tokens-monster-core",
  "Pathfinder Tokens: Monster Core",
  [
    {
      label: "Arbiter",
      art: {
        token: "modules/pf2e-tokens-monster-core/assets/tokens/aeon-arbiter.webp",
        subject: "modules/pf2e-tokens-monster-core/assets/subjects/aeon-arbiter.webp",
        portrait: "modules/pf2e-tokens-monster-core/assets/portraits/aeon-arbiter.webp",
        scale: 2,
      },
      tags: { category: ["aeon", "planar"] },
    },
  ],
);
assert.equal(monsterCorePack.id, "pf2e-tokens-monster-core");
assert.equal(monsterCorePack.tokens.Celestial[0].scale, 2);
assert.equal(monsterCorePack.tokens.Celestial[0].file, "modules/pf2e-tokens-monster-core/assets/tokens/aeon-arbiter.webp");

assert.equal(
  tokenPacks.tokenImagePath("pf2e-tokens-monster-core", "modules/pf2e-tokens-monster-core/assets/tokens/aeon-arbiter.webp"),
  "modules/pf2e-tokens-monster-core/assets/tokens/aeon-arbiter.webp",
  "external Monster Core token paths should not be prefixed with Quick Creatures assets",
);

console.log("token pack tests passed");
