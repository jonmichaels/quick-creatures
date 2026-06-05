import assert from "node:assert/strict";
import fs from "node:fs";

const template = fs.readFileSync("templates/partials/features.hbs", "utf8");
const appSource = fs.readFileSync("scripts/app/quick-creatures-app.js", "utf8");
const createSource = fs.readFileSync("scripts/app/quick-creatures-create.js", "utf8");
const scss = fs.readFileSync("scss/module.scss", "utf8");

assert.match(template, /title="\{\{tooltip\}\}"/, "feature checkbox labels must expose descriptions as hover tooltips");
assert.match(template, /qc-selected-items-list/, "feature description box must contain a selected items list");
assert.match(template, /qc-feature-desc-box[\s\S]*data-drop-zone="item"/, "selected items box must be marked as an item drop zone");
assert.match(template, /qc-drop-hint/, "drop zone must include visible drop hint text");
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

assert.match(createSource, /getRenameOverrides\(/, "actor creation must read rename overrides from the app instance");
assert.match(createSource, /applyRenameOverride/, "actor creation must apply renamed item names before creation");

assert.match(scss, /\.qc-feature-desc-box\s*\{[\s\S]*overflow-y:\s*auto;/, "selected items box must scroll for long lists");
assert.match(scss, /\.qc-selected-item\s*\{[\s\S]*display:\s*flex;/, "selected item rows must be flex rows");
assert.match(scss, /\.qc-selected-item-edit[\s\S]*\.qc-selected-item-remove\s*\{/, "edit and remove icon buttons must have dedicated styling");

console.log("feature list UI tests passed");
