/**
 * QuickCreaturesApp — Main ApplicationV2 window for Quick Creatures.
 *
 * Provides a two-tab interface:
 *   - "Monster by CR": Select a Challenge Rating, get auto-calculated stats
 *   - "Monster by Archetype": Select a pre-built archetype stat block
 *
 * Uses HandlebarsApplicationMixin for template rendering.
 * System-specific data model concerns are handled by adapters in ./systems/.
 */

import { registry } from "../registry.js";
import { createActor } from "./quick-creatures-create.js";
import { CR_TABLE } from "../data/cr-table.js";
import { ARCHETYPES } from "../data/archetypes.js";
import { MONSTER_FEATURES } from "../data/features.js";
import { TokenPickerApp } from "./quick-creatures-tokens.js";
import { CreditsDialog } from "./credits-dialog.js";
import { discoverPacks, getDefaultToken, getDefaultTokenEntry, getTokenSetChoices, tokenImagePath } from "../data/token-packs.js";
import { QuickCreaturesTokenSetConfig } from "./token-set-config.js";

/** @type {string} Base path for module assets */
const MODULE_PATH = "modules/quick-creatures";

/**
 * Register core CC-licensed data into the registry.
 * Called once during module init, before the app can be opened.
 */
function registerCoreData() {
    // Register default monster types (CC data)
    if (registry.getTypes().length === 0) {
        registry.registerTypes("core", [
            { name: "Aberration" },
            { name: "Beast" },
            { name: "Celestial" },
            { name: "Construct" },
            { name: "Dragon" },
            { name: "Elemental" },
            { name: "Fey" },
            { name: "Fiend" },
            { name: "Giant" },
            { name: "Humanoid" },
            { name: "Monstrosity" },
            { name: "Ooze" },
            { name: "Plant" },
            { name: "Undead" },
        ]);
    }

    // Register archetypes if not already registered
    if (registry.getArchetypes().length === 0) {
        registry.registerArchetypes("core", ARCHETYPES);
    }

    // Register features if not already registered
    if (registry.getFeatures().length === 0) {
        registry.registerFeatures("core", MONSTER_FEATURES);
    }
}

/**
 * @extends {ApplicationV2}
 * @mixes {HandlebarsApplicationMixin}
 */
