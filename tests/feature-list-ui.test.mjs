import assert from "node:assert/strict";
import fs from "node:fs";

const template = fs.readFileSync("templates/partials/features.hbs", "utf8");
const quickTemplate = fs.readFileSync("templates/quick-creatures.hbs", "utf8");
const appSource = fs.readFileSync("scripts/app/quick-creatures-app.js", "utf8");
const createSource = fs.readFileSync("scripts/app/quick-creatures-create.js", "utf8");
const scss = fs.readFileSync("scss/module.scss", "utf8");

const abilitiesHintIndex = quickTemplate.indexOf("qc-abilities-hint");
const abilitiesRowIndex = quickTemplate.indexOf("qc-abilities-row");
assert.ok(abilitiesHintIndex !== -1, "abilities hint must exist");
assert.ok(abilitiesRowIndex !== -1, "abilities row must exist");
assert.ok(abilitiesRowIndex < abilitiesHintIndex, "abilities hint must render below the ability checkboxes");

assert.match(template, /title="\{\{tooltip\}\}"/, "feature checkbox labels must expose descriptions as hover tooltips");
assert.match(template, /qc-selected-items-list/, "feature description box must contain a selected items list");
assert.match(template, /qc-feature-desc-box[\s\S]*data-drop-zone="item"/, "selected items box must be marked as an item drop zone");
assert.match(template, /<div class="qc-feature-drop-zone">\s*<div class="qc-drop-hint">Drop features, weapons, spells\.<\/div>\s*<div class="qc-feature-desc-box"/, "drop hint must render immediately above the selected items box with updated text");
assert.doesNotMatch(template, /qc-feature-desc-box[\s\S]*qc-drop-hint/, "drop hint must not render inside the selected items box");
assert.doesNotMatch(template, /qc-feature-desc-text/, "feature section must not render the old hover description text node");

assert.match(appSource, /#droppedItems/, "app must store dropped item snapshots");
assert.match(appSource, /TextEditor\.getDragEventData/, "drop handler must parse Foundry drag data");
assert.match(appSource, /fromDropData/, "drop handler must resolve dropped documents");
assert.match(appSource, /getDroppedItems/, "actor creation must be able to read dropped items");
assert.match(appSource, /dragover/, "app must listen for dragover on the drop box");
assert.match(appSource, /drop/, "app must listen for drop on the drop box");
assert.match(appSource, /qc-selected-item-remove/, "dropped items must be removable from the selected list");

assert.match(appSource, /#updateSelectedItemsList\(/, "app must update the selected attacks/features list");
assert.match(appSource, /qc-selected-item-edit/, "app must wire edit buttons for listed attacks/features");
assert.match(appSource, /Melee Attack/, "selected list must include Melee Attack");
assert.match(appSource, /Ranged Attack/, "selected list must include Ranged Attack");
assert.match(appSource, /Multiattack/, "selected list must include Multiattack when applicable");
assert.match(appSource, /#renameOverrides/, "app must store rename overrides for listed attacks/features");
assert.match(appSource, /foundry\.utils\.escapeHTML/, "rename prompt must escape the current name before injecting dialog HTML");
assert.match(appSource, /foundry\.applications\.handlebars/, "template preloading must use the v13+ namespaced Handlebars API");
assert.doesNotMatch(appSource, /\bawait\s+loadTemplates\(/, "app must not call deprecated global loadTemplates");
assert.doesNotMatch(appSource, /\bawait\s+getTemplate\(/, "app must not call deprecated global getTemplate");

assert.match(createSource, /getRenameOverrides\(/, "actor creation must read rename overrides from the app instance");
assert.match(createSource, /applyRenameOverride/, "actor creation must apply renamed item names before creation");

assert.match(scss, /\.qc-feature-desc-box\s*\{[\s\S]*overflow-y:\s*auto;/, "selected items box must scroll for long lists");
assert.match(scss, /\.qc-features-wrap\s*\{[\s\S]*grid-template-rows:\s*auto 1fr;/, "features layout must keep heading/drop hint row above aligned boxes");
assert.match(scss, /\.qc-features-wrap\s*\{[\s\S]*h3\s*\{[\s\S]*grid-column:\s*1;[\s\S]*grid-row:\s*1;/, "features heading must occupy the left cell of the first row");
assert.match(scss, /\.qc-feature-drop-zone\s*\{[\s\S]*display:\s*grid;[\s\S]*grid-column:\s*2;[\s\S]*grid-row:\s*1 \/ 3;/, "drop hint and selected-items box must occupy the right column across both rows");
assert.match(scss, /\.qc-drop-hint\s*\{[\s\S]*text-align:\s*center;/, "drop hint must be centered above the selected-items box");
assert.match(scss, /\.qc-abilities-row\s*\{(?:(?!border-bottom).)*\}/s, "abilities row must not draw the divider above the hint");
assert.match(scss, /\.qc-abilities-hint\s*\{[\s\S]*border-bottom:\s*1px solid var\(--color-border-dark, #444\);/, "abilities hint must draw the divider below itself");
assert.match(scss, /\.qc-selected-item\s*\{[\s\S]*display:\s*flex;/, "selected item rows must be flex rows");
assert.match(scss, /\.qc-selected-item-name\s*\{[\s\S]*margin-right:\s*auto;/, "selected item names must push edit/remove controls to the right");
assert.match(scss, /#app\.theme-light #quick-creatures-content,[\s\S]*\.theme-light #quick-creatures-content\s*\{[\s\S]*\.qc-stat-preview,[\s\S]*\.qc-stat-preview \.qc-stat,[\s\S]*\.qc-feature-check\s*\{[\s\S]*background:\s*transparent !important;[\s\S]*background-color:\s*transparent !important;/, "Light theme stat preview, stat rows, and feature labels must let the window background show through");
assert.match(scss, /#app\.theme-light #quick-creatures-content,[\s\S]*\.theme-light #quick-creatures-content\s*\{[\s\S]*\.qc-feature-check \.qc-feature-name,[\s\S]*\.qc-selected-item-name\s*\{[\s\S]*color:\s*#000 !important;[\s\S]*-webkit-text-fill-color:\s*#000 !important;/, "Light theme feature and selected item names must render black text");
assert.match(scss, /\.qc-selected-item-edit[\s\S]*\.qc-selected-item-remove\s*\{/, "edit and remove icon buttons must have dedicated styling");

console.log("feature list UI tests passed");
