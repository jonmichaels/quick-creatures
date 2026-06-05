import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

async function loadTokenPacks() {
  const sourcePath = path.resolve("scripts/data/token-packs.js");
  return import(`file://${sourcePath}?t=${Date.now()}`);
}

const tokenPacks = await loadTokenPacks();

assert.deepEqual(
  tokenPacks.TOKEN_SET_CONFIG_SECTION_ORDER,
  ["defaults", "core", "pathfinder", "a5e", "custom"],
  "token config sections must render in requested order",
);

assert.deepEqual(
  tokenPacks.parseCustomTokenDirectory("Data/assets/quick-creatures-tokens/"),
  { source: "data", path: "assets/quick-creatures-tokens/" },
  "Data/ custom token paths should browse the data source",
);

assert.equal(
  tokenPacks.classifyCustomSetStructure({ folders: ["Aberration", "Beast"], files: [] }),
  "typed-subfolders",
);
assert.equal(
  tokenPacks.classifyCustomSetStructure({ folders: [], files: ["Dragon Lord.png"] }),
  "filename-fallback",
);

const folderBrowse = {
  target: "assets/quick-creatures-tokens",
  dirs: [
    "assets/quick-creatures-tokens/My_Set",
    "assets/quick-creatures-tokens/Monstrous_Menagerie_2_Tokens",
  ],
  files: [],
};
const descriptors = tokenPacks.createCustomTokenSetDescriptors(folderBrowse, {
  customTokenDirectory: "Data/assets/quick-creatures-tokens/",
});
assert.deepEqual(descriptors.map(set => set.id), ["custom:My_Set", "a5e-monstrous-menagerie-2"]);
assert.equal(descriptors[0].name, "My_Set");
assert.equal(descriptors[1].classification, "filename-fallback");

const a5eConfigGame = {
  system: { id: "dnd5e" },
  settings: { get: (_namespace, key) => ({
    enableA5eSystemTokens: true,
    enableA5eMonstrousMenagerieTokens: true,
    enableA5eMonstrousMenagerie2Tokens: true,
  }[key]) },
};
const a5eGroup = tokenPacks.getTokenSetConfigGroups(a5eConfigGame, { customSets: descriptors })
  .find(group => group.id === "a5e");
assert.deepEqual(
  a5eGroup.packs.map(pack => pack.id),
  ["a5e-system", "a5e-monstrous-menagerie", "a5e-monstrous-menagerie-2"],
  "A5E System must render before both Monstrous Menagerie rows",
);
assert.equal(a5eGroup.packs[0].statusKey, "quick-creatures.tokenConfig.status.a5eSystemDetected");
assert.equal(a5eGroup.packs[1].statusKey, "quick-creatures.tokenConfig.status.mmNotDetected");
assert.equal(a5eGroup.packs[2].statusKey, "quick-creatures.tokenConfig.status.mmDetected");

const missingA5eConfigGame = {
  system: { id: "dnd5e" },
  settings: { get: () => false },
};
assert.equal(
  tokenPacks.getTokenSetConfigGroups(missingA5eConfigGame, { customSets: descriptors })
    .find(group => group.id === "a5e").packs[0].statusKey,
  "quick-creatures.tokenConfig.status.a5eSystemNotDetected",
  "A5E System row should explain when the system is not detected",
);

const typedPack = tokenPacks.createCustomTokenPack({
  id: "custom:Typed",
  name: "Typed",
  path: "assets/quick-creatures-tokens/Typed",
  files: ["assets/quick-creatures-tokens/Typed/Beast/Wolf.png"],
  dirs: ["assets/quick-creatures-tokens/Typed/Beast"],
  classification: "typed-subfolders",
});
assert.equal(typedPack.tokens.Beast[0].name, "Wolf");
assert.equal(typedPack.tokens.Dragon.length, 0);

const fallbackPack = tokenPacks.createCustomTokenPack({
  id: "custom:MM2",
  name: "MM2",
  path: "assets/quick-creatures-tokens/MM2",
  files: ["assets/quick-creatures-tokens/MM2/Dragon_Lord.png"],
  dirs: [],
  classification: "filename-fallback",
});
assert.equal(fallbackPack.tokens.Beast[0].name, "Dragon Lord");
assert.equal(fallbackPack.tokens.Undead[0].file, "assets/quick-creatures-tokens/MM2/Dragon_Lord.png");

assert.equal(tokenPacks.resolveA5eTokenMapping("Aboleth.webp", "MM")?.creatureType, "Aberration");
assert.equal(tokenPacks.resolveA5eTokenMapping("Beast_Giant_Spider.webp", "MM")?.creatureName, "Giant Spider");
assert.equal(tokenPacks.resolveA5eTokenMapping("Angel.png", "MM")?.creatureName, "Angel of Protection");

const disabledGame = {
  modules: new Map([["pf2e-tokens-bestiaries", { active: true }]]),
  system: { id: "dnd5e" },
  settings: { get: (_ns, key) => ({
    enableOriginalTokens: false,
    enableCuteTokens: false,
    enablePathfinderTokensBestiaries: false,
  }[key]) },
};
assert.deepEqual(Object.keys(tokenPacks.getTokenSetChoices(disabledGame)), ["Original_Tokens"], "Original fallback remains if every set is disabled");

