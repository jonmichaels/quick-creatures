/**
 * Black Flag (Tales of the Valiant) System Adapter for Quick Creatures.
 *
 * Black Flag v13 uses an "activities" data model for items (ActivityCollection)
 * and a different actor data model than dnd5e (CR in attributes.cr, abilities
 * use {mod} format instead of {value}, NPC modifiers ARE saves without prof layering).
 *
 * CRITICAL: Range is a SIBLING entry in activities, NOT nested inside activity objects.
 * See docs/bf-data-model.md for the full verified structure (BF 2.0.074).
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
 * Range is a SIBLING entry, NOT nested in the activity.
 */
function buildAttackActivity(stats, isRanged) {
    const dice = parseDice(stats.DpACalc);
    const activityId = foundry.utils.randomID();
    return {
        [activityId]: {
            _id: activityId,
            type: "attack",
            name: isRanged ? "Ranged Attack" : "Melee Attack",
            activation: { type: "action", override: false, primary: true },
            system: {
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
                        custom: { enabled: false },
                        type: "",
                        scaling: { number: 1 },
                    }],
                    critical: {},
                    includeBase: true,
                },
                effects: [],
            },
            target: {
                template: { count: "", type: "", unit: "foot", contiguous: false },
                affects: { choice: false },
                prompt: true,
                override: false,
            },
            description: "",
            flags: {},
            sort: 0,
            consumption: { targets: [], scale: { allowed: false } },
            uses: { spent: 0, consumeQuantity: false, recovery: [] },
            duration: { unit: "instantaneous", concentration: false, override: false },
            magical: false,
            visibility: { level: {}, requireAttunement: false, requireIdentification: false, requireMagic: false },
        },
        // RANGE IS A SIBLING — separate key in activities map
        range: isRanged
            ? { override: false, unit: "foot", short: 60, long: 120 }
            : { override: false, unit: "foot", reach: 5 },
    };
}

/**
 * Build a utility activity for multiattack.
 */
