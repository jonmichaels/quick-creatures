# Black Flag (Tales of the Valiant) Foundry v13 Data Model Reference

> **Source:** BF 2.0.074 on Foundry 13.351 — verified via `item.toObject()`  
> **Method:** Created test items via MCP → read back full structure  
> **Purpose:** Authoritative reference. No guessing permitted.

---

## Item Type Names

| dnd5e | Black Flag |
|-------|------------|
| `"feat"` | `"feature"` |
| `"weapon"` | `"weapon"` |

---

## 🔴 RANGE IS A SEPARATE ACTIVITY ENTRY

**This was the root cause of most bugs.** In BF, `range` is NOT nested inside attack/save activities. It is a **sibling entry** in the `activities` map:

```json
"activities": {
  "<attack-activity-id>": {
    "type": "attack",
    "range": { ... }   ← WRONG — BF strips this!
  },
  "range": {           ← CORRECT — separate entry
    "override": false,
    "reach": 5,
    "unit": "foot"
  }
}
```

---

## Save Activity (Damaging Burst)

```json
"<16-char-hex>": {
  "_id": "<16-char-hex>",
  "type": "save",
  "name": "Damaging Burst",
  "activation": {
    "type": "action",
    "override": false,
    "primary": true
  },
  "system": {
    "save": {
      "ability": ["dexterity", "constitution", "wisdom"],
      "dc": { "formula": "13" },
      "visible": true
    },
    "damage": {
      "parts": [{
        "number": 1,
        "denomination": 6,
        "bonus": "8",
        "custom": { "enabled": false },
        "type": ""
      }],
      "onSave": "half"
    },
    "effects": []
  },
  "target": {
    "template": {
      "type": "sphere",
      "count": "10",
      "contiguous": false,
      "unit": "foot"
    },
    "affects": { "type": "creature", "choice": false },
    "prompt": true,
    "override": false
  },
  "description": "",
  "flags": {},
  "sort": 0,
  "consumption": { "scale": { "allowed": false }, "targets": [] },
  "duration": { "unit": "instantaneous", "concentration": false, "override": false },
  "magical": false,
  "uses": { "spent": 0, "consumeQuantity": false, "recovery": [] },
  "visibility": { "level": {}, "requireAttunement": false, "requireIdentification": false, "requireMagic": false }
}
```

**Plus a sibling `"range"` activity:**
```json
"range": {
  "override": false,
  "short": 120,
  "unit": "foot"
}
```

---

## Attack Activity (Melee Weapon)

```json
"<16-char-hex>": {
  "_id": "<16-char-hex>",
  "type": "attack",
  "name": "Melee Attack",
  "activation": {
    "type": "action",
    "override": false,
    "primary": true
  },
  "system": {
    "attack": {
      "bonus": "+5",
      "flat": true,
      "critical": {},
      "type": {}
    },
    "damage": {
      "parts": [{
        "number": 2,
        "denomination": 8,
        "bonus": "3",
        "custom": { "enabled": false },
        "type": "slashing"
      }],
      "critical": {},
      "includeBase": true
    },
    "effects": []
  },
  "target": {
    "template": { "count": "", "type": "", "unit": "foot", "contiguous": false },
    "affects": { "choice": false },
    "prompt": true,
    "override": false
  },
  "description": "",
  "flags": {},
  "sort": 0,
  "consumption": { "scale": { "allowed": false }, "targets": [] },
  "duration": { "unit": "instantaneous", "concentration": false, "override": false },
  "magical": false,
  "uses": { "spent": 0, "consumeQuantity": false, "recovery": [] },
  "visibility": { "level": {}, "requireAttunement": false, "requireIdentification": false, "requireMagic": false }
}
```

**Sibling `"range"` activity (melee):**
```json
"range": {
  "override": false,
  "reach": 5,
  "unit": "foot"
}
```

**Sibling `"range"` activity (ranged):**
```json
"range": {
  "override": false,
  "short": 60,
  "long": 120,
  "unit": "foot"
}
```

---

## Utility Activity (Multiattack)

```json
"<16-char-hex>": {
  "_id": "<16-char-hex>",
  "type": "utility",
  "name": "Multiattack",
  "activation": {
    "type": "action",
    "override": false,
    "primary": true
  },
  "system": {
    "roll": { "prompt": false, "visible": false },
    "effects": []
  },
  "target": {
    "template": { "contiguous": false, "unit": "foot" },
    "affects": { "choice": false },
    "prompt": true,
    "override": false
  },
  "description": "",
  "flags": {},
  "sort": 0,
  "consumption": { "scale": { "allowed": false }, "targets": [] },
  "duration": { "unit": "instantaneous", "concentration": false, "override": false },
  "magical": false,
  "uses": { "spent": 0, "consumeQuantity": false, "recovery": [] },
  "visibility": { "level": {}, "requireAttunement": false, "requireIdentification": false, "requireMagic": false }
}
```

