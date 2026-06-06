/**
 * Token pack discovery and manifest loading.
 *
 * Discovers token packs in assets/, loads tokens.yaml manifests,
 * and provides token file listings per creature type.
 */
import yaml from "js-yaml";
import A5E_TOKEN_MAP from "./a5e-token-map.json" with { type: "json" };

/** @type {string} Base path for module assets */
const MODULE_PATH = "modules/quick-creatures";

/**
 * Monster types in standard order.
 */
const TYPES = [
  "Aberration", "Beast", "Celestial", "Construct", "Dragon",
  "Elemental", "Fey", "Fiend", "Giant", "Humanoid",
  "Monstrosity", "Ooze", "Plant", "Undead",
];

const PF2E_TOKENS_BESTIARIES_ID = "pf2e-tokens-bestiaries";
const PF2E_TOKENS_MONSTER_CORE_ID = "pf2e-tokens-monster-core";
const PF2E_TOKENS_MONSTER_CORE_2_ID = "pf2e-tokens-monster-core-2";
const DND_MONSTER_MANUAL_ID = "dnd-monster-manual";
const TOV_MONSTER_VAULT_ID = "kp-tov-monster-vault";
const TOV_MONSTER_VAULT_2_ID = "kp-tov-monster-vault-2";

export const TOKEN_SET_CONFIG_SECTION_ORDER = ["defaults", "core", "dnd", "tov", "pathfinder", "a5e", "custom"];

const CORE_TOKEN_PACKS = {
  Original_Tokens: { id: "Original_Tokens", name: "Original Tokens", settingKey: "enableOriginalTokens" },
  Cute_Tokens: { id: "Cute_Tokens", name: "Cute Tokens", settingKey: "enableCuteTokens" },
};

export const A5E_TOKEN_PACKS = {
  "a5e-system": {
    id: "a5e-system",
    name: "A5E System",
    settingKey: "enableA5eSystemTokens",
    systemId: "a5e",
    dataPath: "Data/systems/a5e/assets/",
    mappingSource: "System",
  },
  "a5e-monstrous-menagerie": {
    id: "a5e-monstrous-menagerie",
    name: "Monstrous Menagerie",
    settingKey: "enableA5eMonstrousMenagerieTokens",
    folderAliases: ["Monstrous_Menagerie_1_Tokens", "Level_Up_Monstrous_Menagerie_VTT_Tokens_(A5E)", "MoMe Pawns"],
    mappingSource: "MM",
  },
  "a5e-monstrous-menagerie-2": {
    id: "a5e-monstrous-menagerie-2",
    name: "Monstrous Menagerie 2",
    settingKey: "enableA5eMonstrousMenagerie2Tokens",
    folderAliases: ["Monstrous_Menagerie_2_Tokens", "MM2 VTT tokens"],
    mappingSource: null,
  },
};

export const TOKEN_SET_GROUPS = [
  { id: "core", labelKey: "quick-creatures.tokenConfig.sections.core", packIds: ["Original_Tokens", "Cute_Tokens"] },
  { id: "dnd", labelKey: "quick-creatures.tokenConfig.sections.dnd", packIds: [DND_MONSTER_MANUAL_ID] },
  { id: "tov", labelKey: "quick-creatures.tokenConfig.sections.tov", packIds: [TOV_MONSTER_VAULT_ID, TOV_MONSTER_VAULT_2_ID] },
  { id: "pathfinder", labelKey: "quick-creatures.tokenConfig.sections.pathfinder", packIds: [PF2E_TOKENS_BESTIARIES_ID, PF2E_TOKENS_MONSTER_CORE_ID, PF2E_TOKENS_MONSTER_CORE_2_ID] },
  { id: "a5e", labelKey: "quick-creatures.tokenConfig.sections.a5e", packIds: ["a5e-system", "a5e-monstrous-menagerie", "a5e-monstrous-menagerie-2"] },
];


const DND_TOKEN_PACKS = {
  [DND_MONSTER_MANUAL_ID]: {
    id: DND_MONSTER_MANUAL_ID,
    name: "Monster Manual",
    description: "Artwork from the D&D Monster Manual module.",
    settingKey: "enableDndMonsterManualTokens",
    datasheet: `${MODULE_PATH}/scripts/data/token-datasheets/dnd-monster-manual.json`,
  },
};

const TOV_TOKEN_PACKS = {
  [TOV_MONSTER_VAULT_ID]: {
    id: TOV_MONSTER_VAULT_ID,
    name: "Monster Vault",
    description: "Artwork from the Tales of the Valiant Monster Vault module.",
    settingKey: "enableTovMonsterVaultTokens",
    datasheet: `${MODULE_PATH}/scripts/data/token-datasheets/kp-tov-monster-vault.json`,
  },
  [TOV_MONSTER_VAULT_2_ID]: {
    id: TOV_MONSTER_VAULT_2_ID,
    name: "Monster Vault 2",
    description: "Artwork from the Tales of the Valiant Monster Vault 2 module.",
    settingKey: "enableTovMonsterVault2Tokens",
    datasheet: `${MODULE_PATH}/scripts/data/token-datasheets/kp-tov-monster-vault-2.json`,
  },
};

