/**
 * Black Flag (Tales of the Valiant) System Adapter for Quick Creatures.
 *
 * Black Flag v13 uses an "activities" data model for items (ActivityCollection)
 * and a different actor data model than dnd5e (CR in attributes.cr, abilities
 * use {mod} format instead of {value}, etc.).
 */

/**
 * Parse a damage dice string like "1d6+2" or "3d8+3" into its components.
 * @param {string} diceStr
 * @returns {{ count: number, die: number, modifier: number }}
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
 * Build a Black Flag activity object for a weapon attack.
 * @param {string} name - Activity name
 * @param {Object} stats - CR stat block
 * @param {boolean} isRanged - Whether this is a ranged attack
 * @returns {Object} Activity data
 */
function buildAttackActivity(name, stats, isRanged) {
    const dice = parseDice(stats.DpACalc);
    return {
        [`${isRanged ? "ranged" : "melee"}-attack`]: {
            type: "attack",
            name,
            activation: { type: "action", value: null, condition: "", override: false, primary: true },
            range: isRanged
                ? { override: false, unit: "foot", short: 60, long: 120 }
                : { override: false, unit: "foot", short: null, long: null, reach: 5 },
            system: {
                attack: { flat: false, bonus: stats.PAB || "", critical: { threshold: null }, type: {} },
                damage: {
                    parts: [{
                        number: dice.count,
                        denomination: dice.die,
                        bonus: dice.modifier ? String(dice.modifier) : "",
                        custom: { enabled: false },
                        type: "",
                        additionalTypes: [],
                        scaling: { number: 1 },
                    }],
                    critical: {},
                    includeBase: true,
                },
                effects: [],
            },
            consumption: { targets: [], scale: { allowed: false } },
            uses: { spent: 0, consumeQuantity: false, recovery: [], max: "" },
            target: { affects: { type: "", choice: false }, template: { type: "", count: "1", contiguous: false, unit: "foot" }, override: false, prompt: true },
            duration: { concentration: false, override: false, unit: "instantaneous" },
            magical: false,
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
            description: { value: "<p>A melee weapon attack.</p>" },
            activities: buildAttackActivity("Melee Attack", stats, false),
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
            description: { value: "<p>A ranged weapon attack.</p>" },
            activities: buildAttackActivity("Ranged Attack", stats, true),
        },
    };
}

/**
 * Create a multiattack feature item.
 * @param {number} noa - Number of attacks from chart
 * @returns {Object} Item data
 */
export function createMultiattackItem(noa) {
    return {
        name: "Multiattack",
        type: "feature",
        img: "icons/skills/melee/maneuver-greatsword-yellow.webp",
        system: {
            description: {
                value: `<p>The creature can make ${noa} attack(s) on its turn.</p>`,
            },
            activation: {
                type: "action",
                value: null,
                condition: "",
                override: false,
                primary: true,
            },
        },
    };
}

/**
 * Create a feature Item data object from a feature definition.
 * Maps dnd5e item templates to Black Flag conventions.
 * @param {Object} feature - Raw feature object from data
 * @param {Object} stats - Current stat block
 * @returns {Object|null} Item data or null
 */
export function createFeatureItem(feature, stats) {
    if (!feature || !feature.item) return null;

    const item = foundry.utils.deepClone(feature.item);

    // Map item type: dnd5e "feat" → black-flag "feature"
    if (item.type === "feat") {
        item.type = "feature";
    }

    // Handle damage-replacing features
    if (feature.isDmg && item.system) {
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
    if (feature.hasSave && item.system?.save) {
        item.system.save.dc = stats.DC || stats.ACDC || null;
    }

    // Handle active effect features
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
 * Build the full Actor creation data object for Black Flag.
 * @param {string} name
 * @param {Object} stats
 * @param {string} type
 * @param {Object} abilities
 * @param {string} tokenPath
 * @returns {Object} Actor.create data
 */
export function buildActorData(name, stats, type, abilities, tokenPath) {
    const cr = parseCR(stats.CR);

    // Map ability values to Black Flag {mod} format
    const bfAbilities = {};
    const ablKeys = ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"];
    for (const key of ablKeys) {
        const abl = abilities[key] || {};
        // Black Flag uses 'mod' directly (the ability modifier, not the score)
        bfAbilities[key] = {
            mod: abl.mod ?? Math.floor((abl.value - 10) / 2),
            proficient: abl.proficient ?? false,
        };
    }

    return {
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
                prof: stats.prof ?? (parseInt(stats.PAB) || 2),
                cr,
                movement: {
                    walk: stats.speed || 30,
                    units: "ft",
                },
            },
            traits: {
                type: type.toLowerCase(),
            },
            abilities: bfAbilities,
        },
        prototypeToken: {
            name,
            texture: { src: tokenPath },
            displayName: CONST.TOKEN_DISPLAY_MODES.ALWAYS,
            actorLink: true,
        },
    };
}

export const id = "black-flag";