function buildUtilityActivity() {
    const activityId = foundry.utils.randomID();
    return {
        [activityId]: {
            _id: activityId,
            type: "utility",
            name: "Multiattack",
            activation: { type: "action", override: false, primary: true },
            system: {
                effects: [],
                roll: { prompt: false, visible: false },
            },
            target: {
                template: { contiguous: false, unit: "foot" },
                affects: { choice: false },
                prompt: true,
                override: false,
            },
            description: "",
            flags: {},
            sort: 0,
            consumption: { targets: [], scale: { allowed: false } },
            uses: { spent: 0, consumeQuantity: false, recovery: [] },
            duration: { unit: "instantaneous", concentration: false, override: false },
            magical: false,
            visibility: { level: {}, requireAttunement: false, requireIdentification: false, requireMagic: false },
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
            type: { value: "melee" },
            damage: { base: {} },
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
            type: { value: "ranged" },
            damage: { base: {} },
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

    // BF item type is "feature" not "feat"
    if (item.type === "feat") {
        item.type = "feature";
    }

    // Convert dnd5e-format activation to BF utility activity
    // (for bonus action features like Misty Step, Cunning Action)
    if (item.system?.activation?.type && item.system.activation.type !== "none" && item.type !== "weapon") {
        const activityId = foundry.utils.randomID();
        const dndActivation = item.system.activation;
        const dndRange = item.system.range || {};
        item.system.activities = {
            [activityId]: {
                _id: activityId,
                type: "utility",
                name: item.name,
                activation: {
                    type: dndActivation.type,
                    value: dndActivation.cost || null,
                    condition: dndActivation.condition || "",
                    override: false,
                    primary: true,
                },
                system: {
                    effects: [],
                    roll: { prompt: false, visible: false },
                },
                target: {
                    template: { contiguous: false, unit: "foot" },
                    affects: { choice: false },
                    override: false,
                    prompt: true,
                },
                description: "",
                flags: {},
                sort: 0,
                consumption: { targets: [], scale: { allowed: false } },
                uses: { spent: 0, consumeQuantity: false, recovery: [] },
                duration: { unit: "instantaneous", concentration: false, override: false },
                magical: false,
                visibility: { level: {}, requireAttunement: false, requireIdentification: false, requireMagic: false },
            },
        };
        // If the feature has range/target data, add range as sibling
        if (dndRange.value || dndRange.units) {
            item.system.activities.range = {
                override: false,
                unit: "foot",
                short: dndRange.value || null,
                long: dndRange.long || null,
            };
        }
    }

    // Replace "this creature" with BF's [[lookup @name lowercase]] syntax
    if (item.system?.description?.value) {
        item.system.description.value = item.system.description.value
            .replace(/this creature/gi, "the [[lookup @name lowercase]]");
    }

    // Build BF activity from bfActivity metadata
    // (for features with activation "none" or no activation in dnd5e format)
    if (feature.bfActivity?.type && item.type !== "weapon") {
        const bfType = feature.bfActivity.type;
        const bfActivation = feature.bfActivity.activation || "none";
        const activityId = foundry.utils.randomID();

        if (bfType === "damage") {
            // Damage activity — auto-dealt damage, no attack roll or save
            // Use custom formula for half-damage: floor((DpACalc)/divideDmg)
            let dmgPart = stats.DpACalc;
            if (feature.divideDmg) {
                dmgPart = `floor((${dmgPart})/${feature.divideDmg})`;
            }
            item.system.activities = {
                [activityId]: {
                    _id: activityId, type: "damage", name: item.name,
                    activation: { type: bfActivation, override: false, primary: true },
                    system: {
                        damage: {
                            parts: [{
                                custom: { enabled: true, formula: dmgPart },
                                number: 0, denomination: 0, bonus: "",
                                type: "", scaling: { number: 1 },
                            }],
                        },
                        effects: [],
                    },
                    target: {
                        template: { type: "sphere", size: String(item.system?.target?.value || 10), count: "1", contiguous: false, unit: "foot" },
                        affects: { type: "creature", choice: false },
                        prompt: false, override: false,
                    },
                    description: "", flags: {}, sort: 0,
                    consumption: { targets: [], scale: { allowed: false } },
                    uses: { spent: 0, consumeQuantity: false, recovery: [] },
                    duration: { unit: "instantaneous", concentration: false, override: false },
                    magical: false,
                    visibility: { level: {}, requireAttunement: false, requireIdentification: false, requireMagic: false },
                },
                range: { override: false, unit: "foot", short: item.system?.range?.value || 10 },
            };
        } else if (bfType === "save") {
            // Non-damaging save activity (Knockdown, Restraining Grab)
            const abilities = feature.bfActivity.abilities || ["strength"];
            const dcFormula = String(parseInt(stats.ACDC) || 10);
            item.system.activities = {
                [activityId]: {
                    _id: activityId, type: "save", name: item.name,
                    activation: { type: bfActivation, override: false, primary: true },
                    system: {
                        save: { ability: abilities, dc: { formula: dcFormula } },
                        damage: { parts: [] },
                        effects: [],
                    },
                    target: {
                        template: { count: "", type: "", unit: "foot", contiguous: false },
                        affects: { choice: false },
                        prompt: true, override: false,
                    },
                    description: "", flags: {}, sort: 0,
                    consumption: { targets: [], scale: { allowed: false } },
                    uses: { spent: 0, consumeQuantity: false, recovery: [] },
                    duration: { unit: "instantaneous", concentration: false, override: false },
                    magical: false,
                    visibility: { level: {}, requireAttunement: false, requireIdentification: false, requireMagic: false },
                },
                range: { override: false, unit: "foot", reach: 5 },
            };
        } else if (bfType === "check") {
            // Ability check activity (Restraining Grab)
            // BF check activities use system.check (NOT system.save)
            // check.ability = single base ability, check.associated = skills that can contribute
            const dcFormula = String(parseInt(stats.ACDC) || 10);
            item.system.activities = {
                [activityId]: {
                    _id: activityId, type: "check", name: item.name,
                    activation: { type: bfActivation, override: false, primary: true },
                    system: {
                        check: {
                            associated: feature.bfActivity.abilities || ["acrobatics", "athletics"],
                            dc: { calculation: "", formula: dcFormula },
                        },
                        damage: { parts: [] },
                        effects: [],
                    },
                    target: {
                        template: { count: "", type: "", unit: "foot", contiguous: false },
                        affects: { choice: false },
                        prompt: true, override: false,
                    },
                    description: "", flags: {}, sort: 0,
                    consumption: { targets: [], scale: { allowed: false } },
                    uses: { spent: 0, consumeQuantity: false, recovery: [] },
                    duration: { unit: "instantaneous", concentration: false, override: false },
                    magical: false,
                    visibility: { level: {}, requireAttunement: false, requireIdentification: false, requireMagic: false },
                },
                range: { override: false, unit: "foot", reach: 5 },
            };
        } else if (bfType === "attack") {
            // Attack activity for feat-type features (Energy Weapons CR damage)
            const dice = parseDice(stats.DpACalc);
            const crVal = parseCR(stats.CR);
            const crBonus = Math.max(1, Math.floor(crVal));
            dice.modifier = (dice.modifier || 0) + crBonus;
            item.system.activities = {
                [activityId]: {
                    _id: activityId, type: "attack", name: item.name,
                    activation: { type: bfActivation, override: false, primary: true },
                    system: {
                        attack: { flat: true, bonus: stats.PAB || "+2", critical: {}, type: {} },
                        damage: {
                            parts: [{
                                number: dice.count, denomination: dice.die,
                                bonus: dice.modifier ? String(dice.modifier) : "",
                                custom: { enabled: false }, type: "", scaling: { number: 1 },
                            }],
                            critical: {},
                            includeBase: true,
                        },
                        effects: [],
                    },
                    target: {
                        template: { count: "", type: "", unit: "foot", contiguous: false },
                        affects: { choice: false },
                        prompt: true, override: false,
                    },
                    description: "", flags: {}, sort: 0,
                    consumption: { targets: [], scale: { allowed: false } },
                    uses: { spent: 0, consumeQuantity: false, recovery: [] },
                    duration: { unit: "instantaneous", concentration: false, override: false },
                    magical: false,
                    visibility: { level: {}, requireAttunement: false, requireIdentification: false, requireMagic: false },
                },
                range: { override: false, unit: "foot", reach: 5 },
            };
        }
    }

    // Handle damage-replacing weapon features: build BF attack activity
    if (feature.isDmg && item.system && item.type === "weapon") {
        const dice = parseDice(stats.DpACalc);
        if (feature.crBonusDmg) {
            const crVal = parseCR(stats.CR);
            const bonus = Math.max(1, Math.floor(crVal));
            dice.modifier = (dice.modifier || 0) + bonus;
        }
        const activityId = foundry.utils.randomID();
        const isRanged = item.system.actionType === "rwak";
        const dndRange = item.system.range || {};
        const dndActivation = item.system.activation || {};
        item.system.activities = {
            [activityId]: {
                _id: activityId,
                type: "attack",
                name: item.name,
                activation: {
                    type: dndActivation.type || "action",
                    value: dndActivation.cost || null,
                    condition: dndActivation.condition || "",
                    override: false,
                    primary: true,
                },
                system: {
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
                            custom: { enabled: false },
                            type: "",
                            scaling: { number: 1 },
                        }],
                        critical: {},
                        includeBase: true,
                    },
                    effects: [],
                },
                target: {
                    template: { count: "", type: "", unit: "foot", contiguous: false },
                    affects: { choice: false },
                    prompt: true,
                    override: false,
                },
                description: "",
                flags: {},
                sort: 0,
                consumption: { targets: [], scale: { allowed: false } },
                uses: { spent: 0, consumeQuantity: false, recovery: [] },
                duration: { unit: "instantaneous", concentration: false, override: false },
                magical: false,
                visibility: { level: {}, requireAttunement: false, requireIdentification: false, requireMagic: false },
            },
            // RANGE AS SIBLING
            range: {
                override: false,
                unit: "foot",
                short: dndRange.value || (isRanged ? 60 : null),
                long: dndRange.long || (isRanged ? 120 : null),
                reach: isRanged ? null : 5,
            },
        };
    }

    // Handle save-based damage features (Damaging Burst etc.)
    // ONE save activity with ability as an array. Range is sibling.
    if (feature.isDmg && feature.hasSave && item.system && item.type === "feature") {
        const dpR = parseInt(stats.DpR) || 0;
        const bonus = Math.max(0, Math.floor(dpR / 2) - 3);
        const saveAbilities = (feature.saveAbilities?.length)
            ? feature.saveAbilities
            : (item.system.save?.ability ? [item.system.save.ability] : ["dexterity"]);
        const dcFormula = String(parseInt(stats.ACDC) || 10);
        const dndActivation = item.system.activation || {};
        const dndTarget = item.system.target || {};
        const dndRange = item.system.range || {};
        const activityId = foundry.utils.randomID();

        item.system.activities = {
            [activityId]: {
                _id: activityId,
                type: "save",
                name: feature.item.name,
                activation: {
                    type: dndActivation.type || "action",
                    value: dndActivation.cost || null,
                    condition: dndActivation.condition || "",
                    override: false,
                    primary: true,
                },
                system: {
                    save: {
                        ability: saveAbilities,
                        dc: { formula: dcFormula },
                    },
                    damage: {
                        parts: [{
                            number: 1, denomination: 6,
                            bonus: bonus ? String(bonus) : "",
                            custom: { enabled: false },
                            type: "",
                            scaling: { number: 1 },
                        }],
                        onSave: "half",
                    },
                    effects: [],
                },
                target: {
                    template: {
                        type: dndTarget.type || "sphere",
                        size: String(dndTarget.value || 10),
                        count: "1",
                        contiguous: false,
                        unit: "foot",
                    },
                    affects: { type: "creature", choice: false },
                    override: false,
                    prompt: true,
                },
                description: "",
                flags: {},
                sort: 0,
                consumption: { targets: [], scale: { allowed: false } },
                uses: { spent: 0, consumeQuantity: false, recovery: [] },
                duration: { unit: "instantaneous", concentration: false, override: false },
                magical: false,
                visibility: { level: {}, requireAttunement: false, requireIdentification: false, requireMagic: false },
            },
            // RANGE AS SIBLING
            range: {
                override: false,
                unit: "foot",
                short: dndRange.value || null,
                long: dndRange.long || null,
            },
        };
    }

    // Handle damage-replacing features (weapon-type, NOT save-based)
    if (feature.isDmg && !feature.hasSave && item.system) {
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

    // After building BF activities, DELETE all dnd5e legacy fields
    // BF reads ONLY from activities — any legacy fields interfere
    if (item.system?.activities && Object.keys(item.system.activities).length > 0) {
        delete item.system.target;
        delete item.system.range;
        delete item.system.save;
        delete item.system.activation;
        delete item.system.actionType;
        delete item.system.ability;
        delete item.system.attackBonus;
        delete item.system.damage;       // dnd5e format, BF uses activities
        delete item.system.properties;   // dnd5e weapon properties
        delete item.system.proficient;   // dnd5e weapon proficiency
    }

    // Handle effect features (Energy Weapons bonus damage)
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

    // Build BF attributes with perception/stealth from archetype skills
    const attrs = {
        ac: { flat: parseInt(stats.ACDC) || 10, calc: "natural", baseFormulas: ["natural"] },
        hp: { value: parseInt(stats.HP) || 10, max: parseInt(stats.HP) || 10 },
        prof: parseInt(stats.PAB) || 2,
        cr,
        movement: { walk: stats.speed || 30, units: "ft" },
    };

    // Quick Creatures BF: perception = 10 + WIS mod (NO PB), stealth = 10 + DEX mod (NO PB)
    // If archetype lists specific skill values, substitute them
    if (stats.skills) {
        const wisMod = bfAbilities.wisdom?.mod || 0;
        const dexMod = bfAbilities.dexterity?.mod || 0;

        if (stats.skills.prc !== undefined) {
            attrs.perception = 10 + (stats.skills.prc || wisMod);
        }
        if (stats.skills.ste !== undefined) {
            attrs.stealth = 10 + (stats.skills.ste || dexMod);
        }
    }

    return {
        name,
        type: "npc",
        img: tokenPath,
        system: {
            attributes: attrs,
            traits: { type: { value: type.toLowerCase() } },
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
