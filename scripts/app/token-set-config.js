import { A5E_TOKEN_PACKS, discoverCustomTokenSets, getTokenSetChoices, getTokenSetConfigGroups } from "../data/token-packs.js";

const MODULE_ID = "quick-creatures";
const DEFAULT_CUSTOM_TOKEN_DIRECTORY = "Data/assets/quick-creatures-tokens/";

export class QuickCreaturesTokenSetConfig extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "quick-creatures-token-config",
    tag: "form",
    window: {
      title: "quick-creatures.tokenConfig.title",
      icon: "fa-solid fa-image",
      contentClasses: ["standard-form"],
    },
    position: { width: 540 },
    form: { handler: QuickCreaturesTokenSetConfig.#onSubmit, closeOnSubmit: true },
    actions: {
      browseCustomDirectory: QuickCreaturesTokenSetConfig.#browseCustomDirectory,
      reset: QuickCreaturesTokenSetConfig.#onReset,
    },
  };

  static PARTS = {
    form: {
      template: "modules/quick-creatures/templates/token-set-config.hbs",
      scrollable: [""],
    },
    footer: {
      template: "templates/generic/form-footer.hbs",
    },
  };

  async _prepareContext(options) {
    const customTokenDirectory = game.settings.get(MODULE_ID, "customTokenDirectory") || DEFAULT_CUSTOM_TOKEN_DIRECTORY;
    const customSets = await discoverCustomTokenSets(customTokenDirectory, game);
    const customEnabled = game.settings.get(MODULE_ID, "customTokenSetEnabled") || {};
    const [coreGroup, pathfinderGroup, a5eGroup] = getTokenSetConfigGroups(game);
    return {
      defaultTokenSet: game.settings.get(MODULE_ID, "defaultTokenSet") || "Original_Tokens",
      defaultTokenSetChoices: getTokenSetChoices(game, { respectSettings: false, customSets }),
      customTokenDirectory,
      coreGroup,
      pathfinderGroup,
      a5eGroup,
      customSets: customSets.filter(set => !A5E_TOKEN_PACKS[set.id]).map(set => ({ ...set, enabled: customEnabled[set.id] !== false })),
      buttons: [
        { type: "reset", label: "Reset", icon: "fa-solid fa-arrow-rotate-left", action: "reset" },
        { type: "submit", label: "Save Changes", icon: "fa-solid fa-floppy-disk" },
      ],
    };
  }

  static async #browseCustomDirectory(event, target) {
    event.preventDefault();
    const input = this.element.querySelector('input[name="customTokenDirectory"]');
    const current = input?.value || DEFAULT_CUSTOM_TOKEN_DIRECTORY;
    const fp = new FilePicker({
      type: "folder",
      current: current.startsWith("Data/") ? current.slice(5) : current,
      callback: path => { if (input) input.value = path.startsWith("Data/") ? path : `Data/${path}`; },
    });
    return fp.browse();
  }

  static async #onReset(event) {
    event.preventDefault();
    const input = this.element.querySelector('input[name="customTokenDirectory"]');
    if (input) input.value = DEFAULT_CUSTOM_TOKEN_DIRECTORY;
    const select = this.element.querySelector('select[name="defaultTokenSet"]');
    if (select) select.value = "Original_Tokens";
    for (const checkbox of this.element.querySelectorAll('input[type="checkbox"]')) checkbox.checked = true;
  }

  static async #onSubmit(event, form, formData) {
    const data = foundry.utils.expandObject(formData.object);
    await game.settings.set(MODULE_ID, "defaultTokenSet", data.defaultTokenSet || "Original_Tokens");
    await game.settings.set(MODULE_ID, "customTokenDirectory", data.customTokenDirectory || DEFAULT_CUSTOM_TOKEN_DIRECTORY);

    const enabled = data.enabled || {};
    for (const group of getTokenSetConfigGroups(game)) {
      for (const pack of group.packs) {
        if (pack.settingKey) await game.settings.set(MODULE_ID, pack.settingKey, Boolean(enabled[pack.id]));
      }
    }
    const customSets = await discoverCustomTokenSets(data.customTokenDirectory || DEFAULT_CUSTOM_TOKEN_DIRECTORY, game);
    const customTokenSetEnabled = Object.fromEntries(customSets.map(set => [set.id, Boolean(data.customEnabled?.[set.id])]));
    await game.settings.set(MODULE_ID, "customTokenSetEnabled", customTokenSetEnabled);
    ui.notifications.info(game.i18n.localize("quick-creatures.tokenConfig.saved"));
  }
}
