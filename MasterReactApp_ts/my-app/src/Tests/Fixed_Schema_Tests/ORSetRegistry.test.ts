import * as Y from 'yjs';
import { ORSetRegistry } from '../../Helper/YJS_helper/ORSetRegistry';
import { bidirectionalSync } from '../../Helper/YJS_helper/sync';

describe('ORSetRegistry', () => {
    
    test('add() creates unique tag and stores entry', () => {
        const doc = new Y.Doc();
        const registry = new ORSetRegistry(doc, 'nodes');

        const tag = registry.add('N1');

        expect(tag).toBeDefined();
        expect(tag.startsWith('t_')).toBe(true);
        expect(registry.isAlive('N1')).toBe(true);
        expect(registry.getAliveTags('N1')).toContain(tag);
    });

    test('concurrent add() from 2 clients - BOTH tags survive', () => {
        const doc1 = new Y.Doc();
        const doc2 = new Y.Doc();
        doc1.clientID = 1;
        doc2.clientID = 2;

        const registry1 = new ORSetRegistry(doc1, 'nodes');
        const registry2 = new ORSetRegistry(doc2, 'nodes');

        // Concurrent adds
        const tag1 = registry1.add('N1');
        const tag2 = registry2.add('N1');

        expect(tag1).not.toBe(tag2); // Different tags

        // Sync
        bidirectionalSync(doc1, doc2);

        // BOTH tags should survive
        const aliveTags1 = registry1.getAliveTags('N1').sort();
        const aliveTags2 = registry2.getAliveTags('N1').sort();

        expect(aliveTags1.length).toBe(2);
        expect(aliveTags1).toContain(tag1);
        expect(aliveTags1).toContain(tag2);
        expect(aliveTags1).toEqual(aliveTags2); // Converged
    });

    test('remove() tombstones all tags', () => {
        const doc = new Y.Doc();
        const registry = new ORSetRegistry(doc, 'nodes');

        const tag = registry.add('N1');
        expect(registry.isAlive('N1')).toBe(true);

        registry.remove('N1');

        expect(registry.isAlive('N1')).toBe(false);
        expect(registry.getAliveTags('N1')).toHaveLength(0);
    });

    test('re-add with new tag succeeds after remove', () => {
        const doc = new Y.Doc();
        const registry = new ORSetRegistry(doc, 'nodes');

        const tag1 = registry.add('N1');
        registry.remove('N1');
        expect(registry.isAlive('N1')).toBe(false);

        const tag2 = registry.add('N1');
        expect(tag2).not.toBe(tag1);
        expect(registry.isAlive('N1')).toBe(true);
        expect(registry.getAliveTags('N1')).toContain(tag2);
        expect(registry.getAliveTags('N1')).not.toContain(tag1);
    });

    test('concurrent add vs remove - Add wins (new tag)', () => {
        const doc1 = new Y.Doc();
        const doc2 = new Y.Doc();
        doc1.clientID = 1;
        doc2.clientID = 2;

        const registry1 = new ORSetRegistry(doc1, 'nodes');
        const registry2 = new ORSetRegistry(doc2, 'nodes');

        // Initial add on both
        const initialTag = registry1.add('N1');
        bidirectionalSync(doc1, doc2);

        // C1: remove (tombstones initialTag)
        registry1.remove('N1');

        // C2: add NEW tag (concurrent)
        const newTag = registry2.add('N1');

        // Sync
        bidirectionalSync(doc1, doc2);

        // Result: N1 is ALIVE because newTag is not tombstoned
        expect(registry1.isAlive('N1')).toBe(true);
        expect(registry1.getAliveTags('N1')).toContain(newTag);
        expect(registry1.getAliveTags('N1')).not.toContain(initialTag);
    });

    test('update on dead version is detectable', () => {
        const doc1 = new Y.Doc();
        const doc2 = new Y.Doc();
        doc1.clientID = 1;
        doc2.clientID = 2;

        const registry1 = new ORSetRegistry(doc1, 'nodes');
        const registry2 = new ORSetRegistry(doc2, 'nodes');

        // Initial add
        const tag = registry1.add('N1');
        bidirectionalSync(doc1, doc2);

        // C1: Remove
        registry1.remove('N1');

        // C2: "Update" referencing the old tag (simulated)
        // In a real update, we'd check isTagAlive(tag) before proceeding
        const tagIsAliveOnC2BeforeSync = registry2.isTagAlive(tag);
        expect(tagIsAliveOnC2BeforeSync).toBe(true); // C2 doesn't know yet

        // Sync
        bidirectionalSync(doc1, doc2);

        // After sync, C2 should see the tag is dead
        expect(registry2.isTagAlive(tag)).toBe(false);
        expect(registry2.isAlive('N1')).toBe(false);
    });

    test('getAllAlive() returns only alive entries', () => {
        const doc = new Y.Doc();
        const registry = new ORSetRegistry(doc, 'nodes');

        registry.add('N1');
        registry.add('N2');
        registry.add('N3');
        registry.remove('N2');

        const alive = registry.getAllAlive();

        expect(alive).toContain('N1');
        expect(alive).not.toContain('N2');
        expect(alive).toContain('N3');
    });
});
