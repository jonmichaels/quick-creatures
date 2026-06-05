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
    ["pf2e-tokens-monster-core-2", { active: false }],
  ]),
};
const activeBestiariesGame = {
  modules: new Map([
    ["pf2e-tokens-bestiaries", { active: true }],
    ["pf2e-tokens-monster-core", { active: false }],
    ["pf2e-tokens-monster-core-2", { active: false }],
  ]),
};
const activeBothGame = {
  modules: new Map([
    ["pf2e-tokens-bestiaries", { active: true }],
    ["pf2e-tokens-monster-core", { active: true }],
    ["pf2e-tokens-monster-core-2", { active: false }],
  ]),
};
const activeAllPathfinderGame = {
  modules: new Map([
    ["pf2e-tokens-bestiaries", { active: true }],
    ["pf2e-tokens-monster-core", { active: true }],
    ["pf2e-tokens-monster-core-2", { active: true }],
  ]),
};
assert.equal(tokenPacks.isPathfinderTokensBestiariesAvailable(inactiveGame), false);
assert.equal(tokenPacks.isPathfinderTokensBestiariesAvailable(activeBestiariesGame), true);
assert.equal(tokenPacks.isPathfinderTokensMonsterCoreAvailable(inactiveGame), false);
assert.equal(tokenPacks.isPathfinderTokensMonsterCoreAvailable(activeBothGame), true);
assert.equal(tokenPacks.isPathfinderTokensMonsterCore2Available(inactiveGame), false);
assert.equal(tokenPacks.isPathfinderTokensMonsterCore2Available(activeAllPathfinderGame), true);
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
assert.deepEqual(
  Object.keys(tokenPacks.getTokenSetChoices(activeAllPathfinderGame)),
  ["Original_Tokens", "Cute_Tokens", "pf2e-tokens-bestiaries", "pf2e-tokens-monster-core", "pf2e-tokens-monster-core-2"],
  "Monster Core 2 should be offered after Bestiaries and Monster Core when active",
);