class QuickCreaturesApp extends foundry.applications.api.HandlebarsApplicationMixin(
    foundry.applications.api.ApplicationV2
) {
    /** @type {string} Currently selected token pack ID */
    _tokenPack = game.settings?.get("quick-creatures", "defaultTokenSet") || "Original_Tokens";

    /** @type {string|null} Path to currently selected token image (relative to pack) */
    _currentToken = null;

    /** @type {string|null} Path to selected dynamic-ring subject image */
    _currentTokenSubject = null;

    /** @type {string|null} Path to selected actor portrait image */
    _currentTokenPortrait = null;

    /** @type {number} Dynamic-ring subject scale for selected token */
    _currentTokenScale = 1;

    /** @type {Array<object>} Available token packs for preview defaults */
    _packs = [];

    /** @override */
    static DEFAULT_OPTIONS = {
        id: "quick-creatures",
        tag: "form",
        window: {
            title: "quick-creatures.app.title",
            icon: "fa-solid fa-spaghetti-monster-flying",
        },
        position: {
            width: 600,
            height: 700,
        },
        form: {
            handler: QuickCreaturesApp.#onSubmit,
            submitOnChange: false,
            closeOnSubmit: false,
        },
        actions: [{
            action: "configure",
            label: "quick-creatures.settings.button",
            icon: "fa-solid fa-gear",
        }],
    };

    /** @override */
    static PARTS = {
        tabs: {
            id: "tabs",
            template: `${MODULE_PATH}/templates/partials/tabs.hbs`,
            classes: ["qc-tabs"],
        },
        content: {
            id: "content",
            template: `${MODULE_PATH}/templates/quick-creatures.hbs`,
            classes: ["qc-content"],
        },
    };

    /** Tab configuration */
    static TABS = {
        tab_cr: {
            id: "tab_cr",
            group: "primary",
            icon: "fa-solid fa-dragon",
            label: "quick-creatures.tabs.cr",
        },
        tab_archetype: {
            id: "tab_archetype",
            group: "primary",
            icon: "fa-solid fa-user-gear",
            label: "quick-creatures.tabs.archetype",
        },
    };

    /**
     * Static form submission handler.
     * @param {Event|SubmitEvent} event
     * @param {HTMLFormElement} form
     * @param {Object} formData
     */
    static async #onSubmit(event, form, formData) {
        const app = this;
        await createActor(app, app.element);
    }

    /** @override — handle header button actions */
    static async _onAction(action) {
        if (action === "configure") {
            const configApp = new game.settings.apps.SettingsConfig({
                namespace: "quick-creatures",
                title: game.i18n.localize("quick-creatures.settings.title"),
            });
            configApp.render({ force: true });
        }
    }

    /** @override */
    async _prepareContext(options) {
        // Pull data from the registry (populated by registerCoreData + plugins)
        const types = registry.getTypes();
        const features = registry.getFeatures();
        const archetypes = registry.getArchetypes();

        // Serialize data for Handlebars templates (add serialized JSON for data attributes)
        const crStats = CR_TABLE.map(s => ({
            ...s,
            serialized: JSON.stringify(s),
        }));

        const serializedArchetypes = archetypes.map(a => ({
            ...a,
            serialized: JSON.stringify(a),
        }));

        const serializedFeatures = features.map(f => ({
            ...f,
            serialized: JSON.stringify(f),
        }));

        const defaultType = game.settings?.get("quick-creatures", "defaultType") || "Aberration";
        this._packs = await discoverPacks();
        if (!this._packs.some(pack => pack.id === this._tokenPack)) {
            this._tokenPack = "Original_Tokens";
        }

        // Size setting used an array `choices` pre-0.2.0, which stored the index
        // rather than the value. Map numeric strings to size names for backward compat.
        const SIZES = ["Tiny", "Small", "Medium", "Large", "Huge", "Gargantuan"];
        const rawSize = game.settings?.get("quick-creatures", "defaultSize") || "Medium";
        const defaultSize = SIZES[parseInt(rawSize)] || rawSize;

        // CR setting uses `_` prefix on keys to avoid integer-key sort in Object.entries().
        // Strip prefix for use. Backward compat: no prefix → use as-is.
        const rawCR = game.settings?.get("quick-creatures", "defaultCR") || "_1";
        const defaultCR = rawCR.startsWith("_") ? rawCR.slice(1) : rawCR;

        return {
            tabs: QuickCreaturesApp.TABS,
            modulePath: MODULE_PATH,
            tokenPack: this._tokenPack,
            // Initial token preview image — use current selection or type default
            tokenPreviewSrc: this._getTokenPreviewSrc(defaultType),
            crStats,
            archetypes: serializedArchetypes,
            firstArchetype: serializedArchetypes[0] || null,
            types,
            features: serializedFeatures,
            defaultStats: crStats[0] || {},
            sizes: SIZES,
            defaults: {
                type: defaultType,
                size: defaultSize,
                cr: defaultCR,
                archetype: game.settings?.get("quick-creatures", "defaultArchetype") || "",
                dynamicRing: game.settings?.get("quick-creatures", "defaultDynamicRing") || false,
            },
        };
    }

    /** @override */
    async _preparePartContext(partId, context) {
        if (partId === "tabs") {
            context.tabs = QuickCreaturesApp.TABS;
            context.activeTab = this.tabGroups?.primary || "tab_cr";
        }
        if (partId === "content") {
            context.tab = this.tabGroups?.primary || "tab_cr";
        }
        return context;
    }

    /** @override */
    _onRender(context, options) {
        super._onRender(context, options);
        this.#bindEvents();
        this.#updatePreview();
    }

    /**
     * Bind change/click events on the rendered DOM.
     */
    #bindEvents() {
        const html = this.element;

        // Tab switching
        html.querySelectorAll(".qc-tab-btn").forEach(btn => {
            btn.addEventListener("click", (ev) => {
                const tabId = ev.currentTarget.dataset.tab;
                this.#switchTab(tabId);
            });
        });

        // CR select change
        const crSelect = html.querySelector("#cr-value");
        if (crSelect) {
            crSelect.addEventListener("change", () => this.#updatePreview());
        }

        // Archetype select change
        const archetypeSelect = html.querySelector("#archetype-select");
        if (archetypeSelect) {
            archetypeSelect.addEventListener("change", () => this.#updatePreview());
        }

        // 3-state ability proficiency toggles: off → full → half → off
        html.querySelectorAll(".qc-ability-toggle").forEach(toggle => {
            toggle.addEventListener("click", () => {
                const states = ["off", "full", "half"];
                const current = toggle.dataset.state || "off";
                const next = states[(states.indexOf(current) + 1) % states.length];
                toggle.dataset.state = next;
                toggle.setAttribute("aria-checked", next !== "off");
                this.#updatePreview();
            });
        });

        // Monster type select → update token image to pack default
        const typeSelect = html.querySelector("#monster-type");
        if (typeSelect) {
            const defaultType = game.settings?.get("quick-creatures", "defaultType") || "Aberration";
            typeSelect.addEventListener("change", () => {
                const displayType = typeSelect.options[typeSelect.selectedIndex]?.value || defaultType;
                this._currentToken = null; // reset custom selection
                this._currentTokenSubject = null;
                this._currentTokenPortrait = null;
                this._currentTokenScale = 1;
                const tokenImg = html.querySelector("#token-preview");
                if (tokenImg) {
                    tokenImg.src = this._getTokenPreviewSrc(displayType);
                }
            });
        }

        // Feature hover — show description in description box
        const descBoxText = html.querySelector(".qc-feature-desc-text");
        if (descBoxText) {
            html.querySelectorAll(".qc-feature-check").forEach(check => {
                check.addEventListener("mouseenter", () => {
                    try {
                        const feature = JSON.parse(check.dataset.feature);
                        descBoxText.textContent = feature.desc || feature.description || "";
                    } catch (e) {
                        descBoxText.textContent = "";
                    }
                });
                check.addEventListener("mouseleave", () => {
                    descBoxText.textContent = "";
                });
            });
        }

        // Create monster button
        const createMonsterBtn = html.querySelector("#create-monster-btn");
        if (createMonsterBtn) {
            createMonsterBtn.addEventListener("click", async (ev) => {
                ev.preventDefault();
                await createActor(this, html);
            });
        }

        // Credits button — opens CreditsDialog (Handlebars ApplicationV2)
        const creditsBtn = html.querySelector("#qc-credits-btn");
        if (creditsBtn) {
            creditsBtn.addEventListener("click", (ev) => {
                ev.preventDefault();
                new CreditsDialog().render(true);
            });
        }


        // Token preview image — click opens TokenPickerApp
        const tokenPreview = html.querySelector("#token-preview");
        if (tokenPreview) {
            tokenPreview.style.cursor = "pointer";
            tokenPreview.addEventListener("click", (ev) => {
                ev.preventDefault();
                const typeSelect = html.querySelector("#monster-type");
                const defaultType = game.settings?.get("quick-creatures", "defaultType") || "Aberration";
                const monsterType = typeSelect
                    ? typeSelect.options[typeSelect.selectedIndex]?.value || defaultType
                    : defaultType;

                new TokenPickerApp({
                    monsterType,
                    currentPack: this._tokenPack,
                    currentToken: this._currentToken,
                    onSelect: (path, pack, token = {}) => {
                        this._currentToken = path;
                        this._currentTokenSubject = token.subject || null;
                        this._currentTokenPortrait = token.portrait || null;
                        this._currentTokenScale = token.scale ?? 1;
                        this._tokenPack = pack;
                        const tokenImg = html.querySelector("#token-preview");
                        if (tokenImg) {
                            tokenImg.src = path;
                        }
                    },
                }).render({ force: true });
            });
        }
    }

    /**
     * Switch between CR and Archetype tabs.
     * @param {string} tabId - "tab_cr" or "tab_archetype"
     */
    #switchTab(tabId) {
        const html = this.element;

        // Update tab button styles
        html.querySelectorAll(".qc-tab-btn").forEach(btn => {
            btn.classList.toggle("active", btn.dataset.tab === tabId);
        });

        // Update tab content visibility
        html.querySelectorAll(".qc-tab-content").forEach(content => {
            content.classList.toggle("active", content.dataset.tab === tabId);
        });

        this.#updatePreview();
    }

    /**
     * Update the live stat preview based on current selections.
     */
    #updatePreview() {
        const html = this.element;

        // Determine active tab
        const crTab = html.querySelector('[data-tab="tab_cr"]');
        const isArchetype = crTab && !crTab.classList.contains("active");

        let stats = null;
        let saveBonus = "+2";

        if (isArchetype) {
            const select = html.querySelector("#archetype-select");
            if (select) {
                const option = select.options[select.selectedIndex];
                if (option && option.dataset.stats) {
                    try { stats = JSON.parse(option.dataset.stats); } catch (e) {}
                }
            }
        } else {
            const select = html.querySelector("#cr-value");
            if (select) {
                const option = select.options[select.selectedIndex];
                if (option && option.dataset.stats) {
                    try { stats = JSON.parse(option.dataset.stats); } catch (e) {}
                }
            }
        }

        if (!stats) return;

        saveBonus = stats.PAB || "+2";
        // Ensure "+" prefix (archetype PAB is a plain number, CR table PAB has "+")
        saveBonus = String(saveBonus).startsWith("+") ? String(saveBonus) : "+" + String(saveBonus);

        // Calculate half-PB (rounded up)
        const pbNum = parseInt(saveBonus, 10) || 0;
        const halfPb = Math.ceil(pbNum / 2);
        const halfPbStr = halfPb >= 0 ? `+${halfPb}` : `${halfPb}`;

        // Update stat labels
        this.#setText(html, "#hpLabel", stats.HP);
        this.#setText(html, "#acLabel", stats.ACDC);
        this.#setText(html, "#profLabel", saveBonus);
        this.#setText(html, "#saveBonus", saveBonus);
        this.#setText(html, "#halfPbLabel", halfPbStr);

        // Damage per attack × number of attacks
        const noa = stats.NoA || 1;
        this.#setText(html, "#dmgLabel", `${stats.DpACalc} × ${noa}`);

        // Level equivalent
        const eclEl = html.querySelector("#lvlLabel");
        if (eclEl) {
            eclEl.textContent = stats.ECL || "";
        }

        // Abilities — archetypes: compute dnd5e score from BF-inflated value.
        // Primary abilities (proficient:1): real score = 10 + (inflatedMod - prof5E)*2.
        // The modifier shown is the full Lazy GM save bonus (inflatedMod).
        if (stats.abilities) {
            const is5E = game.system.id === "dnd5e";
            const pb = parseInt(stats.PAB) || 2;
            const get5EProf = (p) => { if (p <= 6) return 2; if (p <= 7) return 3; if (p <= 9) return 4; if (p <= 11) return 5; if (p <= 13) return 6; return 7; };
            const prof5E = get5EProf(pb);
            const ablKeys = ["str", "dex", "con", "int", "wis", "cha"];
            for (const key of ablKeys) {
                const abl = stats.abilities[key];
                const bfValue = abl?.value || 10;
                const inflatedMod = Math.floor((bfValue - 10) / 2);
                const isPrimary = abl?.proficient === 1;
                // BF stores inflated values for proficient abilities. Compute real score.
                const realScore = (is5E && isPrimary)
                    ? 10 + (inflatedMod - prof5E) * 2
                    : bfValue;
                const modStr = `${inflatedMod >= 0 ? "+" : ""}${inflatedMod}`;
                const labelEl = html.querySelector(`#${key}Label`);
                if (labelEl) {
                    labelEl.textContent = is5E ? `${realScore} (${modStr})` : modStr;
                }
            }
        } else {
            const pb = parseInt(stats.PAB) || 2;
            const halfPB = Math.ceil(pb / 2);
            const ablKeys = ["str", "dex", "con", "int", "wis", "cha"];
            const is5E = game.system.id === "dnd5e";
            // 5E proficiency bonus by Lazy GM PB
            const get5EProf = (p) => { if (p <= 6) return 2; if (p <= 7) return 3; if (p <= 9) return 4; if (p <= 11) return 5; if (p <= 13) return 6; return 7; };
            const prof5E = get5EProf(pb);
            for (const key of ablKeys) {
                const toggle = html.querySelector(`.qc-ability-toggle[data-ability="${key}"]`);
                const state = toggle ? toggle.dataset.state : "off";
                const mod = state === "full" ? pb : state === "half" ? halfPB : 0;
                const modStr = mod >= 0 ? `+${mod}` : `${mod}`;
                const labelEl = html.querySelector(`#${key}Label`);
                if (is5E) {
                    const realMod = state === "full" ? mod - prof5E : mod;
                    const score = 10 + realMod * 2;
                    labelEl.textContent = `${score} (${modStr})`;
                    // Tooltip
                    labelEl.title = state === "full"
                        ? `This ability includes a proficiency bonus. (+${realMod} +${prof5E} = ${modStr})`
                        : "This ability doesn't include a proficiency bonus.";
                } else {
                    labelEl.textContent = modStr;
                }
            }
        }

        // Archetype description
        const descEl = html.querySelector("#archetype-desc");
        if (descEl) {
            descEl.textContent = stats.short || stats.desc || "";
            if (stats.desc) {
                descEl.setAttribute("data-tooltip", stats.desc);
            }
        }
    }

    /**
     * Set text content of an element if it exists.
     * @param {HTMLElement} html
     * @param {string} selector
     * @param {*} value
     */
    #setText(html, selector, value) {
        const el = html.querySelector(selector);
        if (el) {
            el.textContent = value != null ? value : "";
        }
    }

    /**
     * Get the token preview image source for a given monster type,
     * using the current pack's default token (or a user-picked token).
     * @param {string} type - Monster type e.g. "Aberration"
     * @returns {string} Full image path
     */
    _getTokenPreviewSrc(type) {
        // If user has picked a specific token via the picker, use it
        if (this._currentToken) return this._currentToken;

        // Otherwise use the current pack's default for this type
        const pack = this._packs.find(p => p.id === this._tokenPack);
        const defaultEntry = pack?.tokens?.[type]?.[0];
        if (defaultEntry) {
            return tokenImagePath(this._tokenPack, defaultEntry.file);
        }

        const defaultFile = getDefaultToken(this._tokenPack, type);
        if (defaultFile) {
            return tokenImagePath(this._tokenPack, defaultFile);
        }

        // Fallback to Original_Tokens
        const fallback = getDefaultToken("Original_Tokens", type);
        if (fallback) {
            return tokenImagePath("Original_Tokens", fallback);
        }

        return `${MODULE_PATH}/assets/Original_Tokens/${type}/${type.toLowerCase()}.webp`;
    }
}

