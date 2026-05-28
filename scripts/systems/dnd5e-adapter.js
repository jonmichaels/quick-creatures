/**
 * D&D 5E System Adapter for Quick Creatures.
 *
 * Handles dnd5e-specific data model paths, item templates, and actor creation.
 * Uses the standard dnd5e 5.x data model structure.
 */

/**
 * Parse a damage dice string like "1d6+2" or "3d8+3".
 */
function parseDice(diceStr) {
    const match = diceStr?.match(/(\d+)d(\d+)([+-]\d+)?/);
    if (!match) return { count: 1, die: 4, modifier: 0 };
    return {
        count: parseInt(match[1]),
        die: parseInt(match[2]),
        modifier: match[3] ? parseInt(match[3]) : 0,
    };
}

/**
 * Build an attack activity (dnd5e 5.x format).
 */
function buildAttackActivity(stats, isRanged) {
    const dice = parseDice(stats.DpACalc);
    const activityId = foundry.utils.randomID();
    return {
        [activityId]: {
            _id: activityId,
            type: "attack",
            activation: { type: "action", override: false },
            attack: {
                flat: true,
                bonus: stats.PAB || "+2",
                critical: {},
                type: {},
            },
            damage: {
                parts: [{
                    number: dice.count,
                    denomination: dice.die,
                    bonus: dice.modifier ? String(dice.modifier) : "",
                    types: [],
                    custom: { enabled: false },
                    scaling: { number: 1 },
                }],
                includeBase: true,
                critical: {},
            },
            range: isRanged
                ? { value: 60, long: 120, units: "ft", override: false }
                : { units: "ft", override: false },
            target: {
                template: { contiguous: false, units: "ft" },
                affects: {},
                override: false,
                prompt: true,
            },
            consumption: { scaling: { allowed: false }, spellSlot: true, targets: [] },
            duration: { units: "inst", concentration: false, override: false },
            uses: { spent: 0, recovery: [] },
            description: {},
            effects: [],
            sort: 0,
        },
    };
}

/**
 * Create the mandatory "Melee Attack" weapon item.
 * @param {Object} stats - CR stat block
 * @returns {Object} Item data
 */
export function createAttackItem(stats) {
    return {
        name: "Melee Attack",
        type: "weapon",
        img: "icons/skills/melee/strike-slashes-red.webp",
        system: {
            description: {
                value: `<p>A melee weapon attack.</p>`,
            },
            proficient: !stats.abilities,
            type: { value: "naturalM" },
            activities: buildAttackActivity(stats, false),
        },
    };
}

/**
 * Create the mandatory "Ranged Attack" weapon item.
 * @param {Object} stats - CR stat block
 * @returns {Object} Item data
 */
export function createRangedItem(stats) {
    return {
        name: "Ranged Attack",
        type: "weapon",
        img: "icons/skills/ranged/arrow-flying-white.webp",
        system: {
            description: {
                value: `<p>A ranged weapon attack.</p>`,
            },
            proficient: !stats.abilities,
            type: { value: "naturalR" },
            activities: buildAttackActivity(stats, true),
        },
    };
}

/**
 * Create a multiattack feature item.
 * @param {number} noa - Number of attacks
 * @returns {Object} Item data
 */
export function createMultiattackItem(noa) {
    return {
        name: `Multiattack (${noa} attacks)`,
        type: "feat",
        img: "icons/skills/melee/maneuver-greatsword-yellow.webp",
        system: {
            description: {
                value: `<p>The creature can make ${noa} attack(s) on its turn.</p>`,
            },
            activation: {
                type: "action",
                cost: 1,
            },
        },
    };
}

/**
 * Create a feature Item data object from a feature definition.
 * @param {Object} feature - Raw feature object from data
 * @param {Object} stats - Current stat block
 * @returns {Object|null} Item data or null
 */