const PATHFINDER_TOKEN_PACKS = {
  [PF2E_TOKENS_BESTIARIES_ID]: {
    id: PF2E_TOKENS_BESTIARIES_ID,
    name: "Pathfinder Tokens: Bestiaries",
    description: "Artwork from the Pathfinder Tokens: Bestiaries module.",
    settingKey: "enablePathfinderTokensBestiaries",
    datasheet: `modules/${PF2E_TOKENS_BESTIARIES_ID}/datasheet-bestiaries.json`,
  },
  [PF2E_TOKENS_MONSTER_CORE_ID]: {
    id: PF2E_TOKENS_MONSTER_CORE_ID,
    name: "Pathfinder Tokens: Monster Core",
    description: "Artwork from the Pathfinder Tokens: Monster Core module.",
    settingKey: "enablePathfinderTokensMonsterCore",
    datasheet: `modules/${PF2E_TOKENS_MONSTER_CORE_ID}/assets/datasheet/datasheet.json`,
  },
  [PF2E_TOKENS_MONSTER_CORE_2_ID]: {
    id: PF2E_TOKENS_MONSTER_CORE_2_ID,
    name: "Pathfinder Tokens: Monster Core 2",
    description: "Artwork from the Pathfinder Tokens: Monster Core 2 module.",
    settingKey: "enablePathfinderTokensMonsterCore2",
    datasheet: `modules/${PF2E_TOKENS_MONSTER_CORE_2_ID}/assets/datasheet/datasheet.json`,
  },
};

/**
 * Embedded token file listings per pack.
 * Original_Tokens: one .webp per type folder, file = type.toLowerCase().
 * Cute_Tokens: full listing from filesystem scan.
 */