/**
 * Initialize the Quick Creatures module.
 * Registers hooks for the "Quick Creatures" button in the Actors sidebar.
 */
export async function initQuickCreatures() {
    // Register module settings
    game.settings.register("quick-creatures", "defaultType", {
        name: "quick-creatures.settings.defaultType.name",
        hint: "quick-creatures.settings.defaultType.hint",
        scope: "world",
        config: true,
        type: String,
        default: "Aberration",
        choices: {
            Aberration: "Aberration", Beast: "Beast", Celestial: "Celestial",
            Construct: "Construct", Dragon: "Dragon", Elemental: "Elemental",
            Fey: "Fey", Fiend: "Fiend", Giant: "Giant", Humanoid: "Humanoid",
            Monstrosity: "Monstrosity", Ooze: "Ooze", Plant: "Plant", Undead: "Undead",
        },
    });
    game.settings.register("quick-creatures", "defaultSize", {
        name: "quick-creatures.settings.defaultSize.name",
        hint: "quick-creatures.settings.defaultSize.hint",
        scope: "world",
        config: true,
        type: String,
        default: "Medium",
        choices: {
            Tiny: "Tiny", Small: "Small", Medium: "Medium",
            Large: "Large", Huge: "Huge", Gargantuan: "Gargantuan",
        },
    });
    game.settings.register("quick-creatures", "defaultCR", {
        name: "quick-creatures.settings.defaultCR.name",
        hint: "quick-creatures.settings.defaultCR.hint",
        scope: "world",
        config: true,
        type: String,
        default: "_1",
        choices: Object.fromEntries(CR_TABLE.map(cr => [`_${cr.CR}`, `CR ${cr.CR}${cr.example ? ` (${cr.example})` : ""}`])),
    });
    game.settings.register("quick-creatures", "defaultDynamicRing", {
        name: "quick-creatures.settings.defaultDynamicRing.name",
        hint: "quick-creatures.settings.defaultDynamicRing.hint",
        scope: "world",
        config: true,
        type: Boolean,
        default: true,
    });
    game.settings.register("quick-creatures", "defaultTokenSet", {
        name: "quick-creatures.settings.defaultTokenSet.name",
        hint: "quick-creatures.settings.defaultTokenSet.hint",
        scope: "world",
        config: false,
        type: String,
        default: "Original_Tokens",
        choices: getTokenSetChoices(game, { respectSettings: false }),
    });
    game.settings.register("quick-creatures", "defaultArchetype", {
        name: "quick-creatures.settings.defaultArchetype.name",
        hint: "quick-creatures.settings.defaultArchetype.hint",
        scope: "world",
        config: true,
        type: String,
        default: "Soldier",
        choices: Object.fromEntries(ARCHETYPES.map(a => [a.name, `${a.name} (CR ${a.CR})`])),
    });
    game.settings.register("quick-creatures", "customTokenDirectory", {
        name: "quick-creatures.settings.customTokenDirectory.name",
        hint: "quick-creatures.settings.customTokenDirectory.hint",
        scope: "world",
        config: false,
        type: String,
        default: "Data/assets/quick-creatures-tokens/",
    });
    game.settings.register("quick-creatures", "enableOriginalTokens", {
        name: "quick-creatures.settings.enableOriginalTokens.name",
        hint: "quick-creatures.settings.enableOriginalTokens.hint",
        scope: "world",
        config: false,
        type: Boolean,
        default: true,
    });
    game.settings.register("quick-creatures", "enableCuteTokens", {
        name: "quick-creatures.settings.enableCuteTokens.name",
        hint: "quick-creatures.settings.enableCuteTokens.hint",
        scope: "world",
        config: false,
        type: Boolean,
        default: true,
    });
    game.settings.register("quick-creatures", "enablePathfinderTokensBestiaries", {
        name: "quick-creatures.settings.enablePathfinderTokensBestiaries.name",
        hint: "quick-creatures.settings.enablePathfinderTokensBestiaries.hint",
        scope: "world",
        config: false,
        type: Boolean,
        default: true,
    });
    game.settings.register("quick-creatures", "enablePathfinderTokensMonsterCore", {
        name: "quick-creatures.settings.enablePathfinderTokensMonsterCore.name",
        hint: "quick-creatures.settings.enablePathfinderTokensMonsterCore.hint",
        scope: "world",
        config: false,
        type: Boolean,
        default: true,
    });
    game.settings.register("quick-creatures", "enablePathfinderTokensMonsterCore2", {
        name: "quick-creatures.settings.enablePathfinderTokensMonsterCore2.name",
        hint: "quick-creatures.settings.enablePathfinderTokensMonsterCore2.hint",
        scope: "world",
        config: false,
        type: Boolean,
        default: true,
    });
    game.settings.register("quick-creatures", "enableA5eSystemTokens", {
        name: "quick-creatures.settings.enableA5eSystemTokens.name",
        hint: "quick-creatures.settings.enableA5eSystemTokens.hint",
        scope: "world",
        config: false,
        type: Boolean,
        default: true,
    });
    game.settings.register("quick-creatures", "enableA5eMonstrousMenagerieTokens", {
        name: "quick-creatures.settings.enableA5eMonstrousMenagerieTokens.name",
        hint: "quick-creatures.settings.enableA5eMonstrousMenagerieTokens.hint",
        scope: "world",
        config: false,
        type: Boolean,
        default: true,
    });
    game.settings.register("quick-creatures", "enableA5eMonstrousMenagerie2Tokens", {
        name: "quick-creatures.settings.enableA5eMonstrousMenagerie2Tokens.name",
        hint: "quick-creatures.settings.enableA5eMonstrousMenagerie2Tokens.hint",
        scope: "world",
        config: false,
        type: Boolean,
        default: true,
    });
    game.settings.register("quick-creatures", "customTokenSetEnabled", {
        scope: "world",
        config: false,
        type: Object,
        default: {},
    });
    game.settings.registerMenu("quick-creatures", "configureTokens", {
        name: "quick-creatures.settings.configureTokens.name",
        label: "quick-creatures.settings.configureTokens.label",
        hint: "quick-creatures.settings.configureTokens.hint",
        icon: "fa-solid fa-image",
        type: QuickCreaturesTokenSetConfig,
        restricted: true,
    });

    // Register Handlebars helpers (not available by default in Foundry)
    Handlebars.registerHelper("i18n", function (key) {
        return game.i18n.localize(`quick-creatures.${key}`);
    });
    Handlebars.registerHelper("arr", function () {
        return Array.from(arguments).slice(0, -1);
    });
    Handlebars.registerHelper("concat", function (a, b) {
        return String(a) + String(b);
    });
    Handlebars.registerHelper("eq", function (a, b) {
        return a === b;
    });

    // Preload and register Handlebars partials
    // (HandlebarsApplicationMixin uses isolated instances; global partials must be registered)
    const partials = [
        "modules/quick-creatures/templates/partials/header.hbs",
        "modules/quick-creatures/templates/partials/tab-cr.hbs",
        "modules/quick-creatures/templates/partials/tab-archetype.hbs",
        "modules/quick-creatures/templates/partials/features.hbs",
    ];
    await loadTemplates(partials);
    for (const path of partials) {
        Handlebars.registerPartial(path, await getTemplate(path));
    }

    // Register core data from local data files
    registerCoreData();

    // Inject "Quick Creatures" button into the Actors sidebar
    Hooks.on("renderSidebarTab", injectGenerateButton);
    Hooks.on("changeSidebarTab", injectGenerateButton);
    Hooks.on("renderActorDirectory", injectGenerateButton);  // re-fire on directory re-render (deletion)

    // Fire hook for expansion modules to register their data
    Hooks.callAll("quickCreaturesReady", registry);

    console.log("Quick Creatures | Initialized");
}

