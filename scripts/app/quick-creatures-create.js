/**
 * Actor creation logic for Quick Creatures.
 *
 * Reads form data from the ApplicationV2 window, loads the appropriate
 * system adapter, builds item data, creates the Actor, and embeds items.
 */

import { registry } from "../registry.js";
import * as dnd5eAdapter from "../systems/dnd5e-adapter.js";
import * as blackFlagAdapter from "../systems/black-flag-adapter.js";
import { getDefaultToken, getDefaultTokenEntry, tokenImagePath } from "../data/token-packs.js";
import { CR_TABLE } from "../data/cr-table.js";
import { deriveAdvancedStats } from "./advanced-adjustments.js";

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

function getRenameOverrides(app) {
    return app?.getRenameOverrides?.() || new Map();
}

function getDroppedItems(app) {
    return app?.getDroppedItems?.() || [];
}

function applyRenameOverride(item, renameOverrides, kind, key, originalName = item?.name) {
    const override = renameOverrides.get(`${kind}:${key || originalName}`);
    if (override && item) item.name = override;
    return item;
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
                    // Merge chart values (DpR, etc.) for features that need them
                    if (stats && stats.CR) {
                        const chartRow = CR_TABLE.find(r => r.CR === stats.CR);
                        if (chartRow) {
                            for (const [k, v] of Object.entries(chartRow)) {
                                if (!(k in stats)) stats[k] = v;
                            }
                        }
                    }
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
    const defaultType = game.settings?.get("quick-creatures", "defaultType") || "Aberration";
    const monsterType = typeSelect
        ? typeSelect.options[typeSelect.selectedIndex]?.value || defaultType
        : defaultType;

    // Creature name
    const creatureName = nameInput ? nameInput.value.trim() : "";

    // Creature size — map numeric index (pre-0.2.0 array choices) to size name
    const SIZES = ["Tiny", "Small", "Medium", "Large", "Huge", "Gargantuan"];
    const sizeSelect = html.querySelector("#creature-size");
    const rawSize = game.settings?.get("quick-creatures", "defaultSize") || "Medium";
    const defaultSize = SIZES[parseInt(rawSize)] || rawSize;
    const creatureSize = sizeSelect
        ? sizeSelect.options[sizeSelect.selectedIndex]?.value || defaultSize
        : defaultSize;

    // Ability save proficiencies (3-state: off / full / half)
    const abilityKeys = ["str", "dex", "con", "int", "wis", "cha"];
    const saveProfs = {};
    for (const abl of abilityKeys) {
        const toggle = html.querySelector(`.qc-ability-toggle[data-ability="${abl}"]`);
        saveProfs[abl] = toggle ? toggle.dataset.state : "off";
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

    // Dynamic token ring checkbox
    const dynamicRingCB = html.querySelector("#dynamic-ring");
    const dynamicRing = dynamicRingCB ? dynamicRingCB.checked : false;

    const droppedItems = getDroppedItems(app);

    return {
        stats,
        monsterType,
        creatureName,
        saveProfs,
        features,
        droppedItems,
        creatureSize,
        isArchetypeMode,
        dynamicRing,
    };
}

/**
 * Build prototype token update data for size, texture scale, and dynamic ring.
 * @param {string} creatureSize
 * @param {number} tokenArtworkScale
 * @param {boolean} dynamicRing
 * @param {string} tokenPath
 * @param {string|null} tokenSubjectPath
 * @returns {object}
 */
export function buildPrototypeTokenUpdates(creatureSize, tokenArtworkScale, dynamicRing, tokenPath, tokenSubjectPath = null) {
    const sizeMap = { "Tiny": 0.5, "Small": 1, "Medium": 1, "Large": 2, "Huge": 3, "Gargantuan": 4 };
    const sizeAbbrev = game.system.id === "dnd5e"
        ? { "Tiny": "tiny", "Small": "sm", "Medium": "med", "Large": "lg", "Huge": "huge", "Gargantuan": "grg" }
        : null;
    const tokenSize = sizeMap[creatureSize] || 1;
    const scale = Number(tokenArtworkScale) || 1;
    const updates = {
        "system.traits.size": (sizeAbbrev ? sizeAbbrev[creatureSize] : creatureSize.toLowerCase()),
        "prototypeToken.width": tokenSize,
        "prototypeToken.height": tokenSize,
        "prototypeToken.texture.scaleX": scale,
        "prototypeToken.texture.scaleY": scale,
    };
    if (dynamicRing) {
        updates["prototypeToken.ring.enabled"] = true;
        updates["prototypeToken.ring.subject.texture"] = tokenSubjectPath || tokenPath;
        updates["prototypeToken.ring.subject.scale"] = scale;
    }
    return updates;
}

/**
 * Create an Actor from the form data in the QuickCreaturesApp.
 * @param {ApplicationV2} app - The QuickCreaturesApp instance
 * @param {HTMLElement} html - The rendered HTML element
 * @returns {Promise<Actor>} The created Actor
 */
export async function createActor(app, html) {
    const formData = readFormData(app, html);
    const { stats, monsterType, creatureName, saveProfs, features, droppedItems: droppedItemInputs, creatureSize, isArchetypeMode, dynamicRing } = formData;
    const renameOverrides = getRenameOverrides(app);

    if (!stats) {
        ui.notifications.error(game.i18n.localize("quick-creatures.create.noStats"));
        return null;
    }

    console.log(`Quick Creatures | Creating monster: type=${monsterType}, CR=${stats.CR || "N/A"}, mode=${isArchetypeMode ? "archetype" : "CR"}`);

    const advancedState = app?.getAdvancedState?.() || { enabled: false, adjustments: {} };
    const advancedEnabled = advancedState.enabled && !isArchetypeMode;
    const creationStats = deriveAdvancedStats(stats, advancedState.adjustments, { enabled: advancedEnabled });

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
    let multiAtkCount = parseInt(creationStats.NoA) || 1;

    // Build feature items
    const featureItems = [];
    for (const feature of features) {
        // Some features reduce attacks
        if (feature.reduceAtk) {
            multiAtkCount = Math.max(1, multiAtkCount - 1);
        }
        const item = applyRenameOverride(
            adapter.createFeatureItem(feature, creationStats),
            renameOverrides,
            "feature",
            feature.id || feature.name,
            feature.name,
        );
        if (item) {
            featureItems.push(item);
        }
    }

    // Build attack items: Melee + Ranged (pushed to items array)
    // Items array order: features first, then melee, then ranged
    const meleeItem = applyRenameOverride(adapter.createAttackItem(creationStats), renameOverrides, "attack", "melee", "Melee Attack");
    const rangedItem = applyRenameOverride(adapter.createRangedItem(creationStats), renameOverrides, "attack", "ranged", "Ranged Attack");

    // Build multiattack feature first (appears before attacks)
    if (multiAtkCount > 1) {
        const multiItem = applyRenameOverride(
            adapter.createMultiattackItem(multiAtkCount),
            renameOverrides,
            "attack",
            "multiattack",
            "Multiattack",
        );
        if (multiItem) featureItems.push(multiItem);
    }

    // Then add attacks (melee before ranged in the sheet)
    const attackItems = [];
    if (meleeItem) attackItems.push(meleeItem);
    if (rangedItem) attackItems.push(rangedItem);

    // Build actor name: use user-provided name, or auto-generate
    let name;
    if (creatureName) {
        name = creatureName;
    } else if (isArchetypeMode && stats.name) {
        name = `${monsterType} ${stats.name} (CR ${stats.CR || "?"})`;
    } else {
        name = `${monsterType} (CR ${stats.CR || "?"})`;
    }

    // Determine abilities
    let abilities;
    if (stats.abilities) {
        // Archetype mode provides explicit ability scores (short keys: str, dex, etc.)
        abilities = stats.abilities;
    } else {
        // CR mode: all modifiers start at 0; toggled abilities get full or half PB
        abilities = {};
        const profBonus = parseInt(creationStats.PAB) || 2;
        const halfPB = Math.ceil(profBonus / 2);
        const ablMap = { str: "strength", dex: "dexterity", con: "constitution", int: "intelligence", wis: "wisdom", cha: "charisma" };
        for (const [short, long] of Object.entries(ablMap)) {
            const state = saveProfs[short] || "off";
            const baseMod = state === "full" ? profBonus : state === "half" ? halfPB : 0;
            const advancedAbilityMod = state === "off" && advancedEnabled ? Number(creationStats.AdvancedAbilityMods?.[short] || 0) : 0;
            const mod = baseMod + advancedAbilityMod;
            abilities[long] = {
                value: 10,
                mod: mod,
                proficient: state !== "off" ? 1 : 0,
            };
        }
    }

    const droppedItems = [];
    for (const dropped of droppedItemInputs || []) {
        const itemData = dropped.itemData || dropped;
        const normalized = adapter.normalizeDroppedItem
            ? adapter.normalizeDroppedItem(itemData, creationStats, { dropped, formData, abilities })
            : foundry.utils.deepClone(itemData);
        if (normalized) {
            droppedItems.push(applyRenameOverride(
                normalized,
                renameOverrides,
                "dropped",
                dropped.id || normalized.name,
                normalized.name,
            ));
        }
    }

    // Token image path — use user-selected token or pack default
    let tokenPath;
    let tokenSubjectPath = app._currentTokenSubject || null;
    let tokenPortraitPath = app._currentTokenPortrait || null;
    let tokenSubjectScale = app._currentTokenScale ?? 1;
    if (app._currentToken) {
        tokenPath = app._currentToken;
    } else {
        const defaultEntry = await getDefaultTokenEntry(app._tokenPack, monsterType);
        if (defaultEntry) {
            tokenPath = tokenImagePath(app._tokenPack, defaultEntry.file);
            tokenSubjectPath = defaultEntry.subject || null;
            tokenPortraitPath = defaultEntry.portrait || null;
            tokenSubjectScale = defaultEntry.scale ?? 1;
        } else {
            const defaultFile = getDefaultToken("Original_Tokens", monsterType);
            tokenPath = defaultFile
                ? tokenImagePath("Original_Tokens", defaultFile)
                : `${MODULE_PATH}/assets/Original_Tokens/${monsterType}/${monsterType.toLowerCase()}.webp`;
        }
    }

    // Build actor data through the adapter
    const actorData = adapter.buildActorData(name, creationStats, monsterType, abilities, tokenPath, tokenPortraitPath || tokenPath);

    // Create the actor
    let actor;
    try {
        actor = await Actor.create(actorData);
    } catch (e) {
        console.error("Quick Creatures | Actor creation failed:", e);
        ui.notifications.error(game.i18n.localize("quick-creatures.create.failed"));
        return null;
    }

    // Set creature size, token dimensions, artwork scale, and dynamic ring
    try {
        const updates = buildPrototypeTokenUpdates(creatureSize, tokenSubjectScale, dynamicRing, tokenPath, tokenSubjectPath);
        await actor.update(updates);
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
                    value: creationStats.PAB,
                    mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
                }],
            }], { parent: actor });
        } catch (e) {
            console.warn("Quick Creatures | Failed to create proficiency AE:", e);
        }
    }

    // Create embedded items
    const allItems = [...attackItems, ...featureItems, ...droppedItems];
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