const EMBEDDED_TOKENS = {
  Original_Tokens: (() => {
    const out = {};
    for (const type of TYPES) {
      const name = type.toLowerCase();
      out[type] = [{ file: `${type}/${name}.webp`, name: type }];
    }
    return out;
  })(),

  Cute_Tokens: {
    Aberration: [
      { file: "Aberration/monster_chaosspawn.webp", name: "Chaos Spawn" },
      { file: "Aberration/monster_deepspawn.webp", name: "Deep Spawn" },
    ],
    Beast: [
      { file: "Beast/monster_giantspider.webp", name: "Giant Spider" },
    ],
    Celestial: [
      { file: "Celestial/boss_theinevitable.webp", name: "The Inevitable" },
      { file: "Celestial/boss_voidelemental.webp", name: "Void Elemental" },
      { file: "Celestial/monster_planaradept.webp", name: "Planar Adept" },
      { file: "Celestial/monster_starelemental.webp", name: "Star Elemental" },
    ],
    Construct: [
      { file: "Construct/monster_crystalgolem.webp", name: "Crystal Golem" },
      { file: "Construct/monster_sanctumguardian.webp", name: "Sanctum Guardian" },
    ],
    Dragon: [
      { file: "Dragon/boss_cinderdragon.webp", name: "Cinder Dragon" },
      { file: "Dragon/monster_dragonwhelp.webp", name: "Dragon Whelp" },
      { file: "Dragon/monster_drake.webp", name: "Drake" },
    ],
    Elemental: [
      { file: "Elemental/monster_airelemental.webp", name: "Air Elemental" },
      { file: "Elemental/monster_earthelemental.webp", name: "Earth Elemental" },
      { file: "Elemental/monster_fireelemental.webp", name: "Fire Elemental" },
      { file: "Elemental/monster_waterelemental.webp", name: "Water Elemental" },
    ],
    Fey: [
      { file: "Fey/boss_defiledspriggan.webp", name: "Defiled Spriggan" },
      { file: "Fey/boss_hagmatriarch.webp", name: "Hag Matriarch" },
      { file: "Fey/boss_witchking.webp", name: "Witch King" },
      { file: "Fey/monster_hag.webp", name: "Hag" },
    ],
    Fiend: [
      { file: "Fiend/monster_abyssal.webp", name: "Abyssal" },
      { file: "Fiend/monster_devilkin.webp", name: "Devilkin" },
      { file: "Fiend/monster_hellion.webp", name: "Hellion" },
      { file: "Fiend/monster_hellionminstrel.webp", name: "Hellion Minstrel" },
      { file: "Fiend/monster_heresiarch.webp", name: "Heresiarch" },
      { file: "Fiend/monster_imp.webp", name: "Imp" },
    ],
    Giant: [
      { file: "Giant/monster_giant.webp", name: "Giant" },
      { file: "Giant/monster_skygiant.webp", name: "Sky Giant" },
    ],
    Humanoid: [
      { file: "Humanoid/boss_goblinbigboss.webp", name: "Goblin Big Boss" },
      { file: "Humanoid/hero_artificer.webp", name: "Artificer" },
      { file: "Humanoid/hero_assassin.webp", name: "Assassin" },
      { file: "Humanoid/hero_barbarian.webp", name: "Barbarian" },
      { file: "Humanoid/hero_bard.webp", name: "Bard" },
      { file: "Humanoid/hero_cleric.webp", name: "Cleric" },
      { file: "Humanoid/hero_dogkinhunter.webp", name: "Dogkin Hunter" },
      { file: "Humanoid/hero_druid.webp", name: "Druid" },
      { file: "Humanoid/hero_gunner.webp", name: "Gunner" },
      { file: "Humanoid/hero_monk.webp", name: "Monk" },
      { file: "Humanoid/hero_paladin.webp", name: "Paladin" },
      { file: "Humanoid/hero_ranger.webp", name: "Ranger" },
      { file: "Humanoid/hero_rogue.webp", name: "Rogue" },
      { file: "Humanoid/hero_warlock.webp", name: "Warlock" },
      { file: "Humanoid/hero_warlord.webp", name: "Warlord" },
      { file: "Humanoid/hero_warrior.webp", name: "Warrior" },
      { file: "Humanoid/hero_wizard.webp", name: "Wizard" },
      { file: "Humanoid/monster_cabalistnun.webp", name: "Cabalist Nun" },
      { file: "Humanoid/monster_catkinwarlock.webp", name: "Catkin Warlock" },
      { file: "Humanoid/monster_darkapprentice.webp", name: "Dark Apprentice" },
      { file: "Humanoid/monster_deepelf.webp", name: "Deep Elf" },
      { file: "Humanoid/monster_deepelfassassin.webp", name: "Deep Elf Assassin" },
      { file: "Humanoid/monster_deepelfwizard.webp", name: "Deep Elf Wizard" },
      { file: "Humanoid/monster_deepranger.webp", name: "Deep Ranger" },
      { file: "Humanoid/monster_dragonkinevoker.webp", name: "Dragonkin Evoker" },
      { file: "Humanoid/monster_dragonkinknight.webp", name: "Dragonkin Knight" },
      { file: "Humanoid/monster_frogling.webp", name: "Frogling" },
      { file: "Humanoid/monster_goblin.webp", name: "Goblin" },
      { file: "Humanoid/monster_goblinboomer.webp", name: "Goblin Boomer" },
      { file: "Humanoid/monster_goblinhermit.webp", name: "Goblin Hermit" },
      { file: "Humanoid/monster_goblinrunts.webp", name: "Goblin Runts" },
      { file: "Humanoid/monster_goblinscout.webp", name: "Goblin Scout" },
      { file: "Humanoid/monster_goblinveteran.webp", name: "Goblin Veteran" },
      { file: "Humanoid/monster_orc.webp", name: "Orc" },
      { file: "Humanoid/monster_orcishberserker.webp", name: "Orcish Berserker" },
      { file: "Humanoid/monster_ratling.webp", name: "Ratling" },
      { file: "Humanoid/npc_adventurer.webp", name: "Adventurer" },
      { file: "Humanoid/npc_dwarf.webp", name: "Dwarf" },
    ],
    Monstrosity: [
      { file: "Monstrosity/monster_centaur.webp", name: "Centaur" },
      { file: "Monstrosity/monster_doppelganger.webp", name: "Doppelganger" },
      { file: "Monstrosity/monster_gorgoth.webp", name: "Gorgoth" },
      { file: "Monstrosity/monster_medusa.webp", name: "Medusa" },
      { file: "Monstrosity/monster_merfolk.webp", name: "Merfolk" },
      { file: "Monstrosity/monster_minotaur.webp", name: "Minotaur" },
      { file: "Monstrosity/monster_naga.webp", name: "Naga" },
      { file: "Monstrosity/monster_werewolfcub.webp", name: "Werewolf Cub" },
    ],
    Ooze: [
      { file: "Ooze/monster_ooze.webp", name: "Ooze" },
    ],
    Plant: [
      { file: "Plant/monster_treefolk.webp", name: "Treefolk" },
    ],
    Undead: [
      { file: "Undead/boss_lich.webp", name: "Lich" },
      { file: "Undead/boss_thenightmother.webp", name: "The Night Mother" },
      { file: "Undead/monster_banshee.webp", name: "Banshee" },
      { file: "Undead/monster_demilich.webp", name: "Demilich" },
      { file: "Undead/monster_draugr.webp", name: "Draugr" },
      { file: "Undead/monster_ghoul.webp", name: "Ghoul" },
      { file: "Undead/monster_plaguezombie.webp", name: "Plague Zombie" },
      { file: "Undead/monster_skeleton.webp", name: "Skeleton" },
      { file: "Undead/monster_vampire.webp", name: "Vampire" },
      { file: "Undead/monster_vampirechilder.webp", name: "Vampire Childer" },
      { file: "Undead/monster_wight.webp", name: "Wight" },
      { file: "Undead/monster_wraith.webp", name: "Wraith" },
      { file: "Undead/monster_zombie.webp", name: "Zombie" },
    ],
  },
};


