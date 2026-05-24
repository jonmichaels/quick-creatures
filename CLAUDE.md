# Quick Creatures — Claude Code Context

## Build System (CRITICAL)

**This module uses webpack.** Source edits in `scripts/` DO NOT reach Foundry until rebuilt.

```bash
npm run build    # production bundle → scripts/module.js
npm run watch    # dev mode with auto-rebuild
```

`scripts/module.js` is **gitignored** — it's the webpack output. Foundry loads THIS file, not the individual source files. Every source change requires a rebuild before testing.

## Deployment

- Symlinked: `/home/jon/foundryuserdata/Data/modules/quick-creatures` → `/home/jon/projects/quick-creatures`
- Foundry v13 minimum, ApplicationV2
- Systems: dnd5e, black-flag

## Architecture

- **System adapters:** `scripts/systems/black-flag-adapter.js`, `scripts/systems/dnd5e-adapter.js`
  - Each exports `createFeatureItem(feature, stats)`, `createAttackItem(stats)`, `createRangedItem(stats)`, `createMultiattackItem(count)`, `buildActorData(...)`
  - BF adapter builds activities (ActivityCollection) not dnd5e-style items
- **Data layer:** `scripts/data/cr-table.js` (CR 0–30), `scripts/data/archetypes.js` (7 archetypes), `scripts/data/features.js` (monster features), `scripts/data/types.js` (creature types)
- **UI:** `scripts/app/` — ApplicationV2 two-tab dialog (CR / Archetype)
- **Entry:** `scripts/main.js` → webpack bundles everything into `scripts/module.js`

## BF Adapter Key Rules

- BF NPCs use `{ mod: N }` for abilities (not `{ value: N }`)
- CR is at `system.attributes.cr` (not `system.details.cr`)
- DC = AC/DC column from CR table (`stats.ACDC`)
- Save activities: create ONE per ability (DEX, CON, WIS → 3 activities)
- Template units: `"foot"` not `"ft"`
- Attack bonus: `flat: true, bonus: "+N"` (no auto ability+prof layering)
- Creature type: `system.traits.type.value`

## Damaging Burst Formula

`1d6 + floor(DpR / 2) - 3` (minimum +0), DC from ACDC, saves vs DEX/CON/WIS (3 activities)

## Git

- Author: `276414342+hermes90201@users.noreply.github.com`
- `.hermes/` is gitignored — plans stay local
