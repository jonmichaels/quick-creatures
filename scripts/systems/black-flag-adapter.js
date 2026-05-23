/**
 * Black Flag (Tales of the Valiant) System Adapter for Quick Creatures.
 *
 * Black Flag v13 uses an "activities" data model for items (ActivityCollection)
 * and a different actor data model than dnd5e (CR in attributes.cr, abilities
 * use {mod} format instead of {value}, NPC modifiers ARE saves without prof layering).
 */

/**
 * Parse a damage dice string like "1d6+2" or "3d8+3" into its components.
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
 * Build a Black Flag attack activity for a natural weapon.
 * Uses flat attack bonus (not computed from ability mod + prof).
 */
function buildAttackActivity(stats, isRanged) {
    const dice = parseDice(stats.DpACalc);
    const activityId = foundry.utils.randomID();
    return {
        [activityId]: {
            _id: activityId,
            type: "attack",
            activation: { type: "action", value: null, condition: "", override: false, primary: true },
            range: isRanged
                ? { override: false, unit: "foot", short: 60, long: 120 }
                : { override: false, unit: "foot", short: null, long: null, reach: 5 },
            system: {
                attack: {
                    flat: true,
                    bonus: stats.PAB || "+2",
                    critical: { threshold: null },
                    type: { value: isRanged ? "ranged" : "melee", classification: "weapon" },
                },
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
            target: { template: { type: "", count: "1", contiguous: false, unit: "foot" }, affects: { type: "", choice: false }, override: false, prompt: true },
            duration: { concentration: false, override: false, unit: "instantaneous" },
            magical: false,
        },
    };
}

/**
 * Build a utility activity for multiattack (Use button, no roll).
 */
function buildUtilityActivity() {
    const activityId = foundry.utils.randomID();
    return {
        [activityId]: {
            _id: activityId,
            type: "utility",
            activation: { type: "action", value: null, override: false, primary: true },
            system: {
                effects: [],
                roll: { prompt: false, visible: false },
            },
            consumption: { targets: [], scale: { allowed: false } },
            uses: { spent: 0, consumeQuantity: false, recovery: [] },
            duration: { override: false, concentration: false, unit: "instantaneous" },
            range: { override: false },
            target: { template: { count: "1", contiguous: false, unit: "foot" }, affects: { choice: false }, override: false, prompt: true },
            magical: false,
        },
    };
}

/**
 * Melee Attack — Natural / Melee weapon.
 */
export function createAttackItem(stats) {
    return {
        name: "Melee Attack",
        type: "weapon",
        img: "icons/skills/melee/blood-slash-foam-red.webp",
        system: {
            description: {
                value: `<p>[[/attack extended]]. [[/damage average extended]].</p><p>The [[lookup @name lowercase]] makes a melee attack.</p>`,
            },
            type: { category: "monsters" },
            activities: buildAttackActivity(stats, false),
        },
    };
}

/**
 * Ranged Attack — Natural / Ranged weapon.
 */
export function createRangedItem(stats) {
    return {
        name: "Ranged Attack",
        type: "weapon",
        img: "icons/magic/unholy/beam-impact-purple.webp",
        system: {
            description: {
                value: `<p>[[/attack extended]]. [[/damage average extended]].</p><p>The [[lookup @name lowercase]] makes a ranged attack.</p>`,
            },
            type: { category: "monsters" },
            activities: buildAttackActivity(stats, true),
        },
    };
}

/**
 * Multiattack — feature with Use action, no roll.
 */
export function createMultiattackItem(noa) {
    return {
        name: "Multiattack",
        type: "feature",
        img: "icons/skills/melee/strike-weapons-orange.webp",
        system: {
            description: {
                value: `<p>The [[lookup @name lowercase]] makes ${noa} attacks.</p>`,
            },
            activities: buildUtilityActivity(),
        },
    };
}

/**
 * Create a feature Item data object from a feature definition.
 */
export function createFeatureItem(feature, stats) {
    if (!feature || !feature.item) return null;

    const item = foundry.utils.deepClone(feature.item);

    if (item.type === "feat") {
        item.type = "feature";
    }

    // Convert dnd5e-format activation to BF utility activity
    // (only for non-weapon features — weapon features get attack activities below)
    if (item.system?.activation?.type && item.system.activation.type !== "none" && item.type !== "weapon") {
        const activityId = foundry.utils.randomID();
        const dndActivation = item.system.activation;
        item.system.activities = {
            [activityId]: {
                _id: activityId,
                type: "utility",
                activation: {
                    type: dndActivation.type,       // "action" or "bonus"
                    value: dndActivation.cost || null,
                    condition: dndActivation.condition || "",
                    override: false,
                    primary: true,
                },
                system: {
                    effects: [],
                    roll: { prompt: false, visible: false },
                },
                consumption: { targets: [], scale: { allowed: false } },
                uses: { spent: 0, consumeQuantity: false, recovery: [] },
                duration: { override: false, concentration: false, unit: "instantaneous" },
                range: item.system.range?.value ? { override: false, unit: item.system.range.units || "ft", short: item.system.range.value, long: item.system.range.long || null } : { override: false },
                target: { template: { count: "1", contiguous: false, unit: "foot" }, affects: { choice: false }, override: false, prompt: true },
                magical: false,
            },
        };
    }

    // Replace "this creature" with BF's [[lookup @name lowercase]] syntax
    if (item.system?.description?.value) {
        item.system.description.value = item.system.description.value
            .replace(/this creature/gi, "the [[lookup @name lowercase]]");
    }

    // Handle damage-replacing weapon features: build BF attack activity
    if (feature.isDmg && item.system && item.type === "weapon") {
        const dice = parseDice(stats.DpACalc);
        const activityId = foundry.utils.randomID();
        const isRanged = item.system.actionType === "rwak";
        const dndRange = item.system.range || {};
        const dndActivation = item.system.activation || {};
        item.system.activities = {
            [activityId]: {
                _id: activityId,
                type: "attack",
                activation: {
                    type: dndActivation.type || "action",
                    value: dndActivation.cost || null,
                    condition: dndActivation.condition || "",
                    override: false,
                    primary: true,
                },
                range: {
                    override: false,
                    unit: dndRange.units || "ft",
                    short: dndRange.value || (isRanged ? 60 : null),
                    long: dndRange.long || (isRanged ? 120 : null),
                    reach: isRanged ? null : 5,
                },
                system: {
                    attack: {
                        flat: true,
                        bonus: stats.PAB || "+2",
                        critical: { threshold: null },
                        type: { value: isRanged ? "ranged" : "melee", classification: "weapon" },
                    },
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
                target: { template: { count: "1", contiguous: false, unit: "foot" }, affects: { choice: false }, override: false, prompt: true },
                duration: { concentration: false, override: false, unit: "instantaneous" },
                magical: false,
            },
        };
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

    if (feature.hasSave && item.system?.save) {
        item.system.save.dc = stats.DC || stats.ACDC || null;
    }

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

function parseCR(crStr) {
    if (!crStr) return 0;
    const str = String(crStr).trim();
    if (str.includes("/")) {
        const [num, den] = str.split("/").map(Number);
        return num / den;
    }
    return Number(str) || 0;
}

export function buildActorData(name, stats, type, abilities, tokenPath) {
    const cr = parseCR(stats.CR);

    const bfAbilities = {};
    const ablKeys = ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"];
    for (const key of ablKeys) {
        const abl = abilities[key] || {};
        const mod = (abl.mod != null) ? Number(abl.mod) : Math.floor((Number(abl.value || 10) - 10) / 2);
        bfAbilities[key] = {
            mod,
            proficient: abl.proficient ? 1 : 0,
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
                prof: parseInt(stats.PAB) || 2,
                cr,
                movement: {
                    walk: stats.speed || 30,
                    units: "ft",
                },
            },
            traits: {
                type: { value: type.toLowerCase() },
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