const BUILT_IN_PACK_NAMES = Object.fromEntries(Object.values(CORE_TOKEN_PACKS).map(pack => [pack.id, pack.name]));

const PATHFINDER_TYPE_OVERRIDES = {
  "aberrant/monstrous": "Monstrosity",
  "aberrant/ooze": "Ooze",
  "bestial/mythological": "Monstrosity",
  "humanoid/giant": "Giant",
  "humanoid/hag": "Fey",
  "humanoid/kobold": "Dragon",
  "humanoid/troll": "Giant",
  "humanoid/werecreature": "Monstrosity",
};

const PATHFINDER_CATEGORY_OVERRIDES = {
  giant: "Giant",
  hag: "Fey",
  ooze: "Ooze",
  troll: "Giant",
};

const PATHFINDER_PRIMARY_TYPE_MAP = {
  aberrant: "Aberration",
  bestial: "Beast",
  constructed: "Construct",
  divine: "Celestial",
  draconic: "Dragon",
  elemental: "Elemental",
  fey: "Fey",
  fiendish: "Fiend",
  humanoid: "Humanoid",
  monitor: "Celestial",
  planar: "Celestial",
  plant: "Plant",
  undead: "Undead",
};

/**
 * Is Pathfinder Tokens: Bestiaries installed and active?
 * @param {object} [gameLike=game]
 * @returns {boolean}
 */
export function isPathfinderTokensBestiariesAvailable(gameLike = globalThis.game) {
  return isPathfinderTokenPackAvailable(PF2E_TOKENS_BESTIARIES_ID, gameLike);
}

/**
 * Is Pathfinder Tokens: Monster Core installed and active?
 * @param {object} [gameLike=game]
 * @returns {boolean}
 */
export function isPathfinderTokensMonsterCoreAvailable(gameLike = globalThis.game) {
  return isPathfinderTokenPackAvailable(PF2E_TOKENS_MONSTER_CORE_ID, gameLike);
}

/**
 * Is Pathfinder Tokens: Monster Core 2 installed and active?
 * @param {object} [gameLike=game]
 * @returns {boolean}
 */
export function isPathfinderTokensMonsterCore2Available(gameLike = globalThis.game) {
  return isPathfinderTokenPackAvailable(PF2E_TOKENS_MONSTER_CORE_2_ID, gameLike);
}

function isPathfinderTokenPackAvailable(packId, gameLike = globalThis.game) {
  return isModuleActive(packId, gameLike);
}

function isModuleActive(moduleId, gameLike = globalThis.game) {
  const module = gameLike?.modules?.get?.(moduleId);
  return Boolean(module?.active);
}

function getSetting(gameLike, key, fallback) {
  try {
    const value = gameLike?.settings?.get?.("quick-creatures", key);
    return value === undefined ? fallback : value;
  } catch (_e) {
    return fallback;
  }
}

export function isA5eTokenPackAvailable(packId, gameLike = globalThis.game, options = {}) {
  const pack = A5E_TOKEN_PACKS[packId];
  if (!pack) return false;
  if (pack.systemId) {
    if (gameLike?.system?.id === pack.systemId) return true;
    try {
      return gameLike?.settings?.get?.("quick-creatures", pack.settingKey) === true;
    } catch (_e) {
      return false;
    }
  }
  const aliases = pack.folderAliases || [];
  const descriptors = options.customSets || [];
  return descriptors.some(set => set.id === packId || aliases.includes(set.name));
}

/**
 * Should a D&D/Tales of the Valiant token set be offered?
 * @param {string} packId
 * @param {object} [gameLike=game]
 * @returns {boolean}
 */
export function shouldUseCreatureDatasheetTokenPack(packId, gameLike = globalThis.game) {
  const pack = DND_TOKEN_PACKS[packId] || TOV_TOKEN_PACKS[packId];
  if (!pack) return false;
  return getSetting(gameLike, pack.settingKey, true) !== false;
}

/**
 * Should a Pathfinder token set be offered?
 * @param {string} packId
 * @param {object} [gameLike=game]
 * @returns {boolean}
 */
export function shouldUsePathfinderTokenPack(packId, gameLike = globalThis.game) {
  const pack = PATHFINDER_TOKEN_PACKS[packId];
  if (!pack || !isPathfinderTokenPackAvailable(packId, gameLike)) return false;
  const settings = gameLike?.settings;
  if (!settings?.get) return true;
  try {
    return settings.get("quick-creatures", pack.settingKey) !== false;
  } catch (_e) {
    return true;
  }
}

/**
 * Should the Pathfinder Bestiaries token set be offered?
 * @param {object} [gameLike=game]
 * @returns {boolean}
 */
