/**
 * D&D 5E System Adapter for Quick Creatures.
 *
 * Handles dnd5e-specific data model paths, item templates, and actor creation.
 * Uses the standard dnd5e 5.x data model structure.
 */

/**
 * Parse a damage dice string like "1d6+2" or "3d8+3" into its components.
 * @param {string} diceStr
 * @returns {{ count: number, die: number, modifier: number }}
 */
function parseDice(diceStr) {
    const match = diceStr.match(/(\d+)d(\d+)([+-]\d+)?/);
    if (!match) return { count: 1, die: 4, modifier: 0 };
    return {
        count: parseInt(match[1]),
        die: parseInt(match[2]),
        modifier: match[3] ? parseInt(match[3]) : 0,
    };
}

/**
 * Create an attack Item data object.
 * @param {Object} stats - CR stat block
 * @param {number} noa - Total number of attacks
 * @param {number} index - Which attack number this is (0-based)
 * @returns {Object} Item data
 */
export function createAttackItem(stats, noa, index) {
    const label = noa > 1 ? `Attack #${index + 1}` : "Attack";
    const dice = parseDice(stats.DpACalc);

    return {
        name: label,
        type: "weapon",
        img: "icons/skills/melee/strike-slashes-red.webp",
        system: {
            description: {
                value: `<p>A melee weapon attack.</p>`,
            },
            activation: {
                type: "action",
                cost: 1,
            },
            ability: stats.abilities ? "" : "none",
            actionType: "mwak",
            proficient: stats.abilities ? 0 : 1,
            attackBonus: stats.atkBonus || "",
            damage: {
                parts: [
                    [stats.DpACalc],
                ],
            },
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
 * Build the full Actor creation data object for dnd5e.
 * @param {string} name
 * @param {Object} stats
 * @param {string} type
 * @param {Object} abilities
 * @param {string} tokenPath
 * @returns {Object} Actor.create data
 */
export function buildActorData(name, stats, type, abilities, tokenPath) {
    // Parse CR
    let cr;
    try {
        cr = eval(stats.CR);
    } catch (e) {
        cr = 0;
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
            abilities,
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
