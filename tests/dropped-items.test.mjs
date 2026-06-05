import assert from "node:assert/strict";

let id = 0;
globalThis.foundry = {
  utils: {
    deepClone: value => structuredClone(value),
    randomID: () => `testid${++id}`,
  },
};

const dnd = await import(`../scripts/systems/dnd5e-adapter.js?t=${Date.now()}`);
const bf = await import(`../scripts/systems/black-flag-adapter.js?t=${Date.now()}`);

const stats = { PAB: "+6", ACDC: 15, DpACalc: "2d8+3" };

const dndWeapon = dnd.normalizeDroppedItem({
  _id: "sourceWeaponId",
  name: "Longsword",
  type: "weapon",
  system: {
    activities: {
      a1: {
        type: "attack",
        attack: { ability: "str", flat: false, bonus: "" },
        damage: { parts: [{ number: 1, denomination: 8, bonus: "", types: ["slashing"] }], includeBase: true },
      },
    },
  },
}, stats);
assert.equal(dndWeapon._id, undefined, "dnd5e dropped items must not preserve source item ids");
assert.equal(dndWeapon.system.activities.a1.attack.ability, "");
assert.equal(dndWeapon.system.activities.a1.attack.flat, true);
assert.equal(dndWeapon.system.activities.a1.attack.bonus, "+6");
assert.deepEqual(dndWeapon.system.activities.a1.damage.parts[0], {
  number: 2,
  denomination: 8,
  bonus: "3",
  types: [],
  custom: { enabled: false },
  scaling: { number: 1 },
});
assert.equal(dndWeapon.system.activities.a1.damage.includeBase, false);

const dndFeature = dnd.normalizeDroppedItem({
  name: "Poison Breath",
  type: "feat",
  system: {
    activities: {
      s1: { type: "save", save: { dc: { formula: "12", calculation: "spellcasting" } } },
      a1: { type: "attack", attack: { flat: false, bonus: "" }, damage: { parts: [{ number: 1, denomination: 4 }], includeBase: true } },
    },
  },
}, stats);
assert.equal(dndFeature.system.activities.s1.save.dc.formula, "15");
assert.equal(dndFeature.system.activities.s1.save.dc.calculation, "");
assert.equal(dndFeature.system.activities.a1.attack.bonus, "+6");
assert.equal(dndFeature.system.activities.a1.damage.parts[0].denomination, 4, "non-weapon dropped attacks keep original damage");

const bfWeapon = bf.normalizeDroppedItem({
  _id: "sourceBfWeaponId",
  name: "Dart",
  type: "weapon",
  system: {
    activities: {
      a1: {
        type: "attack",
        system: { attack: { flat: false, bonus: "" }, damage: { parts: [{ number: 1, denomination: 4 }], includeBase: false } },
      },
    },
  },
}, stats);
assert.equal(bfWeapon._id, undefined, "BF dropped items must not preserve source item ids");
assert.equal(bfWeapon.system.activities.a1.system.attack.flat, true);
assert.equal(bfWeapon.system.activities.a1.system.attack.bonus, "+6");
assert.deepEqual(bfWeapon.system.activities.a1.system.damage.parts[0], {
  number: 2,
  denomination: 8,
  bonus: "3",
  custom: { enabled: false },
  type: "",
  scaling: { number: 1 },
});
assert.equal(bfWeapon.system.activities.a1.system.damage.includeBase, false);

const bfSpell = bf.normalizeDroppedItem({
  name: "Fireball",
  type: "spell",
  system: {
    activities: {
      s1: { type: "save", system: { save: { dc: {} } } },
    },
  },
}, stats, { abilities: { charisma: { mod: 5 }, wisdom: { mod: 2 }, intelligence: { mod: 1 } } });
assert.equal(bfSpell.flags["black-flag"].relationship.origin.ability, "charisma");
assert.deepEqual(bfSpell.system.activities.s1.system.save.dc, { ability: "custom", formula: "15" });

console.log("dropped items tests passed");