export function shouldUsePathfinderTokensBestiaries(gameLike = globalThis.game) {
  return shouldUsePathfinderTokenPack(PF2E_TOKENS_BESTIARIES_ID, gameLike);
}

/**
 * Should the Pathfinder Monster Core token set be offered?
 * @param {object} [gameLike=game]
 * @returns {boolean}
 */
export function shouldUsePathfinderTokensMonsterCore(gameLike = globalThis.game) {
  return shouldUsePathfinderTokenPack(PF2E_TOKENS_MONSTER_CORE_ID, gameLike);
}

/**
 * Should the Pathfinder Monster Core 2 token set be offered?
 * @param {object} [gameLike=game]
 * @returns {boolean}
 */
export function shouldUsePathfinderTokensMonsterCore2(gameLike = globalThis.game) {
  return shouldUsePathfinderTokenPack(PF2E_TOKENS_MONSTER_CORE_2_ID, gameLike);
}

/**
 * Token-set choices for Foundry settings.
 * @param {object} [gameLike=game]
 * @returns {Record<string, string>}
 */
export function getTokenSetChoices(gameLike = globalThis.game, options = {}) {
  const { respectSettings = true, customSets = [] } = options;
  const choices = {};
  for (const pack of Object.values(CORE_TOKEN_PACKS)) {
    if (!respectSettings || getSetting(gameLike, pack.settingKey, true) !== false) choices[pack.id] = pack.name;
  }
  for (const pack of [...Object.values(DND_TOKEN_PACKS), ...Object.values(TOV_TOKEN_PACKS)]) {
    const enabled = !respectSettings || shouldUseCreatureDatasheetTokenPack(pack.id, gameLike);
    if (enabled) choices[pack.id] = pack.name;
  }
  for (const pack of Object.values(PATHFINDER_TOKEN_PACKS)) {
    const enabled = respectSettings
      ? shouldUsePathfinderTokenPack(pack.id, gameLike)
      : isPathfinderTokenPackAvailable(pack.id, gameLike);
    if (enabled) choices[pack.id] = pack.name;
  }
  for (const pack of Object.values(A5E_TOKEN_PACKS)) {
    const available = !respectSettings && pack.systemId ? true : isA5eTokenPackAvailable(pack.id, gameLike, options);
    if (available && (!respectSettings || getSetting(gameLike, pack.settingKey, true) !== false)) choices[pack.id] = pack.name;
  }
  for (const set of customSets) {
    if (A5E_TOKEN_PACKS[set.id]) continue;
    const enabled = getSetting(gameLike, "customTokenSetEnabled", {})?.[set.id] !== false;
    if (!respectSettings || enabled) choices[set.id] = set.name;
  }
  if (Object.keys(choices).length === 0) choices.Original_Tokens = CORE_TOKEN_PACKS.Original_Tokens.name;
  return choices;
}

/**
 * Map Pathfinder Tokens category path to one of Quick Creatures' 14 creature types.
 * @param {string[]} categories
 * @returns {string|null}
 */
export function mapPathfinderCategoriesToType(categories = []) {
  const normalized = categories.map(c => String(c).toLowerCase());
  const exact = PATHFINDER_TYPE_OVERRIDES[normalized.join("/")];
  if (exact) return exact;
  for (const category of normalized) {
    if (PATHFINDER_CATEGORY_OVERRIDES[category]) return PATHFINDER_CATEGORY_OVERRIDES[category];
    if (PATHFINDER_PRIMARY_TYPE_MAP[category]) return PATHFINDER_PRIMARY_TYPE_MAP[category];
  }
  return null;
}

/**
 * Build a Quick Creatures token pack from a Pathfinder datasheet.
 * @param {string} packId
 * @param {string} packName
 * @param {Array<object>} datasheet
 * @returns {object}
 */
export function createPathfinderTokenPack(packId, packName, datasheet = []) {
  const config = PATHFINDER_TOKEN_PACKS[packId] || { description: `Artwork from the ${packName} module.` };
  const tokens = Object.fromEntries(TYPES.map(type => [type, []]));

  for (const entry of datasheet) {
    const type = mapPathfinderCategoriesToType(entry?.tags?.category || []);
    const token = entry?.art?.token;
    if (!type || !token) continue;
    tokens[type].push({
      file: token,
      name: entry.label || nameFromFile(token.split("/").pop() || token),
      subject: entry.art?.subject || null,
      portrait: entry.art?.portrait || null,
      scale: entry.art?.scale ?? 1,
    });
  }

  for (const list of Object.values(tokens)) {
    list.sort((a, b) => a.name.localeCompare(b.name));
  }

  return {
    id: packId,
    name: packName,
    description: config.description,
    defaults: {},
    tokens,
  };
}

export function createPathfinderBestiariesPack(datasheet = []) {
  const config = PATHFINDER_TOKEN_PACKS[PF2E_TOKENS_BESTIARIES_ID];
  return createPathfinderTokenPack(config.id, config.name, datasheet);
}

