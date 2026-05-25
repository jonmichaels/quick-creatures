/**
 * TokenPickerApp — ApplicationV2 window for browsing and selecting tokens.
 *
 * Opens from the token preview area in QuickCreaturesApp.
 * Supports pack selector, search, and a 3-column scrollable token grid.
 */
import { discoverPacks, tokenImagePath, TYPES } from "../data/token-packs.js";

/** @type {string} Base path for module assets */
const MODULE_PATH = "modules/quick-creatures";

class TokenPickerApp extends foundry.applications.api.HandlebarsApplicationMixin(
  foundry.applications.api.ApplicationV2
) {
  /** @override */
  static DEFAULT_OPTIONS = {
    id: "qc-token-picker",
    tag: "div",
    window: {
      title: "quick-creatures.tokenPicker.title",
      icon: "fa-solid fa-image-portrait",
    },
    position: {
      width: 600,
      height: 650,
    },
  };

  /** @override */
  static PARTS = {
    content: {
      id: "content",
      template: `${MODULE_PATH}/templates/token-picker.hbs`,
      classes: ["qc-token-picker"],
    },
  };

  /**
   * @param {Object} options
   * @param {string} [options.monsterType="Aberration"] - Current creature type
   * @param {string} [options.currentPack="Original_Tokens"] - Currently selected pack
   * @param {Function} [options.onSelect] - Called with full image path when token is selected
   */
  constructor(options = {}) {
    super(options);
    this.monsterType = options.monsterType || "Aberration";
    this._onSelect = options.onSelect || (() => {});
    this._selectedPack = options.currentPack || "Original_Tokens";
    this._searchQuery = "";
    this._packs = [];
  }

  /** @override */
  async _prepareContext() {
    this._packs = await discoverPacks();

    // Ensure selected pack falls back to first available
    const packExists = this._packs.some(p => p.id === this._selectedPack);
    if (!packExists && this._packs.length > 0) {
      this._selectedPack = this._packs[0].id;
    }

    // Get tokens for current pack + type
    let tokens = this._getTokens();
    let allTypesTokens = this._getAllTokensForPack();

    // If current type has no tokens, show all tokens from all types
    const showingAllTypes = tokens.length === 0;

    return {
      packs: this._packs,
      modulePath: MODULE_PATH,
      monsterType: this.monsterType,
      selectedPack: this._selectedPack,
      tokens,
      allTypesTokens,
      searchQuery: this._searchQuery,
      showingAllTypes,
      types: TYPES,
    };
  }

  /** @override */
  async _preparePartContext(partId, context) {
    if (partId === "content") {
      context.tab = this.tabGroups?.primary || "token_grid";
    }
    return context;
  }

  /**
   * Get tokens for the current pack + type, filtered by search.
   * @returns {Array}
   */
  _getTokens() {
    const pack = this._packs.find(p => p.id === this._selectedPack);
    if (!pack || !pack.tokens || !pack.tokens[this.monsterType]) return [];

    let tokens = pack.tokens[this.monsterType];
    if (this._searchQuery) {
      const q = this._searchQuery.toLowerCase();
      tokens = tokens.filter(t => t.name.toLowerCase().includes(q));
    }
    return tokens;
  }

  /**
   * Get all tokens for the current pack across all types.
   * @returns {Array<{type: string, tokens: Array}>}
   */
  _getAllTokensForPack() {
    const pack = this._packs.find(p => p.id === this._selectedPack);
    if (!pack || !pack.tokens) return [];

    const result = [];
    for (const type of TYPES) {
      if (pack.tokens[type] && pack.tokens[type].length > 0) {
        let tokens = pack.tokens[type];
        if (this._searchQuery) {
          const q = this._searchQuery.toLowerCase();
          tokens = tokens.filter(t => t.name.toLowerCase().includes(q));
        }
        if (tokens.length > 0) {
          result.push({ type, tokens });
        }
      }
    }
    return result;
  }

  /** @override */
  _onRender(context, options) {
    super._onRender(context, options);
    this.#bindEvents();
  }

  /**
   * Bind DOM events.
   */
  #bindEvents() {
    const html = this.element;

    // Pack selector change
    const packSelect = html.querySelector("#qc-pack-select");
    if (packSelect) {
      packSelect.removeEventListener("change", this._onPackChange);
      this._onPackChange = () => {
        this._selectedPack = packSelect.value;
        this.render();
      };
      packSelect.addEventListener("change", this._onPackChange);
    }

    // Search input
    const search = html.querySelector("#qc-token-search");
    if (search) {
      search.removeEventListener("input", this._onSearchInput);
      this._onSearchInput = (ev) => {
        this._searchQuery = ev.target.value;
        this.render();
      };
      search.addEventListener("input", this._onSearchInput);
    }

    // Token tile click
    html.querySelectorAll(".qc-token-tile").forEach(tile => {
      tile.addEventListener("click", (ev) => {
        const file = ev.currentTarget.dataset.file;
        const pack = ev.currentTarget.dataset.pack;
        if (file && pack) {
          this._onSelect(tokenImagePath(pack, file));
          this.close();
        }
      });
    });
  }
}

export { TokenPickerApp };
