/**
 * Actor creation logic for Quick Creatures.
 *
 * Reads form data from the ApplicationV2 window, loads the appropriate
 * system adapter, builds item data, creates the Actor, and embeds items.
 */

import { registry } from "../registry.js";
import * as dnd5eAdapter from "../systems/dnd5e-adapter.js";
import * as blackFlagAdapter from "../systems/black-flag-adapter.js";

/** @type {string} Base path for module assets */
const MODULE_PATH = "modules/quick-creatures";

/** System adapter lookup (static imports — no code splitting) */
const ADAPTERS = {
    "dnd5e": dnd5eAdapter,
    "black-flag": blackFlagAdapter,
};

/**
 * Get the system adapter for the active game system.
 * @returns {Object} The adapter module
 */
function getAdapter() {
    const systemId = game.system.id;
    const adapter = ADAPTERS[systemId];
    if (!adapter) {
        throw new Error(`Quick Creatures: Unsupported system "${systemId}". Supported: dnd5e, black-flag`);
    }
    return adapter;
}

/**
 * Read all form data from the ApplicationV2 app's HTML.
 * @param {ApplicationV2} app - The QuickCreaturesApp instance
 * @param {HTMLElement} html - The rendered HTML element
 * @returns {Object} Parsed form data
 */
function readFormData(app, html) {
    const crSelect = html.querySelector("#cr-value");
    const archetypeSelect = html.querySelector("#archetype-select");
    const typeSelect = html.querySelector("#monster-type");
    const nameInput = html.querySelector("#creature-name");

    // Determine which tab is active and get the stats accordingly
    let stats = null;
    let isArchetypeMode = false;

    const crTab = html.querySelector('[data-tab="tab_cr"]');
    const archetypeTab = html.querySelector('[data-tab="tab_archetype"]');

    if (crTab && crTab.classList.contains("active")) {
        // CR mode
        if (crSelect) {
            const selectedOption = crSelect.options[crSelect.selectedIndex];
            if (selectedOption && selectedOption.dataset.stats) {
                try {
                    stats = JSON.parse(selectedOption.dataset.stats);
                } catch (e) {
                    console.error("Quick Creatures | Failed to parse CR stats:", e);
                }
            }
        }
    } else if (archetypeTab && archetypeTab.classList.contains("active")) {
        // Archetype mode
        isArchetypeMode = true;
        if (archetypeSelect) {
            const selectedOption = archetypeSelect.options[archetypeSelect.selectedIndex];
            if (selectedOption && selectedOption.dataset.stats) {
                try {
                    stats = JSON.parse(selectedOption.dataset.stats);
                    // Archetype data may have abilities directly
                } catch (e) {
                    console.error("Quick Creatures | Failed to parse archetype stats:", e);
                }
            }
        }
    }

    // Fallback: try CR select if nothing found
    if (!stats && crSelect) {
        const selectedOption = crSelect.options[crSelect.selectedIndex];
        if (selectedOption && selectedOption.dataset.stats) {
            try { stats = JSON.parse(selectedOption.dataset.stats); } catch (e) {}
        }
    }

    // Monster type
    const monsterType = typeSelect
        ? typeSelect.options[typeSelect.selectedIndex]?.value || "Aberration"
        : "Aberration";

    // Creature name
    const creatureName = nameInput ? nameInput.value.trim() : "";

    // Creature size
    const sizeSelect = html.querySelector("#creature-size");
    const creatureSize = sizeSelect
        ? sizeSelect.options[sizeSelect.selectedIndex]?.value || "Medium"
        : "Medium";

    // Ability save proficiencies (checkboxes)
    const abilityKeys = ["str", "dex", "con", "int", "wis", "cha"];
    const saveProfs = {};
    for (const abl of abilityKeys) {
        const checkbox = html.querySelector(`#${abl}Bonus`);
        saveProfs[abl] = checkbox ? checkbox.checked : false;
    }

    // Selected features (from checkboxes)
    const featureCBs = html.querySelectorAll(".qc-feature-cb");
    const features = [];
    for (const cb of featureCBs) {
        if (cb.checked) {
            const checkLabel = cb.closest(".qc-feature-check");
            if (checkLabel && checkLabel.dataset.feature) {
                try {
                    features.push(JSON.parse(checkLabel.dataset.feature));
                } catch (e) {}
            }
        }
    }

    return {
        stats,
        monsterType,
        creatureName,
        saveProfs,
        features,
        creatureSize,
        isArchetypeMode,
    };
}

/**
 * Create an Actor from the form data in the QuickCreaturesApp.
 * @param {ApplicationV2} app - The QuickCreaturesApp instance
 * @param {HTMLElement} html - The rendered HTML element
 * @returns {Promise<Actor>} The created Actor
 */
