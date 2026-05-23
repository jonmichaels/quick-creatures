/**
 * Monster Features Library.
 *
 * Source: The Lazy GM's 5e Monster Builder Resource Document (CC-BY 4.0)
 * Licensed under Creative Commons Attribution 4.0 International License.
 *
 * Each feature is a template that can be applied to any generated monster.
 * Features may modify the creature's attacks (reduceAtk), add damage (isDmg),
 * grant saving throws (hasSave), apply active effects (isEffect), or provide
 * narrative/mechanical descriptions.
 */

const MONSTER_FEATURES = [
    {
        name: "Cunning Action",
        isEffect: false,
        isDmg: false,
        desc: "On each of their turns, this creature can use a bonus action to take the Dash, Disengage, or Hide action.",
        item: {
            name: "Cunning Action",
            type: "feat",
            img: "icons/magic/control/hypnosis-mesmerism-watch.webp",
            system: {
                description: {
                    value: "<p>On each of their turns, this creature can use a bonus action to take the Dash, Disengage, or Hide action.</p>",
                },
                activation: {
                    type: "bonus",
                    cost: 1,
                },
                target: {
                    type: "self",
                },
                range: {
                    units: "self",
                },
                type: {
                    value: "monster",
                },
            },
        },
    },
    {
        name: "Damaging Blast",
        isEffect: false,
        isDmg: true,
        desc: "This creature has one or more single-target ranged attacks using the attack bonus and damage calculated above, and which deal damage of an appropriate type.",
        item: {
            name: "Damaging Blast",
            type: "weapon",
            img: "icons/magic/light/beam-rays-magenta.webp",
            system: {
                description: {
                    value: "<p>This creature has one or more single-target ranged attacks using the attack bonus and damage calculated above, and which deal damage of an appropriate type.</p>",
                },
                proficient: 0,
                activation: {
                    type: "action",
                    cost: 1,
                },
                target: {
                    value: 1,
                    type: "creature",
                },
                range: {
                    value: 60,
                    units: "ft",
                },
                actionType: "rwak",
                type: {
                    value: "natural",
                    baseItem: "",
                },
            },
        },
    },
    {
        name: "Damage Reflection",
        isEffect: false,
        reduceAtk: true,
        isDmg: true,
        divideDmg: 2,
        desc: "Whenever a creature within 5 feet of this creature hits them with a melee attack, the attacker takes damage in return of a type appropriate to the creature. The damage dealt is equal to half the damage of one of this creature's attacks. If you give a creature this feature, give them one less attack than normal.",
        item: {
            name: "Damage Reflection",
            type: "feat",
            img: "icons/magic/defensive/shield-barrier-deflect-gold.webp",
            system: {
                description: {
                    value: "<p>Whenever a creature within 5 feet of this creature hits them with a melee attack, the attacker takes damage in return of a type appropriate to the creature. The damage dealt is equal to half the damage of one of this creature's attacks. If you give a creature this feature, give them one less attack than normal.</p>",
                },
            },
        },
    },
    {
        name: "Damage Transference",
        isEffect: false,
        isDmg: false,
        desc: "When this creature takes damage, they can transfer half or all of that damage (your choice) to a willing creature within 30 or 60 feet of them. This feature is particularly good for boss monsters.",
        item: {
            name: "Damage Transference",
            type: "feat",
            img: "icons/magic/control/energy-stream-link-teal.webp",
            system: {
                description: {
                    value: "<p>When this creature takes damage, they can transfer half or all of that damage (your choice) to a willing creature within 30 or 60 feet of them. This feature is particularly good for boss monsters.</p>",
                },
                activation: {
                    type: "reaction",
                    cost: 1,
                },
            },
        },
    },
    {
        name: "Damaging Aura",
        isEffect: false,
        divideDmg: 2,
        reduceAtk: true,
        isDmg: true,
        desc: "Each creature who starts their turn within 10 feet of this creature takes damage of a type appropriate to the creature. The damage dealt is equal to half the damage of one of this creature's attacks. If you give a creature this feature, give them one less attack than normal.",
        item: {
            name: "Damaging Aura",
            type: "feat",
            img: "icons/magic/control/encase-creature-monster-hold.webp",
            system: {
                description: {
                    value: "<p>Each creature who starts their turn within 10 feet of this creature takes damage of a type appropriate to the creature. The damage dealt is equal to half the damage of one of this creature's attacks. If you give a creature this feature, give them one less attack than normal.</p>",
                },
                activation: {
                    type: "none",
                },
                target: {
                    type: "self",
                },
                range: {
                    value: 10,
                    units: "ft",
                },
                ability: "none",
                actionType: "other",
                type: {
                    value: "monster",
                    subtype: "",
                },
                properties: ["mgc"],
            },
        },
    },
    {
        name: "Damaging Burst",
        isEffect: false,
        isDmg: true,
        hasSave: true,
        divideDmg: 2,
        useDpR: true,
        desc: "As an action, this creature can create a burst of energy, magic, spines, or some other effect in a 10-foot-radius sphere, either around themself or at a point within 120 feet. Each creature in that area must make a Dexterity, Constitution, or Wisdom saving throw (your choice, based on the type of burst). On a failure, a target takes damage of an appropriate type equal to half this creature's total damage per round. On a success, a target takes half as much damage.",
        item: {
            name: "Damaging Burst",
            type: "weapon",
            img: "icons/magic/lightning/orb-ball-purple.webp",
            system: {
                description: {
                    value: "<p>As an action, this creature can create a burst of energy, magic, spines, or some other effect in a 10-foot-radius sphere, either around themself or at a point within 120 feet. Each creature in that area must make a Dexterity, Constitution, or Wisdom saving throw (your choice, based on the type of burst). On a failure, a target takes damage of an appropriate type equal to half this creature's total damage per round. On a success, a target takes half as much damage.</p>",
                    chat: "",
                },
                activation: {
                    type: "action",
                    cost: 1,
                    condition: "",
                },
                target: {
                    value: 10,
                    units: "ft",
                    type: "sphere",
                    prompt: true,
                },
                range: {
                    value: 120,
                    long: null,
                    units: "ft",
                },
                actionType: "save",
                save: {
                    ability: "dex",
                    dc: null,
                    scaling: "flat",
                },
            },
        },
    },
    {
        name: "Energy Weapons (bonus damage)",
        isEffect: true,
        isDmg: true,
        desc: "The creature's weapon attacks deal extra damage of an appropriate type. You can add this damage on top of the creature's regular damage output to give them a combat boost, or you can replace some of the creature's normal weapon damage with this energy damage.",
        item: {
            name: "Energy Weapons (bonus damage)",
            type: "feat",
            img: "icons/magic/fire/dagger-rune-enchant-flame-blue-yellow.webp",
            system: {
                description: {
                    value: "<p>The creature's weapon attacks deal extra damage of an appropriate type. You can add this damage on top of the creature's regular damage output to give them a combat boost, or you can replace some of the creature's normal weapon damage with this energy damage.</p>",
                },
                type: {
                    value: "monster",
                },
                properties: ["mgc"],
            },
            effects: [
                {
                    name: "Energy Weapons (bonus damage)",
                    icon: "icons/magic/fire/dagger-rune-enchant-flame-blue-yellow.webp",
                    disabled: false,
                    changes: [
                        { key: "system.bonuses.mwak.damage", mode: 2, value: "" },
                        { key: "system.bonuses.rwak.damage", mode: 2, value: "" },
                        { key: "system.bonuses.rsak.damage", mode: 2, value: "" },
                        { key: "system.bonuses.msak.damage", mode: 2, value: "" },
                    ],
                },
            ],
        },
    },
    {
        name: "Energy Weapons (extra attack)",
        isEffect: false,
        isDmg: true,
        desc: "The creature's weapon attacks deal extra damage of an appropriate type. You can add this damage on top of the creature's regular damage output to give them a combat boost, or you can replace some of the creature's normal weapon damage with this energy damage.",
        item: {
            name: "Energy Weapons (extra attack)",
            type: "weapon",
            img: "icons/magic/symbols/runes-etched-steel-blade.webp",
            system: {
                description: {
                    value: "<p>The creature's weapon attacks deal extra damage of an appropriate type. You can add this damage on top of the creature's regular damage output to give them a combat boost, or you can replace some of the creature's normal weapon damage with this energy damage.</p>",
                },
                proficient: 0,
                activation: {
                    type: "action",
                },
                target: {
                    value: 1,
                    type: "creature",
                },
                range: {
                    units: "touch",
                },
                actionType: "msak",
                type: {
                    value: "simpleM",
                    baseItem: "",
                },
            },
        },
    },
    {
        name: "Knockdown",
        isEffect: false,
        isDmg: false,
        desc: "When this creature hits a target with a melee attack, the target must succeed on a Strength saving throw or be knocked prone.",
        item: {
            name: "Knockdown",
            type: "feat",
            img: "icons/skills/melee/unarmed-punch-fist-yellow-red.webp",
            system: {
                description: {
                    value: "<p>When this creature hits a target with a melee attack, the target must succeed on a Strength saving throw or be knocked prone.</p>",
                    chat: "",
                },
                actionType: "save",
                save: {
                    ability: "str",
                    dc: null,
                    scaling: "str",
                },
                type: {
                    value: "monster",
                    subtype: "",
                },
            },
        },
    },
    {
        name: "Misty Step",
        isEffect: false,
        isDmg: false,
        desc: "As a bonus action, this creature can teleport up to 30 feet to an unoccupied space they can see.",
        item: {
            name: "Misty Step",
            type: "feat",
            img: "icons/magic/lightning/orb-ball-spiral-blue.webp",
            system: {
                description: {
                    value: "<p>As a bonus action, this creature can teleport up to 30 feet to an unoccupied space they can see.</p>",
                },
                activation: {
                    type: "bonus",
                    cost: 1,
                },
                target: {
                    type: "self",
                },
                range: {
                    units: "self",
                },
            },
        },
    },
    {
        name: "Restraining Grab",
        isEffect: false,
        isDmg: false,
        desc: "When this creature hits a target with a melee attack, the target is grappled (escape DC based on this creature's Strength or Dexterity modifier). While grappled, the target is restrained.",
        item: {
            name: "Restraining Grab",
            type: "feat",
            img: "icons/sundries/survival/cuffs-shackles-steel.webp",
            system: {
                description: {
                    value: "<p>When this creature hits a target with a melee attack, the target is grappled (escape DC based on this creature's Strength or Dexterity modifier). While grappled, the target is restrained.</p>",
                },
            },
        },
    },
];

export { MONSTER_FEATURES };
