/**
 * CreditsDialog — ApplicationV2 window for module credits.
 *
 * Opens when the copyright icon is clicked in QuickCreaturesApp.
 * Uses HandlebarsApplicationMixin for template rendering.
 */

const MODULE_PATH = "modules/quick-creatures";

class CreditsDialog extends foundry.applications.api.HandlebarsApplicationMixin(
  foundry.applications.api.ApplicationV2
) {
  /** @override */
  static DEFAULT_OPTIONS = {
    id: "qc-credits-dialog",
    tag: "div",
    window: {
      title: "Quick Creatures — Credits",
      icon: "fa-solid fa-copyright",
    },
    position: {
      width: 500,
    },
  };

  /** @override */
  static PARTS = {
    content: {
      id: "content",
      template: `${MODULE_PATH}/templates/credits-dialog.hbs`,
      classes: ["qc-credits-dialog"],
    },
  };
}

export { CreditsDialog };
