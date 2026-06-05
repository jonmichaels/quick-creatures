export const PERCENT_STEPS = [-20, -10, 0, 10, 20];
export const ABILITY_STEPS = [-2, -1, 0, 1, 2, 3, 4];

export function adjustPercent(base, percent) {
    return Math.floor(Number(base || 0) * (1 + Number(percent || 0) / 100));
}

function nextStep(steps, current, direction) {
    const value = Number(current || 0);
    const dir = Number(direction || 0);
    const index = steps.includes(value) ? steps.indexOf(value) : steps.indexOf(0);
    return steps[Math.max(0, Math.min(steps.length - 1, index + Math.sign(dir)))];
}

export function nextPercentStep(current, direction) {
    return nextStep(PERCENT_STEPS, current, direction);
}

export function nextAbilityStep(current, direction, { enabled = true } = {}) {
    if (!enabled) return Number(current || 0);
    return nextStep(ABILITY_STEPS, current, direction);
}

export function modifierToDnd5eScore(mod) {
    return 10 + (Number(mod || 0) * 2);
}

function parseDiceFormula(formula = "") {
    const match = String(formula).trim().match(/^(\d+)d(4|6|8|10|12)([+-]\d+)?$/i);
    if (!match) return { count: 1, die: 6, modifier: 0 };
    return {
        count: Number(match[1]),
        die: Number(match[2]),
        modifier: match[3] ? Number(match[3]) : 0,
    };
}

function candidateAverage(count, die, modifier) {
    return count * ((die + 1) / 2) + modifier;
}

function formatFormula({ count, die, modifier }) {
    const suffix = modifier > 0 ? `+${modifier}` : modifier < 0 ? String(modifier) : "";
    return `${count}d${die}${suffix}`;
}

export function formulaForAverage(targetAverage, { originalFormula = "" } = {}) {
    const target = Number(targetAverage || 0);
    const original = parseDiceFormula(originalFormula);
    let best = null;

    for (let count = 1; count <= 12; count += 1) {
        for (const die of [4, 6, 8, 10, 12]) {
            for (let modifier = -20; modifier <= 40; modifier += 1) {
                const candidate = { count, die, modifier };
                const avg = candidateAverage(count, die, modifier);
                const score = [
                    Math.abs(avg - target),
                    Math.abs(count - original.count),
                    Math.abs(die - original.die),
                    Math.abs(modifier - original.modifier),
                    Math.abs(modifier),
                    count,
                    die,
                ];
                if (!best || score.some((value, index) => value < best.score[index]) && !score.some((value, index) => value > best.score[index] && score.slice(0, index).every((v, i) => v === best.score[i]))) {
                    best = { candidate, score };
                }
            }
        }
    }

    return formatFormula(best?.candidate || { count: 1, die: 4, modifier: 0 });
}

export function adjustDamageStats(stats, percent) {
    const step = Number(percent || 0);
    if (step === 0) {
        return {
            DpR: String(stats.DpR),
            DpA: String(stats.DpA),
            DpACalc: String(stats.DpACalc),
            NoA: stats.NoA,
        };
    }
    const adjustedDpR = adjustPercent(stats.DpR, step);
    const attacks = Math.max(1, parseInt(stats.NoA, 10) || 1);
    const targetPerAttack = Math.floor(adjustedDpR / attacks);
    return {
        DpR: String(adjustedDpR),
        DpA: String(targetPerAttack),
        DpACalc: formulaForAverage(targetPerAttack, { originalFormula: stats.DpACalc }),
        NoA: stats.NoA,
    };
}

export function deriveAdvancedStats(baseStats, adjustments = {}, { enabled = false } = {}) {
    const base = { ...baseStats };
    base.BaseACDC = String(baseStats.ACDC);
    base.DC = String(baseStats.ACDC);
    base.AdvancedAbilityMods = { ...(adjustments.abilities || {}) };
    if (!enabled) return base;

    base.HP = String(adjustPercent(baseStats.HP, adjustments.hp || 0));
    const adjustedAC = adjustPercent(baseStats.ACDC, adjustments.ac || 0);
    base.AC = String(adjustedAC);
    base.ACDC = String(adjustedAC);
    base.ACDisplay = `${adjustedAC} / ${baseStats.ACDC}`;
    Object.assign(base, adjustDamageStats(baseStats, adjustments.damage || 0));
    return base;
}