**No sibling `"range"` for utility —** not needed.

---

## Weapon Item (top-level system fields)

```json
"system": {
  "activities": { /* activities + range entry */ },
  "description": { "value": "<p>...</p>", "source": {} },
  "identifier": { "value": "slugified-name" },
  "uses": { "spent": 0, "consumeQuantity": false, "recovery": [] },
  "unidentified": { "description": "", "value": false },
  "attunement": {},
  "container": null,
  "price": { "value": 0, "denomination": "gp" },
  "quantity": 1,
  "weight": { "value": 0, "unit": "pound" },
  "overrides": { "proficiency": null },
  "properties": [],
  "ammunition": {},
  "damage": { "base": {} },
  "options": [],
  "type": { "value": "melee" }    // or "ranged"
}
```

## Feature Item (top-level system fields)

```json
"system": {
  "activities": { /* activities + range entry */ },
  "description": { "value": "<p>...</p>", "source": {} },
  "identifier": { "value": "slugified-name" },
  "uses": { "spent": 0, "consumeQuantity": false, "recovery": [] },
  "advancement": {},
  "restriction": {
    "allowMultipleTimes": false,
    "custom": [],
    "filters": [],
    "items": [],
    "requireAll": true
  },
  "type": {},
  "overrides": { "proficiency": null },
  "level": {}
}
```

---

## Ability Score Names

| Short (dnd5e) | Full (BF) |
|---------------|-----------|
| `"str"` | `"strength"` |
| `"dex"` | `"dexterity"` |
| `"con"` | `"constitution"` |
| `"int"` | `"intelligence"` |
| `"wis"` | `"wisdom"` |
| `"cha"` | `"charisma"` |

---

## Unit Names

| dnd5e | Black Flag |
|-------|------------|
| `"ft"` | `"foot"` |
| `"mi"` | `"mile"` |

---

## Actor NPC Structure

```json
{
  "name": "Creature Name",
  "type": "npc",
  "img": "modules/quick-creatures/tokens/aberration.png",
  "system": {
    "attributes": {
      "ac": { "flat": 13, "calc": "flat" },
      "hp": { "value": 45, "max": 45 },
      "prof": 5,
      "cr": 3,
      "movement": { "walk": 30, "units": "ft" }
    },
    "traits": { "type": { "value": "aberration" } },
    "abilities": {
      "strength": { "mod": 0, "proficient": 0 },
      "dexterity": { "mod": 2, "proficient": 1 },
      "constitution": { "mod": 0, "proficient": 0 },
      "intelligence": { "mod": 0, "proficient": 0 },
      "wisdom": { "mod": 0, "proficient": 0 },
      "charisma": { "mod": 0, "proficient": 0 }
    }
  },
  "prototypeToken": {
    "name": "Creature Name",
    "texture": { "src": "modules/quick-creatures/tokens/aberration.png" },
    "displayName": 20,
    "actorLink": true
  }
}
```

---

## Checklist: Building a Save Activity

- [ ] `item.type = "feature"`
- [ ] `_id` = `foundry.utils.randomID()` (16-char hex)
- [ ] `type = "save"`
- [ ] `system.save.ability` = array of full-word abilities (e.g., `["dexterity","constitution","wisdom"]`)
- [ ] `system.save.dc = { formula: String }` — NOT `{ calculation, formula }`, NOT raw int
- [ ] **NO `scaling` field** on save
- [ ] `system.damage.onSave = "half"`
- [ ] `system.damage.parts[0].bonus` = String or `""`
- [ ] `target.template.unit = "foot"`
- [ ] **RANGE is a sibling activity entry:** `activities.range = { override: false, short: N, unit: "foot" }` (or `reach: 5` for melee)
- [ ] `sort = 0`, `magical = false`, `flags = {}`, `description = ""`
- [ ] `visibility = { level: {}, requireAttunement: false, requireIdentification: false, requireMagic: false }`
- [ ] `consumption = { scale: { allowed: false }, targets: [] }`

## Checklist: Building an Attack Activity

- [ ] `item.type = "weapon"`
- [ ] `system.type.value = "melee"` or `"ranged"`
- [ ] `system.damage.base = {}`
- [ ] Weapon-specific top-level fields: `unidentified`, `attunement`, `container`, `price`, `quantity`, `weight`, `properties`, `ammunition`, `options`
- [ ] `type = "attack"`
- [ ] `system.attack = { bonus: "+N", flat: true, critical: {}, type: {} }`
- [ ] `system.damage.parts[0].type` = damage type
- [ ] `system.damage.includeBase = true`
- [ ] `system.damage.critical = {}`
- [ ] **RANGE as sibling:** `activities.range = { override: false, reach: 5, unit: "foot" }` (melee) or `{ override: false, short: 60, long: 120, unit: "foot" }` (ranged)
- [ ] All generic fields: `_id`, `sort`, `flags`, `visibility`, `magical`, `description`, `consumption`, `uses`, `duration`
