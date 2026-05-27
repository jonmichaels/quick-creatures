# Quick Creatures

> **⚠️ Disclaimer:** This module was created by an AI coding agent (Hephaestus, via Hermes Agent) under the direction of Jon Michaels. While tested and functional, users should verify behavior in their own games before relying on it in critical sessions.

[![Foundry VTT](https://img.shields.io/badge/Foundry-v13-orange)](https://foundryvtt.com)
[![D&D 5E](https://img.shields.io/badge/System-D%26D%205E-red)](https://dnd.wizards.com)
[![Black Flag](https://img.shields.io/badge/System-Black%20Flag%20%2F%20ToV-blue)](https://github.com/koboldpress/black-flag)
[![Version](https://img.shields.io/badge/Version-0.1.0-green)](https://github.com/jonmichaels/quick-creatures/releases)

Quickly generate custom monsters for **D&D 5E** and **Black Flag (Tales of the Valiant)**. Based on the [Lazy GM's 5e Monster Builder Resource Document](https://slyflourish.com/lazy_5e_monster_building_resource_document.html) (CC-BY 4.0). Select a Challenge Rating or archetype stat block, pick creature features, and create a fully-statted NPC in seconds.

## Features

| Feature | Description |
|---------|-------------|
| **CR-based creation** | Select a Challenge Rating (0–30) — HP, AC, proficiency bonus, and attacks auto-calculated from the table |
| **Archetype stat blocks** | 7 pre-built archetypes (Minion → Champion) with themed ability scores and saving throws |
| **Monster features** | 11 creature features including damaging auras, breath weapons, energy weapons, Misty Step, and more |
| **Dual system support** | Same interface for D&D 5E and Black Flag — system adapter handles data model differences |
| **Creature type tokens** | 14 creature type tokens included (Aberration, Beast, Dragon, Undead, etc.) |
| **Live stat preview** | See HP, AC, attacks, damage, and saving throws update as you configure |
| **Plugin expansion system** | Other modules can register additional archetypes, features, types, and token art |

## Installation

**In Foundry VTT:**
1. Go to **Add-on Modules** → **Install Module**
2. Paste the manifest URL: `https://github.com/jonmichaels/quick-creatures/releases/latest/download/module.json`
3. Click **Install**

**Manual:**
Download the [latest release](https://github.com/jonmichaels/quick-creatures/releases) and extract to `Data/modules/quick-creatures/`.

## Requirements

- **Foundry VTT** v13+
- **D&D 5E** (v5.0+) or **Black Flag Roleplaying / Tales of the Valiant** (v2.0+)

## How It Works

1. Activate the module in your world
2. Open the **Actors** sidebar
3. Click the **Generate Creature** button next to "Create Entry"
4. Choose a tab: "Monster by CR" or "Monster by Archetype"
5. Select stats, abilities, creature type, and features
6. Click **Create Creature**

The module uses a system adapter pattern — all actor creation routes through the active system's adapter, so the same interface works identically for both D&D 5E and Black Flag.

## Credits

- **Lazy GM's Monster Builder Resource Document:** Scott Fitzgerald Gray, Teos Abadía, Michael E. Shea — [CC-BY 4.0](http://creativecommons.org/licenses/by/4.0/)
- **Reference module:** [SetaSensei/lazy-monster-builder](https://github.com/SetaSensei/lazy-monster-builder) — original Foundry implementation
- **Creature tokens:** [Cute Tokens by Justin Nichol](https://opengameart.org/users/justin-nichol) — [CC-BY 4.0](http://creativecommons.org/licenses/by/4.0/)
- **Quick Creatures:** Jon Michaels, coded by Hephaestus (AI agent via Hermes Agent)

## Attribution

> This work includes material taken from the Lazy GM's 5e Monster Builder Resource Document written by Teos Abadía of Alphastream.org, Scott Fitzgerald Gray of Insaneangel.com, and Michael E. Shea of SlyFlourish.com, available under a Creative Commons Attribution 4.0 International License.

## License

This module is available under the [Creative Commons Attribution 4.0 International License](http://creativecommons.org/licenses/by/4.0/).

The source code is also available under the MIT License.