export function createFeatureItem(feature, stats) {
    if (!feature || !feature.item) return null;

    // Deep clone the item template
    const item = foundry.utils.deepClone(feature.item);

    // Handle damage-replacing features
    if (feature.isDmg) {
        let dmgPart = stats.DpACalc;

        if (feature.useDpR && stats.NoA) {
            dmgPart = Array(parseInt(stats.NoA)).fill(stats.DpACalc).join("+");
        }
        if (feature.divideDmg) {
            dmgPart = `floor((${dmgPart})/${feature.divideDmg})`;
        }

        if (item.system.attackBonus !== undefined) {
            item.system.attackBonus = stats.atkBonus || stats.PAB || "";
        }
        if (item.system.damage) {
            item.system.damage.parts = [[dmgPart]];
        }
    }

    // Handle save DC features
    if (feature.hasSave && item.system.save) {
        item.system.save.dc = stats.DC || stats.ACDC || null;
    }

    // Handle active effect features (e.g., Energy Weapons bonus damage)
    if (feature.isEffect && item.effects) {
        const dmg = stats.DpACalc;
        for (const effect of item.effects) {
            effect.changes = effect.changes.map(change => {
                if (change.key.includes("damage")) {
                    return { ...change, value: dmg };
                }
                return change;
            });
        }
    }

    return item;
}

/**
 * Parse CR string to a number (handles fractions like "1/8", "1/4", "1/2").
 * @param {string} crStr
 * @returns {number}
 */
function parseCR(crStr) {
    if (!crStr) return 0;
    const str = String(crStr).trim();
    if (str.includes("/")) {
        const [num, den] = str.split("/").map(Number);
        return num / den;
    }
    return Number(str) || 0;
}

/**
 * Map Lazy GM PB to standard D&D 5E proficiency bonus.
 */
function get5EProf(pb) {
    if (pb <= 6) return 2;
    if (pb <= 7) return 3;
    if (pb <= 9) return 4;
    if (pb <= 11) return 5;
    if (pb <= 13) return 6;
    return 7;
}

/**
 * Build the full Actor creation data object for dnd5e.
 * @param {string} name
 * @param {Object} stats
 * @param {string} type
 * @param {Object} abilities
 * @param {string} tokenPath
 * @returns {Object} Actor.create data
 */
export function buildActorData(name, stats, type, abilities, tokenPath) {
    const cr = parseCR(stats.CR);

    // Convert CR-mode abilities (detected by mod field) to real 5E scores
    // CR mode uses long keys (strength, dexterity...) but dnd5e expects short (str, dex...)
    const firstKey = Object.keys(abilities)[0];
    const isCRMode = firstKey && abilities[firstKey].mod !== undefined;
    let converted = abilities;
    if (isCRMode) {
        const pb = parseInt(stats.PAB) || 2;
        const prof5E = get5EProf(pb);
        const keyMap = { strength: "str", dexterity: "dex", constitution: "con",
                         intelligence: "int", wisdom: "wis", charisma: "cha" };
        converted = {};
        for (const [key, abl] of Object.entries(abilities)) {
            const short = keyMap[key] || key;
            const isFull = abl.mod >= pb;
            // Score: subtract 5E prof so it looks standard (18 not 22 at CR4)
            const realMod = isFull ? abl.mod - prof5E : (abl.mod || 0);
            converted[short] = {
                value: 10 + realMod * 2,
                proficient: 0,
            };
            // Primary abilities: add 5E prof as save/check bonus
            if (isFull) {
                converted[short].bonuses = {
                    check: String(prof5E),
                    save: String(prof5E),
                };
            }
        }
    }

    const data = {
        name,
        type: "npc",
        img: tokenPath,
        system: {
            attributes: {
                ac: {
                    flat: parseInt(stats.ACDC) || 10,
                    calc: "flat",
                },
                hp: {
                    value: parseInt(stats.HP) || 10,
                    max: parseInt(stats.HP) || 10,
                },
                prof: parseInt(stats.PAB) || 2,
                movement: {
                    walk: stats.speed || 30,
                    units: "ft",
                },
            },
            details: {
                type: {
                    value: type.toLowerCase(),
                },
                cr,
            },
            abilities: converted,
        },
        prototypeToken: {
            name,
            texture: { src: tokenPath },
            displayName: CONST.TOKEN_DISPLAY_MODES.ALWAYS,
            actorLink: true,
        },
    };

    // Add skills if present in archetype data
    if (stats.skills) {
        data.system.skills = stats.skills;
    }

    return data;
}

export const id = "dnd5e";
