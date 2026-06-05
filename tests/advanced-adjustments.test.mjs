import assert from "node:assert/strict";
import {
  adjustPercent,
  nextPercentStep,
  nextAbilityStep,
  modifierToDnd5eScore,
  adjustDamageStats,
  deriveAdvancedStats,
} from "../scripts/app/advanced-adjustments.js";

assert.equal(adjustPercent(15, 10), 16);
assert.equal(adjustPercent(15, 20), 18);
assert.equal(adjustPercent(65, -10), 58);
assert.equal(adjustPercent(65, -20), 52);

assert.equal(nextPercentStep(0, 1), 10);
assert.equal(nextPercentStep(10, 1), 20);
assert.equal(nextPercentStep(20, 1), 20);
assert.equal(nextPercentStep(0, -1), -10);
assert.equal(nextPercentStep(-20, -1), -20);

assert.equal(nextAbilityStep(-2, -1), -2);
assert.equal(nextAbilityStep(0, 1), 1);
assert.equal(nextAbilityStep(3, 1), 4);
assert.equal(nextAbilityStep(4, 1), 4);
assert.equal(nextAbilityStep(2, 1, { enabled: false }), 2);

assert.equal(modifierToDnd5eScore(-2), 6);
assert.equal(modifierToDnd5eScore(0), 10);
assert.equal(modifierToDnd5eScore(4), 18);

const base = { ACDC: "15", HP: "65", DpR: "35", NoA: "3", DpA: "12", DpACalc: "3d6+2" };
assert.deepEqual(adjustDamageStats(base, 0), { DpR: "35", DpA: "12", DpACalc: "3d6+2", NoA: "3" });
const plus10 = adjustDamageStats(base, 10);
assert.equal(Number(plus10.DpR), 38);
assert.notEqual(plus10.DpACalc, "3d6+2");
assert.equal(Number(adjustDamageStats(base, 20).DpR), 42);
assert.equal(Number(adjustDamageStats(base, -10).DpR), 31);
assert.equal(Number(adjustDamageStats(base, -20).DpR), 28);
assert.match(plus10.DpACalc, /^\d+d(4|6|8|10|12)(\+\d+)?$/, "damage adjustment must produce a real dice formula without negative modifiers");
assert.doesNotMatch(adjustDamageStats({ DpR: "6", NoA: "2", DpA: "3", DpACalc: "1d6" }, -20).DpACalc, /-\d+/, "damage formula modifiers must never be negative");
assert.doesNotMatch(adjustDamageStats({ DpR: "10", NoA: "3", DpA: "3", DpACalc: "1d6" }, 20).DpACalc, /-\d+/, "damage formula modifiers must never be negative when increasing damage");
assert.equal(plus10.NoA ?? base.NoA, base.NoA, "damage adjustment must not change number of attacks");

const derived = deriveAdvancedStats(base, { hp: 10, ac: 10, damage: 20, abilities: { str: 2 } }, { enabled: true });
assert.equal(derived.HP, "71");
assert.equal(derived.ACDC, "16");
assert.equal(derived.DC, "15");
assert.equal(derived.ACDisplay, "16 / 15");
assert.equal(derived.AdvancedAbilityMods.str, 2);
assert.equal(deriveAdvancedStats(base, { hp: 20 }, { enabled: false }).HP, "65");

console.log("advanced adjustment helper tests passed");
