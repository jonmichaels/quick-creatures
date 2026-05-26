# Quick Creatures — Claude Code Context

## Build System (CRITICAL)

**This module uses webpack.** Source edits in `scripts/` DO NOT reach Foundry until rebuilt.

```bash
npm run build    # production bundle → scripts/module.js  
npm run watch    # dev mode with auto-rebuild
```

`scripts/module.js` is **gitignored** — the webpack output. Foundry loads THIS file, not individual source files.

### CSS Compilation

**The CSS source is `scss/module.scss`** (SCSS with nested rules). Webpack compiles it to `styles/module.css` via sass-loader → css-loader → MiniCssExtractPlugin. Foundry loads `styles/module.css` (declared in `module.json`). `scripts/module.css` is also emitted by webpack from the JS entry point — do NOT edit it directly; it gets overwritten on each build. **Always edit `scss/module.scss`, then `npm run build`.**

## BF Data Model Reference

**DO NOT GUESS at BF data structures.** The authoritative reference is in the foundry-vtt-dev skill:
```
skill_view(name="rpg/foundry-vtt-dev", file_path="references/bf-save-activity-data-model.md")
```
Also: `references/black-flag-item-types.md` for type mapping.

Test-create+inspect pattern (from the reference):
1. Create test actor + items via `mcp_foundry_add_actor_items`
2. Read back via `mcp_foundry_execute_script` → `item.toObject()`
3. Compare submitted vs stored

## Deployment
- Symlinked: `/home/jon/foundryuserdata/Data/modules/quick-creatures` → `/home/jon/projects/quick-creatures`
- Foundry v13 minimum, ApplicationV2
- Systems: dnd5e, black-flag

## Architecture
- **System adapters:** `scripts/systems/black-flag-adapter.js`, `scripts/systems/dnd5e-adapter.js`
- **Data:** `scripts/data/cr-table.js`, `scripts/data/archetypes.js`, `scripts/data/features.js`, `scripts/data/types.js`
- **UI:** `scripts/app/` — ApplicationV2 two-tab dialog
- **Entry:** `scripts/main.js` → webpack → `scripts/module.js`

## Key BF Rules
- Item type: `"feature"` not `"feat"`
- Abilities: `{ mod: N }` not `{ value: N }` (NPCs)
- CR at `system.attributes.cr`
- DC from AC/DC column (`stats.ACDC`)
- Save ability: array of full words — `["dexterity","constitution","wisdom"]` NOT `"dex"`
- DC format: `{ formula: "13" }` NOT raw int
- Range: **SIBLING entry** in activities map, NOT nested inside activity
- Units: `"foot"` not `"ft"`
- Attack bonus: `{ flat: true, bonus: "+N" }`
- Creature type: `system.traits.type.value`

## Damaging Burst Formula
`1d6 + floor(DpR / 2) - 3` (min +0), DC from ACDC, ONE save activity with ability array

## Git
- Author: `276414342+hermes90201@users.noreply.github.com`
- `.hermes/` gitignored

## Foundry Settings Pitfalls

1. **Array `choices` stores the INDEX, not the value.** `choices: ["Tiny", "Small"]` stores `"1"` for "Small", not `"Small"`. Always use object `choices: {Tiny: "Tiny", Small: "Small"}`.

2. **Object `choices` with integer-like keys sort numerically.** JavaScript `Object.entries()` iterates integer-like string keys (`"0"`, `"1"`...) before non-integer keys (`"1/2"`). Prefix with a non-digit character (e.g., `_1`, `_1/2`) to preserve insertion order.

3. **`default:` is only for first-time installers.** Existing users who saved a setting are unaffected by default changes — `game.settings.get()` returns the stored value.
