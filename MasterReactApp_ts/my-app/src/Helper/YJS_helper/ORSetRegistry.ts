import * as Y from 'yjs';

/**
 * OR-Set Registry with Observed-Remove semantics.
 * 
 * Data Structure (Flat - for proper CRDT merging):
 * - Registry: Y.Map<`{id}:{tag}`, Timestamp> - Composite keys for all id:tag pairs
 * - Tombstones: Y.Map<Tag, true> - Set of dead tags
 * 
 * This flat structure ensures that concurrent adds from different clients
 * will merge properly (both `N1:tag_c1` and `N1:tag_c2` keys survive).
 * 
 * Invariants:
 * - Entry is "alive" if at least one of its tags is NOT in tombstones.
 * - Concurrent creates merge: both tags survive (because they're separate keys).
 * - Remove tombstones ALL currently observed tags.
 * - Updates to a tombstoned tag are ignored.
 */
export class ORSetRegistry {
    private doc: Y.Doc;
    private registryName: string;
    private tombstonesName: string;

    private static KEY_SEPARATOR = ':';

    constructor(doc: Y.Doc, registryName: string) {
        this.doc = doc;
        this.registryName = registryName;
        this.tombstonesName = `${registryName}_tombstones`;
    }

    /** Get the registry Y.Map */
    private getRegistry(): Y.Map<number> {
        return this.doc.getMap(this.registryName) as Y.Map<number>;
    }

    /** Get the tombstones Y.Map */
    private getTombstones(): Y.Map<boolean> {
        return this.doc.getMap(this.tombstonesName) as Y.Map<boolean>;
    }

    /** Compose a registry key from id and tag */
    private composeKey(id: string, tag: string): string {
        return `${id}${ORSetRegistry.KEY_SEPARATOR}${tag}`;
    }

    /** Parse a registry key back to id and tag */
    private parseKey(key: string): { id: string; tag: string } | null {
        const sepIndex = key.indexOf(ORSetRegistry.KEY_SEPARATOR);
        if (sepIndex === -1) return null;
        return {
            id: key.substring(0, sepIndex),
            tag: key.substring(sepIndex + 1)
        };
    }

    /**
     * Generate a unique tag using doc clientID + timestamp.
     */
    private generateTag(): string {
        return `t_${this.doc.clientID}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    }

    /**
     * Add an entry with a unique tag.
     * If entry already exists, adds a new tag (concurrent creates scenario).
     * @returns The tag that was added
     */
    add(id: string, tag?: string): string {
        const registry = this.getRegistry();
        const newTag = tag || this.generateTag();
        const key = this.composeKey(id, newTag);

        this.doc.transact(() => {
            registry.set(key, Date.now());
        });

        return newTag;
    }

    /**
     * Remove an entry by tombstoning ALL currently observed tags.
     * This implements "Observed-Remove" semantics.
     */
    remove(id: string): void {
        const tombstones = this.getTombstones();
        const tagsForId = this.getAllTagsForId(id);

        if (tagsForId.length === 0) return;

        this.doc.transact(() => {
            tagsForId.forEach(tag => {
                tombstones.set(tag, true);
            });
        });
    }

    /**
     * Get all tags associated with an id (regardless of tombstone status).
     */
    private getAllTagsForId(id: string): string[] {
        const registry = this.getRegistry();
        const prefix = id + ORSetRegistry.KEY_SEPARATOR;
        const tags: string[] = [];

        registry.forEach((_, key) => {
            if (key.startsWith(prefix)) {
                const parsed = this.parseKey(key);
                if (parsed) {
                    tags.push(parsed.tag);
                }
            }
        });

        return tags;
    }

    /**
     * Check if entry is alive (has at least one non-tombstoned tag).
     */
    isAlive(id: string): boolean {
        const tombstones = this.getTombstones();
        const tags = this.getAllTagsForId(id);

        for (const tag of tags) {
            if (!tombstones.has(tag)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Get all alive tags for an entry.
     */
    getAliveTags(id: string): string[] {
        const tombstones = this.getTombstones();
        const tags = this.getAllTagsForId(id);

        return tags.filter(tag => !tombstones.has(tag));
    }

    /**
     * Check if a specific tag is alive (not tombstoned).
     * Used for update validation.
     */
    isTagAlive(tag: string): boolean {
        const tombstones = this.getTombstones();
        return !tombstones.has(tag);
    }

    /**
     * Get all alive entry IDs.
     */
    getAllAlive(): string[] {
        const registry = this.getRegistry();
        const tombstones = this.getTombstones();
        const aliveIds = new Set<string>();

        registry.forEach((_, key) => {
            const parsed = this.parseKey(key);
            if (parsed && !tombstones.has(parsed.tag)) {
                aliveIds.add(parsed.id);
            }
        });

        return Array.from(aliveIds);
    }

    /**
     * Check if entry exists in registry (regardless of alive state).
     */
    has(id: string): boolean {
        return this.getAllTagsForId(id).length > 0;
    }

    /**
     * Get all tags for an entry (including tombstoned ones).
     * Useful for debugging.
     */
    getAllTags(id: string): Map<string, { timestamp: number; alive: boolean }> {
        const registry = this.getRegistry();
        const tombstones = this.getTombstones();
        const prefix = id + ORSetRegistry.KEY_SEPARATOR;
        const result = new Map<string, { timestamp: number; alive: boolean }>();

        registry.forEach((timestamp, key) => {
            if (key.startsWith(prefix)) {
                const parsed = this.parseKey(key);
                if (parsed) {
                    result.set(parsed.tag, {
                        timestamp,
                        alive: !tombstones.has(parsed.tag)
                    });
                }
            }
        });

        return result;
    }
}

