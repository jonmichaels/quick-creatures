/**
 * Token pack discovery and manifest loading.
 *
 * Discovers token packs in assets/, loads tokens.yaml manifests,
 * and provides token file listings per creature type.
 */
import yaml from "js-yaml";

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
      { file: "Fiend/monster_gnoll.webp", name: "Gnoll" },
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

/**
 * Display-friendly name from a filename (remove extension, replace underscores).
 * @param {string} filename
 * @returns {string}
 */
function nameFromFile(filename) {
  const base = filename.replace(/\.webp$/i, "");
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
 * Get the full module-relative image path for a token.
 * @param {string} packId
 * @param {string} file - Relative path within pack e.g. "Aberration/aberration.webp"
 * @returns {string} Full module path e.g. "modules/quick-creatures/assets/Original_Tokens/Aberration/aberration.webp"
 */
export function tokenImagePath(packId, file) {
  return `${MODULE_PATH}/assets/${packId}/${file}`;
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

export { TYPES };
