import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const app = readFileSync("scripts/app/quick-creatures-app.js", "utf8");
const create = readFileSync("scripts/app/quick-creatures-create.js", "utf8");
const template = readFileSync("templates/quick-creatures.hbs", "utf8");
const scss = readFileSync("scss/module.scss", "utf8");
const bf = readFileSync("scripts/systems/black-flag-adapter.js", "utf8");
const dnd = readFileSync("scripts/systems/dnd5e-adapter.js", "utf8");
const lang = readFileSync("languages/en.json", "utf8");

assert.match(app, /defaultAdvancedMode/);
assert.match(app, /_advancedMode/);
assert.match(app, /_advancedAdjustments/);
assert.match(app, /getAdvancedState\(\)/);
assert.match(app, /deriveAdvancedStats/);
assert.match(app, /nextPercentStep/);
assert.match(app, /nextAbilityStep/);
assert.match(app, /modifierToDnd5eScore/);
assert.match(app, /#changeAdvancedAdjustment/);
assert.match(app, /#resetAdvancedAdjustment/);
assert.match(app, /#updateAdvancedControlStates/);

assert.match(template, /id="advanced-mode"/);
assert.match(template, /<div class="qc-create-left">\s*<div class="qc-tab-content active" data-tab="tab_cr">\s*<label class="qc-advanced-toggle/s);
assert.match(template, /<\/label>\s*<\/div>\s*<button type="button" id="qc-credits-btn"/s);
assert.match(template, /<button type="button" id="create-monster-btn" class="qc-create-btn">/);
assert.match(template, /data-adjust="hp"/);
assert.match(template, /data-adjust="ac"/);
assert.match(template, /data-adjust="damage"/);
assert.match(template, /data-adjust="ability"/);
assert.match(template, /data-ability="\{\{this\}\}"/);
assert.match(template, /data-direction="-1"/);
assert.match(template, /data-direction="1"/);
assert.match(template, /data-reset-adjust="hp"/);
assert.match(template, /data-reset-adjust="ability"/);

assert.match(scss, /\.qc-create-section\s*\{[^}]*display:\s*flex;[^}]*justify-content:\s*space-between/s);
assert.match(scss, /\.qc-create-left\s*\{[^}]*display:\s*inline-flex/s);
assert.match(template, /<div class="qc-stat-adjust-row">\s*<button type="button" class="qc-advanced-control qc-adjust-minus" data-adjust="hp"/s);
assert.match(template, /data-reset-adjust="damage">\{\{defaultStats\.DpACalc\}\} &times; \{\{defaultStats\.NoA\}\}<\/span>\s*<button type="button" class="qc-advanced-control qc-adjust-plus"/s);
assert.match(scss, /\.qc-token-preview\s*\{[^}]*flex:\s*0 0 88px;[^}]*padding-right:\s*4px/s);
assert.match(scss, /\.qc-token-preview\s*\{[\s\S]*img\s*\{[^}]*width:\s*88px;[^}]*height:\s*88px/s);
assert.match(scss, /\.qc-stat\s*\{[^}]*padding:\s*3px 6px 3px 0;[^}]*flex-wrap:\s*nowrap/s);
assert.match(scss, /\.qc-stat-label\s*\{[^}]*margin-right:\s*4px;[^}]*text-align:\s*left;[^}]*flex:\s*0 0 auto/s);
assert.doesNotMatch(scss, /\.qc-stat-label\s*\{[^}]*flex:\s*0 0 52px/s);
assert.match(scss, /> span:not\(\.qc-stat-label\):last-child,\s*\n\s*\.qc-stat-adjust-row\s*\{[^}]*margin-left:\s*auto/s);
assert.doesNotMatch(scss, /> span:last-of-type,\s*\n\s*\.qc-stat-adjust-row/);
assert.match(scss, /\.qc-advanced-control\s*\{[^}]*width:\s*10px;[^}]*height:\s*10px;[^}]*background:\s*transparent;[^}]*border:\s*0;[^}]*font-size:\s*8px;[\s\S]*i\s*\{[^}]*width:\s*10px;[^}]*height:\s*10px;[^}]*background:\s*#fff;[^}]*border:\s*1px solid #111/s);
assert.match(scss, /#quick-creatures \.qc-stat \.qc-stat-label\s*\{[^}]*margin-left:\s*0;[^}]*text-align:\s*left/s);
assert.match(scss, /#quick-creatures button\.qc-advanced-control\s*\{[^}]*--button-size:\s*10px;[^}]*--input-height:\s*10px;[^}]*appearance:\s*none;[^}]*width:\s*10px !important;[^}]*height:\s*10px !important;[^}]*min-width:\s*10px !important;[^}]*min-height:\s*10px !important;[^}]*max-width:\s*10px !important;[^}]*max-height:\s*10px !important;[^}]*inline-size:\s*10px !important;[^}]*block-size:\s*10px !important;[^}]*flex:\s*0 0 10px !important/s);
assert.match(scss, /\.qc-adjust-plus\.qc-adjust-active i\s*\{[^}]*color:\s*#fff;[^}]*background:\s*var\(--color-bg-accent, #4a3\)/s);
assert.match(scss, /\.qc-adjust-minus\.qc-adjust-active i\s*\{[^}]*color:\s*#111;[^}]*background:\s*#d80/s);
assert.match(scss, /\.qc-ability-adjust-row\s*\{[^}]*gap:\s*4px/s);
assert.match(scss, /#advanced-mode::before\s*\{[^}]*display:\s*none\s*!important/s);
assert.match(scss, /\.qc-advanced-toggle\s*\{[\s\S]*input\[type="checkbox"\]\s*\{[^}]*appearance:\s*none/s);
assert.match(scss, /input\[type="checkbox"\]::after/);
assert.match(scss, /input\[type="checkbox"\]:checked::after\s*\{[^}]*translateX/s);
assert.match(scss, /\.qc-advanced-control\s*\{[^}]*display:\s*none/s);
assert.match(scss, /\.qc-advanced-active \.qc-advanced-control/);
assert.match(scss, /\.qc-adjust-plus\.qc-adjust-active/);
assert.match(scss, /\.qc-adjust-minus\.qc-adjust-active/);

assert.match(create, /deriveAdvancedStats/);
assert.match(create, /getAdvancedState/);
assert.match(create, /creationStats/);
assert.match(create, /AdvancedAbilityMods/);
assert.match(create, /state === "off" && advancedEnabled/);
assert.match(create, /adapter\.buildActorData\(name, creationStats/);
assert.match(create, /normalizeDroppedItem\(itemData, creationStats/);

assert.match(bf, /getSaveDC\(stats\)/);
assert.match(bf, /stats\.DC \?\? stats\.ACDC/);
assert.match(dnd, /getSaveDC\(stats\)/);
assert.match(dnd, /stats\.DC \?\? stats\.ACDC/);
assert.match(lang, /defaultAdvancedMode/);
assert.match(lang, /"advanced"\s*:\s*\{/);

console.log("advanced mode UI/source tests passed");
