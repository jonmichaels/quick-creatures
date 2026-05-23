/**
 * System adapter interface definition.
 *
 * Each system adapter must implement the methods described below.
 * This file serves as documentation and reference — it is NOT imported at runtime.
 */

/**
 * @typedef {Object} SystemAdapter
 *
 * @property {string} id - System identifier (e.g. "dnd5e", "black-flag")
 *
 * @property {Function} createAttackItem
 *   Create an attack Item data object for the given stats.
 *   @param {Object} stats - CR/archetype stat block with DpACalc, atkBonus, PAB, etc.
 *   @param {number} noa - Total number of attacks (for labeling)
 *   @param {number} index - Which attack number this is (0-based)
 *   @returns {Object} Item data for Item.create / embedded document
 *
 * @property {Function} createFeatureItem
 *   Transform a feature definition into a system-appropriate Item data object.
 *   @param {Object} feature - Raw feature object from monsters data
 *   @param {Object} stats - Current stat block (for damage/save DC calculations)
 *   @returns {Object|null} Item data, or null if no item is needed
 *
 * @property {Function} createMultiattackItem
 *   Create a "Multiattack" feature item describing the creature's attacks.
 *   @param {number} noa - Number of attacks
 *   @returns {Object} Item data for the multiattack description
 *
 * @property {Function} buildActorData
 *   Build the full Actor creation data object for Actor.create().
 *   @param {string} name - Actor name
 *   @param {Object} stats - Stat block data
 *   @param {string} type - Monster type name (e.g. "Aberration")
 *   @param {Object} abilities - Ability score definitions
 *   @param {string} tokenPath - Path to token image
 *   @returns {Object} Actor.create data
 */

export {};
