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

        return {
            tabs: QuickCreaturesApp.TABS,
            modulePath: MODULE_PATH,
            crStats,
            archetypes: serializedArchetypes,
            firstArchetype: serializedArchetypes[0] || null,
            types,
            features: serializedFeatures,
            defaultStats: crStats[0] || {},
            sizes: ["Tiny", "Small", "Medium", "Large", "Huge", "Gargantuan"],
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

        // Save proficiency checkboxes
        html.querySelectorAll(".qc-save-check").forEach(cb => {
            cb.addEventListener("change", () => this.#updatePreview());
        });

        // Monster type select → update token image
        const typeSelect = html.querySelector("#monster-type");
        if (typeSelect) {
            typeSelect.addEventListener("change", () => {
                const typeName = typeSelect.options[typeSelect.selectedIndex]?.value?.toLowerCase() || "aberration";
                const tokenImg = html.querySelector("#token-preview");
                if (tokenImg) {
                    tokenImg.src = `${MODULE_PATH}/tokens/${typeName}.png`;
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

        // Update stat labels
        this.#setText(html, "#hpLabel", stats.HP);
        this.#setText(html, "#acLabel", stats.ACDC);
        this.#setText(html, "#profLabel", stats.PAB);
        this.#setText(html, "#saveBonus", saveBonus);

        // Damage per attack × number of attacks
        const noa = stats.NoA || 1;
        this.#setText(html, "#dmgLabel", `${stats.DpACalc} × ${noa}`);

        // Level equivalent
        const eclEl = html.querySelector("#lvlLabel");
        if (eclEl) {
            eclEl.textContent = stats.ECL || "";
        }

        // Abilities — show as modifiers (+0, +1, etc.)
        const getMod = (val) => {
            const v = parseInt(val) || 10;
            const mod = Math.floor((v - 10) / 2);
            return `${mod >= 0 ? "+" : ""}${mod}`;
        };
        if (stats.abilities) {
            this.#setText(html, "#strLabel", getMod(stats.abilities.str?.value));
            this.#setText(html, "#dexLabel", getMod(stats.abilities.dex?.value));
            this.#setText(html, "#conLabel", getMod(stats.abilities.con?.value));
            this.#setText(html, "#intLabel", getMod(stats.abilities.int?.value));
            this.#setText(html, "#wisLabel", getMod(stats.abilities.wis?.value));
            this.#setText(html, "#chaLabel", getMod(stats.abilities.cha?.value));
        } else {
            this.#setText(html, "#strLabel", "+0");
            this.#setText(html, "#dexLabel", "+0");
            this.#setText(html, "#conLabel", "+0");
            this.#setText(html, "#intLabel", "+0");
            this.#setText(html, "#wisLabel", "+0");
            this.#setText(html, "#chaLabel", "+0");
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
}

/**
 * Initialize the Quick Creatures module.
 * Registers hooks for the "Quick Creatures" button in the Actors sidebar.
 */
export async function initQuickCreatures() {
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