const disabledSettingsGame = {
  modules: activeAllPathfinderGame.modules,
  settings: {
    get: (_namespace, key) => ({
      enablePathfinderTokensBestiaries: false,
      enablePathfinderTokensMonsterCore: false,
      enablePathfinderTokensMonsterCore2: false,
    }[key]),
  },
};
assert.deepEqual(
  Object.keys(tokenPacks.getTokenSetChoices(disabledSettingsGame)),
  ["Original_Tokens", "Cute_Tokens"],
  "PF packs should be disabled by their settings",
);
assert.deepEqual(
  Object.keys(tokenPacks.getTokenSetChoices({ ...disabledSettingsGame, modules: activeAllPathfinderGame.modules }, { respectSettings: false })),
  ["Original_Tokens", "Cute_Tokens", "pf2e-tokens-bestiaries", "pf2e-tokens-monster-core", "pf2e-tokens-monster-core-2"],
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

const monsterCore2Pack = tokenPacks.createPathfinderTokenPack(
  "pf2e-tokens-monster-core-2",
  "Pathfinder Tokens: Monster Core 2",
  [
    {
      label: "Monster Core 2 Arbiter",
      art: {
        token: "modules/pf2e-tokens-monster-core-2/assets/tokens/monster-core-2-arbiter.webp",
        subject: "modules/pf2e-tokens-monster-core-2/assets/subjects/monster-core-2-arbiter.webp",
        portrait: "modules/pf2e-tokens-monster-core-2/assets/portraits/monster-core-2-arbiter.webp",
        scale: 1.25,
      },
      tags: { category: ["angel", "divine"] },
    },
  ],
);
assert.equal(monsterCore2Pack.id, "pf2e-tokens-monster-core-2");
assert.equal(monsterCore2Pack.tokens.Celestial[0].scale, 1.25);
assert.equal(monsterCore2Pack.tokens.Celestial[0].file, "modules/pf2e-tokens-monster-core-2/assets/tokens/monster-core-2-arbiter.webp");
assert.equal(
  tokenPacks.tokenImagePath("pf2e-tokens-monster-core-2", "modules/pf2e-tokens-monster-core-2/assets/tokens/monster-core-2-arbiter.webp"),
  "modules/pf2e-tokens-monster-core-2/assets/tokens/monster-core-2-arbiter.webp",
  "external Monster Core 2 token paths should not be prefixed with Quick Creatures assets",
);

const a5eBrowseResult = {
  target: "assets/quick-creatures-tokens",
  dirs: [
    "assets/quick-creatures-tokens/Monstrous_Menagerie_1_Tokens",
    "assets/quick-creatures-tokens/Monstrous_Menagerie_2_Tokens",
  ],
  files: [],
};
const a5eDescriptors = tokenPacks.createCustomTokenSetDescriptors(a5eBrowseResult, {
  customTokenDirectory: "Data/assets/quick-creatures-tokens/",
});
assert.deepEqual(
  a5eDescriptors.map(set => [set.id, set.name]),
  [
    ["a5e-monstrous-menagerie", "Monstrous Menagerie"],
    ["a5e-monstrous-menagerie-2", "Monstrous Menagerie 2"],
  ],
  "known A5E folder aliases should use canonical display names, not raw underscored folder names",
);
const a5eGame = {
  system: { id: "dnd5e" },
  systems: new Map([["a5e", {}]]),
  settings: { get: (_namespace, key) => ({
    enableOriginalTokens: false,
    enableCuteTokens: false,
    enableA5eSystemTokens: true,
    enableA5eMonstrousMenagerieTokens: true,
    enableA5eMonstrousMenagerie2Tokens: true,
  }[key]) },
};
assert.deepEqual(
  tokenPacks.getTokenSetChoices(a5eGame, { customSets: a5eDescriptors }),
  {
    "a5e-system": "A5E System",
    "a5e-monstrous-menagerie": "Monstrous Menagerie",
    "a5e-monstrous-menagerie-2": "Monstrous Menagerie 2",
  },
  "A5E token choices should include the checked system set and canonical MM names without custom duplicates",
);

const originalGame = globalThis.game;
const originalFetch = globalThis.fetch;
const originalFilePicker = globalThis.FilePicker;
const requestedPaths = [];
globalThis.game = activeAllPathfinderGame;
globalThis.fetch = async (url) => {
  requestedPaths.push(url);
  if (url === "modules/pf2e-tokens-monster-core-2/assets/datasheet/datasheet.json") {
    return { ok: true, json: async () => monsterCore2Pack.tokens.Celestial.map(entry => ({
      label: entry.name,
      art: { token: entry.file, subject: entry.subject, portrait: entry.portrait, scale: entry.scale },
      tags: { category: ["angel", "divine"] },
    })) };
  }
  return { ok: false, text: async () => "", json: async () => null };
};
const discovered = await tokenPacks.discoverPacks();
globalThis.fetch = originalFetch;
globalThis.game = originalGame;
assert.ok(
  requestedPaths.includes("modules/pf2e-tokens-monster-core-2/assets/datasheet/datasheet.json"),
  "discoverPacks should request the Monster Core 2 datasheet path",
);
assert.equal(
  discovered.find(pack => pack.id === "pf2e-tokens-monster-core-2")?.tokens.Celestial[0]?.scale,
  1.25,
  "discoverPacks should include Monster Core 2 with datasheet scale metadata",
);

const browseCalls = [];
globalThis.game = a5eGame;
globalThis.fetch = async () => ({ ok: false, text: async () => "", json: async () => null });
globalThis.FilePicker = {
  browse: async (_source, target) => {
    browseCalls.push(target);
    const normalizedTarget = target.replace(/\/$/, "");
    if (normalizedTarget === "assets/quick-creatures-tokens") return a5eBrowseResult;
    if (normalizedTarget === "assets/quick-creatures-tokens/Monstrous_Menagerie_1_Tokens") return {
      target,
      dirs: [],
      files: [`${normalizedTarget}/Aboleth.webp`],
    };
    if (normalizedTarget === "assets/quick-creatures-tokens/Monstrous_Menagerie_2_Tokens") return {
      target,
      dirs: [],
      files: [`${normalizedTarget}/MOME2_001_archlich.webp`],
    };
    if (normalizedTarget === "systems/a5e/assets") return {
      target,
      dirs: [],
      files: [`${normalizedTarget}/Aboleth.webp`],
    };
    return { target, dirs: [], files: [] };
  },
};
const a5eDiscovered = await tokenPacks.discoverPacks();
globalThis.FilePicker = originalFilePicker;
globalThis.fetch = originalFetch;
globalThis.game = originalGame;
assert.ok(browseCalls.map(path => path.replace(/\/$/, "")).includes("assets/quick-creatures-tokens/Monstrous_Menagerie_1_Tokens"));
assert.equal(
  a5eDiscovered.find(pack => pack.id === "a5e-monstrous-menagerie")?.tokens.Aberration.length,
  1,
  "discoverPacks should browse known A5E child folders so Monstrous Menagerie has tokens",
);
assert.equal(
  a5eDiscovered.find(pack => pack.id === "a5e-monstrous-menagerie-2")?.tokens.Beast.length,
  1,
  "discoverPacks should browse known A5E child folders so Monstrous Menagerie 2 has tokens",
);

console.log("token pack tests passed");
