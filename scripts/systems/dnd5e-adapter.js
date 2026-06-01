/**
 * D&D 5E System Adapter for Quick Creatures.
 *
 * Handles dnd5e-specific data model for dnd5e 5.x (Foundry v13).
 * Uses the activities-based data model (not legacy v4.x fields).
 *
 * All icons and descriptions match the Black Flag adapter for consistency.
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

// ─── Activity Builders ────────────────────────────────────────────────

/**
 * Build a standard attack activity (melee or ranged).
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
                includeBase: false,
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
 * Build a utility activity (no roll — Misty Step, Cunning Action, Multiattack, etc.)
 */
function buildUtilityActivity(activationType) {
    const activityId = foundry.utils.randomID();
    return {
        [activityId]: {
            _id: activityId,
            type: "utility",
            activation: { type: activationType, override: false },
            consumption: { scaling: { allowed: false }, spellSlot: true, targets: [] },
            duration: { units: "inst", concentration: false, override: false },
            target: {
                template: { contiguous: false, units: "ft" },
                affects: {},
                override: false,
                prompt: true,
            },
            uses: { spent: 0, recovery: [] },
            description: {},
            effects: [],
            sort: 0,
        },
    };
}

/**
 * Build a save activity.
 * @param {string} activationType — "action", "bonus", "reaction", "none"
 * @param {string[]} abilities — dnd5e short ability keys ("str","dex","con","int","wis","cha")
 * @param {number} dc — save DC
 * @param {Object|null} dmgPart — optional damage on save
 */
function buildSaveActivity(activationType, abilities, dc, dmgPart) {
    const activityId = foundry.utils.randomID();
    const activity = {
        _id: activityId,
        type: "save",
        activation: { type: activationType, override: false },
        save: {
            ability: abilities,
            dc: { formula: String(dc), calculation: "" },
        },
        damage: {
            parts: [],
            includeBase: false,
            critical: {},
        },
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
    };

    if (dmgPart) {
        activity.damage.parts = [{
            custom: { enabled: true, formula: String(dmgPart) },
            number: 0, denomination: 0, bonus: "",
            types: [], scaling: { number: 1 },
        }];
    }

    return { [activityId]: activity };
}

/**
 * Build a check activity (contested — Restraining Grab escape DC).
 * @param {string[]} skills — skills that can be used
 * @param {number} dc
 */