export function createCreatureDatasheetTokenPack(packId, packName, datasheet = []) {
  const config = DND_TOKEN_PACKS[packId] || TOV_TOKEN_PACKS[packId] || { description: `Artwork from the ${packName} module.` };
  const tokens = Object.fromEntries(TYPES.map(type => [type, []]));
  for (const entry of datasheet) {
    const type = TYPES.includes(entry?.creatureType) ? entry.creatureType : null;
    const token = entry?.art?.token;
    if (!type || !token) continue;
    tokens[type].push({
      file: token,
      name: entry.label || nameFromFile(token.split("/").pop() || token),
      subject: entry.art?.subject || null,
      portrait: entry.art?.portrait || null,
      scale: entry.art?.scale ?? 1,
    });
  }
  for (const list of Object.values(tokens)) list.sort((a, b) => a.name.localeCompare(b.name));
  return {
    id: packId,
    name: packName,
    description: config.description,
    defaults: {},
    tokens,
  };
}

/**
 * Display-friendly name from a filename (remove extension, replace underscores).
 * @param {string} filename
 * @returns {string}
 */
function nameFromFile(filename) {
  const base = filename.replace(/\.[^.]+$/i, "");
  return base
    .replace(/_/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Discover all token packs in assets/.
 * A pack is a subdirectory containing a tokens.yaml file.
 * @returns {Promise<TokenPack[]>}
 */
export async function discoverPacks() {
  const results = [];
  const packIds = Object.keys(EMBEDDED_TOKENS);

  for (const packId of packIds) {
    const manifest = await _loadManifest(`${MODULE_PATH}/assets/${packId}/tokens.yaml`);
    if (manifest) {
      const tokens = EMBEDDED_TOKENS[packId] || {};
      results.push({
        id: packId,
        name: manifest.name || packId,
        description: manifest.description || "",
        defaults: manifest.defaults || {},
        tokens,
      });
    }
  }

  for (const pack of [...Object.values(DND_TOKEN_PACKS), ...Object.values(TOV_TOKEN_PACKS)]) {
    if (!shouldUseCreatureDatasheetTokenPack(pack.id)) continue;
    const datasheet = await _loadJson(pack.datasheet);
    if (Array.isArray(datasheet)) results.push(createCreatureDatasheetTokenPack(pack.id, pack.name, datasheet));
  }

  for (const pack of Object.values(PATHFINDER_TOKEN_PACKS)) {
    if (!shouldUsePathfinderTokenPack(pack.id)) continue;
    const datasheet = await _loadJson(pack.datasheet);
    if (Array.isArray(datasheet)) results.push(createPathfinderTokenPack(pack.id, pack.name, datasheet));
  }

  const customDirectory = getSetting(globalThis.game, "customTokenDirectory", "Data/assets/quick-creatures-tokens/");
  const customSets = await discoverCustomTokenSets(customDirectory, globalThis.game);
  const hydratedCustomSets = await hydrateCustomTokenSetDescriptors(customSets);
  for (const descriptor of hydratedCustomSets) {
    if (A5E_TOKEN_PACKS[descriptor.id]) continue;
    if (getSetting(globalThis.game, "customTokenSetEnabled", {})?.[descriptor.id] === false) continue;
    results.push(createCustomTokenPack(descriptor));
  }

  const a5eSystem = A5E_TOKEN_PACKS["a5e-system"];
  if (isA5eTokenPackAvailable("a5e-system", globalThis.game) && getSetting(globalThis.game, a5eSystem.settingKey, true) !== false && globalThis.FilePicker?.browse) {
    try {
      const { source, path } = parseCustomTokenDirectory(a5eSystem.dataPath);
      const browse = await globalThis.FilePicker.browse(source, path);
      results.push(createCustomTokenPack({
        id: a5eSystem.id,
        name: a5eSystem.name,
        path,
        files: browse.files || [],
        dirs: browse.dirs || [],
        classification: "mapping-file",
        mappingSource: a5eSystem.mappingSource,
      }));
    } catch (e) {
      console.warn(`Quick Creatures | Failed to browse A5E system tokens`, e);
    }
  }

  for (const descriptor of hydratedCustomSets) {
    if (!A5E_TOKEN_PACKS[descriptor.id]) continue;
    if (getSetting(globalThis.game, A5E_TOKEN_PACKS[descriptor.id].settingKey, true) === false) continue;
    results.push(createCustomTokenPack(descriptor));
  }

  return results;
}

/**
 * Get the default token path for a creature type in a given pack.
 * @param {string} packId - e.g. "Original_Tokens"
 * @param {string} type - e.g. "Aberration"
 * @returns {string} Relative path within the pack e.g. "Aberration/aberration.webp"
 */
export function getDefaultToken(packId, type) {
  const tokens = EMBEDDED_TOKENS[packId];
  if (!tokens || !tokens[type] || tokens[type].length === 0) return null;
  return tokens[type][0].file;
}

/**
 * Get the default token entry for a creature type in a pack.
 * @param {string} packId
 * @param {string} type
 * @returns {Promise<object|null>}
 */
export async function getDefaultTokenEntry(packId, type) {
  if (EMBEDDED_TOKENS[packId]?.[type]?.length) return EMBEDDED_TOKENS[packId][type][0];
  const creaturePackConfig = DND_TOKEN_PACKS[packId] || TOV_TOKEN_PACKS[packId];
  if (creaturePackConfig) {
    if (!shouldUseCreatureDatasheetTokenPack(packId)) return null;
    const datasheet = await _loadJson(creaturePackConfig.datasheet);
    if (!Array.isArray(datasheet)) return null;
    const pack = createCreatureDatasheetTokenPack(creaturePackConfig.id, creaturePackConfig.name, datasheet);
    return pack.tokens[type]?.[0] || null;
  }
  const packConfig = PATHFINDER_TOKEN_PACKS[packId];
  if (!packConfig || !shouldUsePathfinderTokenPack(packId)) return null;
  const datasheet = await _loadJson(packConfig.datasheet);
  if (!Array.isArray(datasheet)) return null;
  const pack = createPathfinderTokenPack(packConfig.id, packConfig.name, datasheet);
  return pack.tokens[type]?.[0] || null;
}

/**
 * Get the full module-relative image path for a token.
 * @param {string} packId
 * @param {string} file - Relative path within pack e.g. "Aberration/aberration.webp"
 * @returns {string} Full module path e.g. "modules/quick-creatures/assets/Original_Tokens/Aberration/aberration.webp"
 */
export function tokenImagePath(packId, file) {
  if (DND_TOKEN_PACKS[packId] || TOV_TOKEN_PACKS[packId] || PATHFINDER_TOKEN_PACKS[packId] || A5E_TOKEN_PACKS[packId] || String(packId).startsWith("custom:")) return file;
  return `${MODULE_PATH}/assets/${packId}/${file}`;
}

/**
 * Load JSON via fetch.
 * @param {string} path
 * @returns {Promise<object|null>}
 */
async function _loadJson(path) {
  try {
    const resp = await fetch(path);
    if (!resp.ok) return null;
    return await resp.json();
  } catch (e) {
    console.warn(`Quick Creatures | Failed to load JSON: ${path}`, e);
    return null;
  }
}

/**
 * Load and parse a tokens.yaml manifest via fetch.
 * @param {string} path - URL path relative to Foundry root
 * @returns {Promise<Object|null>}
 */
async function _loadManifest(path) {
  try {
    const resp = await fetch(path);
    if (!resp.ok) return null;
    const text = await resp.text();
    return yaml.load(text);
  } catch (e) {
    console.warn(`Quick Creatures | Failed to load manifest: ${path}`, e);
    return null;
  }
}

export function getTokenSetConfigGroups(gameLike = globalThis.game, options = {}) {
  const allPacks = { ...CORE_TOKEN_PACKS, ...DND_TOKEN_PACKS, ...TOV_TOKEN_PACKS, ...PATHFINDER_TOKEN_PACKS, ...A5E_TOKEN_PACKS };
  return TOKEN_SET_GROUPS.map(group => ({
    ...group,
    packs: group.packIds.map(id => {
      const pack = allPacks[id];
      if (!pack) return null;
      return {
        ...pack,
        enabled: getSetting(gameLike, pack.settingKey, true) !== false,
        statusKey: getTokenSetConfigStatusKey(pack, gameLike, options),
      };
    }).filter(Boolean),
  }));
}

function getTokenSetConfigStatusKey(pack, gameLike = globalThis.game, options = {}) {
  if (pack.id === "a5e-system") {
    return isA5eTokenPackAvailable(pack.id, gameLike, options)
      ? "quick-creatures.tokenConfig.status.a5eSystemDetected"
      : "quick-creatures.tokenConfig.status.a5eSystemNotDetected";
  }
  if (pack.id === "a5e-monstrous-menagerie" || pack.id === "a5e-monstrous-menagerie-2") {
    return isA5eTokenPackAvailable(pack.id, gameLike, options)
      ? "quick-creatures.tokenConfig.status.mmDetected"
      : "quick-creatures.tokenConfig.status.mmNotDetected";
  }
  return null;
}

export function parseCustomTokenDirectory(value = "Data/assets/quick-creatures-tokens/") {
  const raw = String(value || "Data/assets/quick-creatures-tokens/");
  if (raw.startsWith("Data/")) return { source: "data", path: raw.slice(5) };
  return { source: "data", path: raw.replace(/^\/+/, "") };
}

const MAPPING_FILES = new Set(["quick-creatures-map.json", "tokens.json", "tokens.md", "README.md"]);
const IMAGE_RE = /\.(webp|png|jpg|jpeg|gif)$/i;

function basename(p = "") {
  return String(p).split("/").filter(Boolean).pop() || "";
}

function dirname(p = "") {
  const parts = String(p).split("/").filter(Boolean);
  parts.pop();
  return parts.join("/");
}

function dataPath(path) {
  return String(path).replace(/^Data\//, "").replace(/^\/+/, "");
}

export function classifyCustomSetStructure({ folders = [], files = [] } = {}) {
  if (files.some(file => MAPPING_FILES.has(basename(file)))) return "mapping-file";
  if (folders.some(folder => TYPES.includes(basename(folder)))) return "typed-subfolders";
  return "filename-fallback";
}

function slugCustomId(name) {
  const mm = Object.values(A5E_TOKEN_PACKS).find(pack => pack.folderAliases?.includes(name));
  return mm?.id || `custom:${name.replace(/[\\/]/g, "_")}`;
}

export function createCustomTokenSetDescriptors(browseResult = {}, options = {}) {
  const root = String(browseResult.target || parseCustomTokenDirectory(options.customTokenDirectory).path || "").replace(/\/$/, "");
  return (browseResult.dirs || []).map(dir => {
    const name = basename(dir);
    const childFiles = (browseResult.files || []).filter(file => dirname(file).startsWith(String(dir).replace(/\/$/, "")));
    const childDirs = (browseResult.dirs || []).filter(child => child !== dir && dirname(child) === String(dir).replace(/\/$/, ""));
    const known = Object.values(A5E_TOKEN_PACKS).find(pack => pack.folderAliases?.includes(name));
    return {
      id: slugCustomId(name),
      name: known?.name || name,
      path: String(dir).replace(/^Data\//, "") || `${root}/${name}`,
      files: childFiles,
      dirs: childDirs,
      classification: known?.mappingSource ? "mapping-file" : classifyCustomSetStructure({ folders: childDirs, files: childFiles }),
      mappingSource: known?.mappingSource || null,
    };
  });
}

async function hydrateCustomTokenSetDescriptors(descriptors = []) {
  if (!globalThis.FilePicker?.browse) return descriptors;
  return Promise.all(descriptors.map(async descriptor => {
    if ((descriptor.files || []).length || (descriptor.dirs || []).length) return descriptor;
    try {
      const { source, path } = parseCustomTokenDirectory(descriptor.path);
      const browse = await globalThis.FilePicker.browse(source, path);
      return {
        ...descriptor,
        files: browse.files || [],
        dirs: browse.dirs || [],
        classification: descriptor.mappingSource ? "mapping-file" : classifyCustomSetStructure({ folders: browse.dirs || [], files: browse.files || [] }),
      };
    } catch (e) {
      console.warn(`Quick Creatures | Failed to browse token set: ${descriptor.path}`, e);
      return descriptor;
    }
  }));
}

export function createCustomTokenPack(descriptor) {
  const tokens = Object.fromEntries(TYPES.map(type => [type, []]));
  const imageFiles = (descriptor.files || []).filter(file => IMAGE_RE.test(file));
  if (descriptor.mappingSource) {
    for (const file of imageFiles) {
      const mapped = resolveA5eTokenMapping(file, descriptor.mappingSource);
      if (!mapped || !tokens[mapped.creatureType]) continue;
      tokens[mapped.creatureType].push({ file: dataPath(file), name: mapped.creatureName });
    }
  } else if (descriptor.classification === "typed-subfolders") {
    for (const file of imageFiles) {
      const type = String(file).split("/").find(part => TYPES.includes(part));
      if (type) tokens[type].push({ file: dataPath(file), name: nameFromFile(basename(file)) });
    }
  } else {
    const entries = imageFiles.map(file => ({ file: dataPath(file), name: nameFromFile(basename(file)) }));
    for (const type of TYPES) tokens[type] = [...entries];
  }
  for (const list of Object.values(tokens)) list.sort((a, b) => a.name.localeCompare(b.name));
  return { id: descriptor.id, name: descriptor.name, description: "Custom token set", defaults: {}, tokens };
}

export async function discoverCustomTokenSets(directory = "Data/assets/quick-creatures-tokens/", gameLike = globalThis.game) {
  const picker = globalThis.FilePicker;
  if (!picker?.browse) return [];
  const { source, path } = parseCustomTokenDirectory(directory);
  try {
    return createCustomTokenSetDescriptors(await picker.browse(source, path), { customTokenDirectory: directory });
  } catch (e) {
    console.warn(`Quick Creatures | Failed to browse custom token directory: ${directory}`, e);
    return [];
  }
}

export function normalizeTokenBasename(value = "") {
  return basename(value)
    .replace(/\.[^.]+$/, "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_\-]+/g, " ")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .toLowerCase();
}

export function resolveA5eTokenMapping(tokenFile, source = null) {
  const normalized = normalizeTokenBasename(tokenFile);
  return A5E_TOKEN_MAP.find(entry => (!source || entry.source === source) && normalizeTokenBasename(entry.token) === normalized) || null;
}

export { TYPES };