/**
 * Inject the "Quick Creatures" button into the actors sidebar header actions,
 * positioned after "Create Folder" (third position).
 * @param {SidebarTab} app
 * @param {JQuery} html
 */
function injectGenerateButton(app, html) {
    // Accept both SidebarTab and ActorDirectory renders — only for actors
    const isActorTab = app.options?.classes?.includes("actors-sidebar");
    const isActorDirectory = app.constructor?.name === "ActorDirectory";
    if (!isActorTab && !isActorDirectory) return;

    const element = app?.element;
    if (!element) return;

    // Guard against duplicate buttons
    if (element.querySelector(".qc-generate-monster")) return;

    // Find the header actions button bar
    const headerActions = element.querySelector(".header-actions");
    if (!headerActions) return;

    const generateBtn = document.createElement("button");
    generateBtn.className = "create-document qc-generate-monster";
    generateBtn.innerHTML = `<i class="fa-solid fa-spaghetti-monster-flying"></i> ${game.i18n.localize("quick-creatures.sidebar.generateCreature")}`;
    generateBtn.addEventListener("click", () => {
        new QuickCreaturesApp().render({ force: true });
    });

    // Insert after "Create Folder" button (3rd position in the button bar)
    const createFolderBtn = headerActions.querySelector(".create-folder");
    if (createFolderBtn) {
        createFolderBtn.after(generateBtn);
    } else {
        // Fallback: append to end of header-actions
        headerActions.appendChild(generateBtn);
    }
}

export { QuickCreaturesApp };