const settingsSource = fs.readFileSync("scripts/app/quick-creatures-app.js", "utf8");
for (const key of [
  "defaultTokenSet",
  "enablePathfinderTokensBestiaries",
  "enablePathfinderTokensMonsterCore",
  "enablePathfinderTokensMonsterCore2",
  "enableOriginalTokens",
  "enableCuteTokens",
  "enableA5eSystemTokens",
  "enableA5eMonstrousMenagerieTokens",
  "enableA5eMonstrousMenagerie2Tokens",
  "customTokenDirectory",
]) {
  const registration = new RegExp(`register\\("quick-creatures", "${key}"[\\s\\S]*?config: false,`);
  assert.match(settingsSource, registration, `${key} must be hidden from the main SettingsConfig list`);
}
assert.match(settingsSource, /registerMenu\("quick-creatures", "configureTokens"/, "Configure Tokens settings menu must be registered");

const templateSource = fs.readFileSync("templates/token-set-config.hbs", "utf8");
const sectionKeys = ["defaults", "core", "pathfinder", "a5e", "custom"];
assert.deepEqual(
  sectionKeys.map(key => templateSource.indexOf(`quick-creatures.tokenConfig.sections.${key}`)).map(index => index > -1),
  [true, true, true, true, true],
);
assert.ok(sectionKeys.every((key, index) => index === 0 || templateSource.indexOf(`sections.${sectionKeys[index - 1]}`) < templateSource.indexOf(`sections.${key}`)), "template sections must be in requested order");
assert.match(
  templateSource.trim(),
  /^<section class="standard-form scrollable">[\s\S]*<\/section>$/,
  "ApplicationV2 template part must render a single UIConfig-style root section element",
);
assert.doesNotMatch(
  templateSource,
  /groups\.\[/,
  "template must not use array-index path syntax; Foundry Handlebars has broken on paths like archetypes.[0] before",
);

assert.match(
  templateSource,
  /<legend>\{\{localize "quick-creatures\.tokenConfig\.sections\.a5e"\}\}<\/legend>\s*<p class="hint">\{\{localize "quick-creatures\.tokenConfig\.a5eOverlapHint"\}\}<\/p>/,
  "A5E section must warn that A5E System and Monstrous Menagerie overlap heavily",
);
assert.match(
  templateSource,
  /\{\{#if statusKey\}\}\s*<p class="hint">\{\{localize statusKey\}\}<\/p>\s*\{\{\/if\}\}/,
  "token config rows must render per-pack status hints",
);

const configSource = fs.readFileSync("scripts/app/token-set-config.js", "utf8");
assert.match(
  configSource,
  /customSets:\s*customSets\.filter\(set => !A5E_TOKEN_PACKS\[set\.id\]\)/,
  "known A5E folders must be hidden from the Custom Token Sets section",
);
assert.match(
  configSource,
  /window:\s*\{[\s\S]*?contentClasses:\s*\["standard-form"\]/,
  "token config window content section must use Foundry's standard-form styling like UIConfig",
);
assert.match(configSource, /position:\s*\{\s*width:\s*540\s*\}/, "token config window width must match UIConfig");
assert.match(configSource, /form:\s*\{[\s\S]*?scrollable:\s*\[""\]/, "token config form part must use UIConfig scrollable form part styling");
assert.match(configSource, /footer:\s*\{[\s\S]*?template:\s*"templates\/generic\/form-footer\.hbs"/, "token config must use Foundry's generic form footer like UIConfig");
assert.match(configSource, /buttons:\s*\[/, "token config context must provide generic form-footer buttons");
assert.match(
  configSource,
  /customSets\.map\(set => \[set\.id, Boolean\(data\.customEnabled\?\.\[set\.id\]\)\]\)/,
  "custom enablement submit must persist false for unchecked dynamic custom sets",
);

assert.match(templateSource, /^<section class="standard-form scrollable">/, "token config template must use UIConfig's standard-form scrollable root section");
assert.match(templateSource, /<fieldset>[\s\S]*<legend>/, "token config groups must render as UIConfig-style fieldsets with legends");
assert.doesNotMatch(templateSource, /<h2>/, "token config must not use custom h2 section styling");
assert.doesNotMatch(templateSource, /<footer/, "token config must use the generic form-footer part, not a custom footer");
assert.match(
  templateSource,
  /<div class="form-group">\s*<label class="qc-token-set-label" for="qc-token-enabled-\{\{id\}\}">\{\{name\}\}<\/label>\s*<div class="form-fields">\s*<input id="qc-token-enabled-\{\{id\}\}" type="checkbox"/,
  "token set checkboxes must match SettingsConfig layout: label left, form-fields checkbox right",
);
assert.match(
  templateSource,
  /<div class="form-group">\s*<label class="qc-token-set-label" for="qc-token-custom-enabled-\{\{id\}\}">\{\{name\}\}<\/label>\s*<div class="form-fields">\s*<input id="qc-token-custom-enabled-\{\{id\}\}" type="checkbox"/,
  "custom token checkboxes must match SettingsConfig layout: label left, form-fields checkbox right",
);

const scssSource = fs.readFileSync("scss/module.scss", "utf8");
assert.match(
  scssSource,
  /\.qc-token-set-label\s*\{\s*white-space:\s*nowrap;/,
  "token set labels must not wrap prefixes like 'Pathfinder Tokens:' onto a separate line",
);

console.log("token set config tests passed");