export async function createActor(app, html) {
    const formData = readFormData(app, html);
    const { stats, monsterType, creatureName, saveProfs, features, creatureSize, isArchetypeMode } = formData;

    if (!stats) {
        ui.notifications.error(game.i18n.localize("quick-creatures.create.noStats"));
        return null;
    }

    console.log(`Quick Creatures | Creating monster: type=${monsterType}, CR=${stats.CR || "N/A"}, mode=${isArchetypeMode ? "archetype" : "CR"}`);

    // Load the system adapter
    let adapter;
    try {
        adapter = getAdapter();
    } catch (e) {
        ui.notifications.error(game.i18n.localize("quick-creatures.create.unsupportedSystem"));
        console.error("Quick Creatures | Adapter load error:", e);
        return null;
    }

    // Track number of attacks for multiattack description (features can reduce it)
    let multiAtkCount = parseInt(stats.NoA) || 1;

    // Build feature items
    const featureItems = [];
    for (const feature of features) {
        // Some features reduce attacks
        if (feature.reduceAtk) {
            multiAtkCount = Math.max(1, multiAtkCount - 1);
        }
        const item = adapter.createFeatureItem(feature, stats);
        if (item) {
            featureItems.push(item);
        }
    }

    // Build attack items: Melee + Ranged (pushed to items array)
    // Items array order: features first, then melee, then ranged
    const meleeItem = adapter.createAttackItem(stats);
    const rangedItem = adapter.createRangedItem(stats);

    // Build multiattack feature first (appears before attacks)
    if (multiAtkCount > 1) {
        const multiItem = adapter.createMultiattackItem(multiAtkCount);
        if (multiItem) featureItems.push(multiItem);
    }

    // Then add attacks (melee before ranged in the sheet)
    const attackItems = [];
    if (meleeItem) attackItems.push(meleeItem);
    if (rangedItem) attackItems.push(rangedItem);

    // Determine abilities
    let abilities;
    if (stats.abilities) {
        // Archetype mode provides explicit ability scores
        abilities = stats.abilities;
    } else {
        // CR mode: all modifiers start at 0; checked saves get proficiency bonus
        abilities = {};
        const profBonus = parseInt(stats.PAB) || 2;
        const ablMap = { str: "strength", dex: "dexterity", con: "constitution", int: "intelligence", wis: "wisdom", cha: "charisma" };
        for (const [short, long] of Object.entries(ablMap)) {
            abilities[long] = {
                value: 10,
                mod: saveProfs[short] ? profBonus : 0,
                proficient: saveProfs[short] ? 1 : 0,
            };
        }
    }

    // Token image path
    const tokenPath = `${MODULE_PATH}/tokens/${monsterType.toLowerCase()}.png`;

    // Build actor name: use user-provided name, or auto-generate
    const name = creatureName || `${monsterType} (CR ${stats.CR || "?"})`;

    // Build actor data through the adapter
    const actorData = adapter.buildActorData(name, stats, monsterType, abilities, tokenPath);

    // Create the actor
    let actor;
    try {
        actor = await Actor.create(actorData);
    } catch (e) {
        console.error("Quick Creatures | Actor creation failed:", e);
        ui.notifications.error(game.i18n.localize("quick-creatures.create.failed"));
        return null;
    }

    // Set creature size and prototype token dimensions
    const sizeMap = { "Tiny": 0.5, "Small": 1, "Medium": 1, "Large": 2, "Huge": 3, "Gargantuan": 4 };
    const tokenSize = sizeMap[creatureSize] || 1;
    try {
        await actor.update({
            "system.traits.size": creatureSize.toLowerCase(),
            "prototypeToken.width": tokenSize,
            "prototypeToken.height": tokenSize,
        });
    } catch (e) {
        console.warn("Quick Creatures | Failed to set creature size:", e);
    }

    // Apply proficiency active effect (for CR mode where abilities are flat 10s)
    if (!stats.abilities) {
        try {
            await ActiveEffect.createDocuments([{
                name: "Proficiency",
                icon: "icons/sundries/books/book-rounded-red.webp",
                transfer: true,
                changes: [{
                    key: "system.attributes.prof",
                    value: stats.PAB,
                    mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
                }],
            }], { parent: actor });
        } catch (e) {
            console.warn("Quick Creatures | Failed to create proficiency AE:", e);
        }
    }

    // Create embedded items
    const allItems = [...attackItems, ...featureItems];
    if (allItems.length > 0) {
        try {
            await actor.createEmbeddedDocuments("Item", allItems);
        } catch (e) {
            console.warn("Quick Creatures | Failed to create some embedded items:", e);
        }
    }

    // Show success notification
    ui.notifications.info(game.i18n.format("quick-creatures.create.success", { name: actor.name }));

    // Close the app
    app.close();

    return actor;
}