function buildCheckActivity(skills, dc) {
    const activityId = foundry.utils.randomID();
    return {
        [activityId]: {
            _id: activityId,
            type: "check",
            activation: { type: "special", override: false },
            check: {
                associated: skills,
                dc: { formula: String(dc), calculation: "" },
            },
            damage: {
                parts: [],
                includeBase: false,
                critical: {},
            },
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
 * Build a damage activity (auto-dealt damage — Damaging Aura, Damage Reflection).
 * @param {string} dmgFormula — custom formula string
 * @param {string} activationType
 */
function buildDamageActivity(dmgFormula, activationType) {
    const activityId = foundry.utils.randomID();
    return {
        [activityId]: {
            _id: activityId,
            type: "damage",
            activation: { type: activationType, override: false },
            damage: {
                parts: [{
                    custom: { enabled: true, formula: String(dmgFormula) },
                    number: 0, denomination: 0, bonus: "",
                    types: [], scaling: { number: 1 },
                }],
                includeBase: false,
                critical: {},
            },
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

// ─── Item Constructors ─────────────────────────────────────────────────

/**
 * Create the mandatory "Melee Attack" weapon item.
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
            proficient: true,
            type: { value: "simpleM", baseItem: "" },
            activities: buildAttackActivity(stats, false),
        },
    };
}

/**
 * Create the mandatory "Ranged Attack" weapon item.
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
            proficient: true,
            type: { value: "simpleR", baseItem: "" },
            activities: buildAttackActivity(stats, true),
        },
    };
}

/**
 * Create a multiattack feature item.
 * @param {number} noa — Number of attacks
 */
export function createMultiattackItem(noa) {
    return {
        name: "Multiattack",
        type: "feat",
        img: "icons/skills/melee/strike-weapons-orange.webp",
        system: {
            description: {
                value: `<p>The [[lookup @name lowercase]] makes ${noa} attacks.</p>`,
            },
            activities: buildUtilityActivity("action"),
        },
    };
}

// ─── Feature Factory ───────────────────────────────────────────────────

/**
 * Feature definition: maps feature names to their dnd5e activity builders.
 *
 * Each entry specifies:
 *   - activity: function to build the dnd5e 5.x activities object
 *   - buildProps: args passed to that function (computed from feature + stats)
 *
 * Features NOT listed here are simple text-only (no activity needed).
 */
const FEATURE_ACTIVITIES = {
    /** Damaging Blast: ranged attack using chart damage */
    "Damaging Blast": (feature, stats) => ({
        activities: _buildFeatureAttack(stats, "action"),
        description: `<p>[[/attack extended]]. [[/damage average extended]]. The [[lookup @name lowercase]] has one or more single-target ranged attacks which deal damage of an appropriate type.</p>`,
        img: "icons/magic/light/beam-rays-magenta.webp",
        weaponType: "simpleR",
    }),

    /** Damage Reflection: half of one attack's damage as a reaction */
    "Damage Reflection": (feature, stats) => {
        const halfDmg = `floor((${stats.DpACalc})/2)`;
        return {
            activities: buildDamageActivity(halfDmg, "reaction"),
            description: `<p>Whenever a creature within 5 feet of the [[lookup @name lowercase]] hits them with a melee attack, the attacker takes damage in return of a type appropriate to the creature. The damage dealt is equal to half the damage of one of the [[lookup @name lowercase]]'s attacks. [[/damage average extended]]</p>`,
        };
    },

    /** Damaging Aura: half damage, triggers automatically (special activation) */
    "Damaging Aura": (feature, stats) => {
        const halfDmg = `floor((${stats.DpACalc})/2)`;
        return {
            activities: buildDamageActivity(halfDmg, "special"),
            description: `<p>Each creature who starts their turn within 10 feet of the [[lookup @name lowercase]] takes damage of a type appropriate to the creature. The damage dealt is equal to half the damage of one of this creature's attacks. [[/damage average extended]]</p>`,
        };
    },

    /** Damaging Burst: save for half damage, 10ft sphere, 120ft range.
     *  Uses BF formula: 1d6 + floor(DpR / 2) - 3 (min +0).
     *  DC from ACDC chart column. */
    "Damaging Burst": (feature, stats) => {
        const burstDmg = `max(0, 1d6 + floor(${Number(stats.DpR)} / 2) - 3)`;
        const dc = stats.ACDC || 13;
        return {
            activities: buildSaveActivity("action", ["dex", "con", "wis"], dc, burstDmg),
            description: `<p>As an action, the [[lookup @name lowercase]] can create a burst of energy, magic, spines, or some other effect in a 10-foot-radius sphere, either around themself or at a point within 120 feet. Each creature in that area must make a [[/save]] saving throw (your choice, based on the type of burst). On a failure, a target takes damage of an appropriate type equal to half this creature's total damage per round [[/damage average extended]]. On a success, a target takes half as much damage.</p>`,
            img: "icons/magic/sonic/explosion-shock-sound-wave.webp",
        };
    },

    /** Knockdown: Strength save vs prone, triggers on hit */
    "Knockdown": (feature, stats) => {
        const dc = stats.ACDC || 13;
        return {
            activities: buildSaveActivity("special", ["str"], dc, null),
            description: `<p>When the [[lookup @name lowercase]] hits a target with a melee attack, the target must succeed on a [[/save]] saving throw or be knocked &Reference[prone].</p>`,
        };
    },

    /** Restraining Grab: grapple + restrained, contested check to escape.
     *  Triggers on hit like Knockdown. Skills use short codes (acr, ath). */
    "Restraining Grab": (feature, stats) => {
        const dc = stats.ACDC || 13;
        return {
            activities: buildCheckActivity(["acr", "ath"], dc),
            description: `<p>When the [[lookup @name lowercase]] hits a target with a melee attack, the target is &Reference[grappled] ([[/check]] to escape). While grappled, the target is &Reference[restrained].</p>`,
        };
    },

    /** Misty Step: bonus action teleport */
    "Misty Step": (feature, stats) => ({
        activities: buildUtilityActivity("bonus"),
        description: `<p>As a bonus action, the [[lookup @name lowercase]] can teleport up to 30 feet to an unoccupied space they can see.</p>`,
        img: "icons/magic/lightning/orb-ball-spiral-blue.webp",
    }),

    /** Cunning Action: bonus action Dash/Disengage/Hide */
    "Cunning Action": (feature, stats) => ({
        activities: buildUtilityActivity("bonus"),
        description: `<p>The [[lookup @name lowercase]] takes the &Reference[Dash apply=false], the &Reference[Disengage apply=false], or &Reference[Hide apply=false] action.</p>`,
        img: "icons/magic/control/hypnosis-mesmerism-watch.webp",
    }),

    /** Damage Transference: reaction utility */
    "Damage Transference": (feature, stats) => ({
        activities: buildUtilityActivity("reaction"),
        description: `<p>When the [[lookup @name lowercase]] takes damage, they can transfer half or all of that damage (your choice) to a willing creature within 30 or 60 feet of them.</p>`,
    }),

    /** Energy Weapons: adds CR as extra damage to the feature attack. */
    "Energy Weapons": (feature, stats) => ({
        activities: _buildFeatureAttack(stats, "action", Number(stats.CR) || 0),
        description: `<p>[[/attack extended]]. [[/damage average extended]]. The [[lookup @name lowercase]]'s weapon attacks deal extra CR damage of an appropriate type. You can add this damage on top of the creature's regular damage output to give them a combat boost, or you can replace some of the creature's normal weapon damage with this energy damage.</p>`,
        img: "icons/magic/fire/dagger-rune-enchant-flame-blue-yellow.webp",
        weaponType: "simpleM",
    }),
};

/**
 * Build a feature-only attack activity (for Damaging Blast, Energy Weapons).
 * @param {Object} stats — stat block
 * @param {string} activationType
 * @param {number} extraDamage — optional flat damage to add (CR for Energy Weapons)
 */
function _buildFeatureAttack(stats, activationType, extraDamage = 0) {
    const dice = parseDice(stats.DpACalc);
    const bonus = extraDamage ? String(dice.modifier + extraDamage) : (dice.modifier ? String(dice.modifier) : "");
    const activityId = foundry.utils.randomID();
    return {
        [activityId]: {
            _id: activityId,
            type: "attack",
            activation: { type: activationType, override: false },
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
                    bonus: bonus,
                    types: [],
                    custom: { enabled: false },
                    scaling: { number: 1 },
                }],
                includeBase: false,
                critical: {},
            },
            range: { value: 60, long: 120, units: "ft", override: false },
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
 * Create a feature Item data object from a feature definition.
 *
 * This builds proper dnd5e 5.x activities based on the feature name,
 * NOT the legacy v4.x template in features.js (which is only used for BF conversion).
 *
 * @param {Object} feature — Raw feature object from MONSTER_FEATURES
 * @param {Object} stats — Current stat block
 * @returns {Object|null} Item data or null
 */
export function createFeatureItem(feature, stats) {
    if (!feature) return null;

    const name = feature.name;
    const builder = FEATURE_ACTIVITIES[name];

    // Features without a builder are text-only — use a simple feat with description
    if (!builder) {
        return {
            name: feature.name,
            type: "feat",
            img: feature.item?.img || "icons/sundries/books/book-black-grey.webp",
            system: {
                description: {
                    value: feature.item?.system?.description?.value || feature.desc || "",
                },
            },
        };
    }

    // Build the feature using the activity builder
    const built = builder(feature, stats);

    const itemData = {
        name: feature.name,
        type: built.weaponType ? "weapon" : "feat",
        img: built.img || feature.item?.img || "icons/sundries/books/book-black-grey.webp",
        system: {
            description: {
                value: built.description || feature.item?.system?.description?.value || feature.desc || "",
            },
        },
    };

    // If it's a weapon type (Damaging Blast, Energy Weapons), set weapon fields
    if (built.weaponType) {
        itemData.system.proficient = true;
        itemData.system.type = { value: built.weaponType, baseItem: "" };
    }

    // Attach activities
    if (built.activities) {
        itemData.system.activities = built.activities;
    }

    return itemData;
}

// ─── Actor Builder ─────────────────────────────────────────────────────

/**
 * Parse CR string to a number (handles fractions like "1/8", "1/4", "1/2").
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
 */
export function buildActorData(name, stats, type, abilities, tokenPath, portraitPath = tokenPath) {
    const cr = parseCR(stats.CR);

    // Convert CR-mode abilities (detected by mod field) to real 5E scores
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
    } else {
        // Archetype abilities: already short keys (str, dex). Primary
        // abilities (proficient:1) have BF-inflated values. Compute real
        // dnd5e score from inflated value, add global save/check bonuses
        // the same way CR mode does.
        const pb = parseInt(stats.PAB) || 2;
        const prof5E = get5EProf(pb);
        for (const [key, abl] of Object.entries(abilities)) {
            const isPrimary = abl?.proficient === 1;
            if (isPrimary) {
                const inflatedMod = Math.floor((abl.value - 10) / 2);
                const realMod = inflatedMod - prof5E;
                abilities[key] = {
                    value: 10 + realMod * 2,
                    proficient: 0,
                    bonuses: { check: String(prof5E), save: String(prof5E) },
                };
            }
        }
    }

    const data = {
        name,
        type: "npc",
        img: portraitPath,
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
            displayName: CONST.TOKEN_DISPLAY_MODES.HOVER,
            displayBars: CONST.TOKEN_DISPLAY_MODES.OWNER,
            lockRotation: true,
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
