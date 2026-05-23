/**
 * QuickCreaturesRegistry — Plugin expansion registry for Quick Creatures.
 *
 * External modules (e.g. forge-of-foes, custom expansions) listen for the
 * `quickCreaturesReady` hook and call registerArchetypes / registerFeatures /
 * registerTypes / registerTokenArt to inject their content.
 *
 * The core module registers CC-licensed data under the "core" namespace.
 */
class QuickCreaturesRegistry {
    /** @type {Map<string, Array>} namespace → archetypes */
    #archetypes = new Map();

    /** @type {Map<string, Array>} namespace → features */
    #features = new Map();

    /** @type {Map<string, Array>} namespace → monster types */
    #types = new Map();

    /** @type {Map<string, Array>} namespace → token art entries */
    #tokenArt = new Map();

    /**
     * Register archetype stat blocks for a given namespace.
     * @param {string} namespace - e.g. "core", "forge-of-foes"
     * @param {Array<Object>} archetypes - archetype objects
     */
    registerArchetypes(namespace, archetypes) {
        if (!Array.isArray(archetypes)) {
            console.warn(`QuickCreaturesRegistry | registerArchetypes: expected array for namespace "${namespace}"`);
            return;
        }
        this.#archetypes.set(namespace, archetypes);
    }

    /**
     * Register monster features for a given namespace.
     * @param {string} namespace
     * @param {Array<Object>} features - feature objects
     */
    registerFeatures(namespace, features) {
        if (!Array.isArray(features)) {
            console.warn(`QuickCreaturesRegistry | registerFeatures: expected array for namespace "${namespace}"`);
            return;
        }
        this.#features.set(namespace, features);
    }

    /**
     * Register monster types for a given namespace.
     * @param {string} namespace
     * @param {Array<Object>} types - { name: "Aberration" } style objects
     */
    registerTypes(namespace, types) {
        if (!Array.isArray(types)) {
            console.warn(`QuickCreaturesRegistry | registerTypes: expected array for namespace "${namespace}"`);
            return;
        }
        this.#types.set(namespace, types);
    }

    /**
     * Register token art entries for a given namespace.
     * @param {string} namespace
     * @param {Array<Object>} art - { path: string, type: string[], label?: string, source?: string }[]
     */
    registerTokenArt(namespace, art) {
        if (!Array.isArray(art)) {
            console.warn(`QuickCreaturesRegistry | registerTokenArt: expected array for namespace "${namespace}"`);
            return;
        }
        this.#tokenArt.set(namespace, art);
    }

    /**
     * Get all registered archetypes (merged from all namespaces).
     * @returns {Array<Object>}
     */
    getArchetypes() {
        return Array.from(this.#archetypes.values()).flat();
    }

    /**
     * Get all registered features (merged from all namespaces).
     * @returns {Array<Object>}
     */
    getFeatures() {
        return Array.from(this.#features.values()).flat();
    }

    /**
     * Get all registered monster types (merged from all namespaces).
     * @returns {Array<Object>}
     */
    getTypes() {
        return Array.from(this.#types.values()).flat();
    }

    /**
     * Get all registered token art (merged from all namespaces).
     * @returns {Array<Object>}
     */
    getTokenArt() {
        return Array.from(this.#tokenArt.values()).flat();
    }

    /**
     * Get token art entries matching a specific monster type name.
     * @param {string} typeName - e.g. "Aberration", "Dragon"
     * @returns {Array<Object>}
     */
    getTokenArtForType(typeName) {
        const all = this.getTokenArt();
        return all.filter(entry =>
            entry.type && entry.type.some(t => t.toLowerCase() === typeName.toLowerCase())
        );
    }
}

/** Singleton instance exported for use across the module. */
export const registry = new QuickCreaturesRegistry();

export { QuickCreaturesRegistry };
