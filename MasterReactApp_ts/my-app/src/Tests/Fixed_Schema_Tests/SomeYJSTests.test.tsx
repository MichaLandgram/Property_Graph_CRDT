
import { getDoc } from "../../Helper/YJS_helper/creator";
import { bidirectionalSync, syncDocs, trialSync } from "../../Helper/YJS_helper/sync";
import * as Y from 'yjs'

describe('Basis YJS Tests', () => {
        test("Merging YJS Maps showing differences", () => {
    
            /* Having two maps with the same key in different docs */
            const doc = getDoc();
            const doc2 = getDoc();
    
            const map = doc.getMap<any>('TEST');
            const map2 = doc2.getMap<any>('TEST');
    
            map.set('TestNumber', 42);
            map2.set('TestString', 'hello');
    
            syncDocs(doc, doc2);
            syncDocs(doc2, doc);
    
            const finalMap = doc.getMap<any>('TEST');
    
            expect(finalMap.get('TestNumber')).toBe(42);
            expect(finalMap.get('TestString')).toBe('hello');
    
            /* Having two maps with the same key in different docs */
            const doc3 = getDoc();
            const doc4 = getDoc();
    
            const map3 = doc3.getMap<any>('properties');
            const map4 = doc4.getMap<any>('properties');
    
            map3.set('TEST', { TestNumber: 42 });
            map4.set('TEST', { TestString: 'hello' });
    
            syncDocs(doc3, doc4);
            syncDocs(doc4, doc3);
    
            const finalMap3 = doc3.getMap<any>('properties');
            // expect exactly one of the two properties to be defined => Missing information!! 
            expect(finalMap3.get('TEST').hasOwnProperty('TestNumber') || finalMap3.get('TEST').hasOwnProperty('TestString')).toBe(true);
            expect(finalMap3.get('TEST').hasOwnProperty('TestNumber') && finalMap3.get('TEST').hasOwnProperty('TestString')).toBe(false);
    });
        test("Merging YJS Maps showing differences", () => {
    
            /* Having two maps with the same key in different docs */
            const doc = getDoc();
            const doc2 = getDoc();
    
            const map = doc.getMap<any>('TEST');
            const map2 = doc2.getMap<any>('TEST');

            map.set('TestNumber', 42);
            map2.set('TestString', 'hello');
    
            syncDocs(doc, doc2);
            syncDocs(doc2, doc);
    
            const finalMap = doc.getMap<any>('TEST');
    
            expect(finalMap.get('TestNumber')).toBe(42);
            expect(finalMap.get('TestString')).toBe('hello');
    });
    test('Playground', () => {
        const doc = getDoc();
        const doc2 = getDoc();
        const testMap = doc.getMap<any>('TEST');
        const testMap2 = doc2.getMap<any>('TEST');

        testMap.set('TEST', 'TEST');
        testMap2.set('TEST2', 'TEST2');

        bidirectionalSync(doc, doc2);
        expect(testMap.get('TEST')).toBe('TEST');
        expect(testMap.get('TEST2')).toBe('TEST2');
        expect(testMap2.get('TEST')).toBe('TEST');
        expect(testMap2.get('TEST2')).toBe('TEST2');

        testMap2.set('TEST3', 'TEST3');
        testMap.clear();

        bidirectionalSync(doc, doc2);

        // not what we want but this test symbolizes the problem
        expect(testMap.get('TEST')).toBeUndefined();
        expect(testMap.get('TEST2')).toBeUndefined();
        expect(testMap2.get('TEST')).toBeUndefined();
        expect(testMap2.get('TEST2')).toBeUndefined();
        expect(testMap.get('TEST3')).toBe('TEST3');
        expect(testMap2.get('TEST3')).toBe('TEST3');
    });
    test('Scenario C: Deterministic Merge (Concurrent Adds with same ID)', () => {
        const doc1 = new Y.Doc();
        const doc2 = new Y.Doc();
        
        // We assume a fixed ID
        const DETERMINISTIC_ID = "edge_sourceA_targetB_labelFriend";

        // Client 1 "Adds" the edge
        const edge1 = doc1.getMap(DETERMINISTIC_ID);
        edge1.set('created_by', 'client1');
        edge1.set('weight', 10);

        // Client 2 "Adds" the SAME edge (concurrently)
        const edge2 = doc2.getMap(DETERMINISTIC_ID);
        edge2.set('created_by', 'client2'); // Conflict on same prop
        edge2.set('color', 'blue');

        // Sync
        bidirectionalSync(doc1, doc2);

        // Verification
        const mergedEdge = doc1.getMap(DETERMINISTIC_ID);

        // 1. Both properties should exist (Merge)
        expect(mergedEdge.get('weight')).toBe(10);
        expect(mergedEdge.get('color')).toBe('blue');

        // 2. Conflict Handling (Last Write Wins usually, or based on ClientID)
        expect(mergedEdge.get('created_by')).toBeDefined();
        
        // 3. Crucially: There is only ONE object, not two duplicates.
        // In Yjs, getMap(ID) returns the singleton reference.
        // We can check if any other keys exist in the share (there shouldn't be).
        expect(Array.from(doc1.share.keys()).filter(k => k === DETERMINISTIC_ID).length).toBe(1);
    });

    test('Scenario D: Explicit OR-Map Architecture (Tag + Tombstone)', () => {
        const doc1 = getDoc(1);
        const doc2 = getDoc(2);

        // --- Data Structures ---
        // Registry: Map<Key, { tag: string, val: any }>
        const registry1 = doc1.getMap('registry');
        const tombstones1 = doc1.getArray('tombstones');
        
        const registry2 = doc2.getMap('registry');
        const tombstones2 = doc2.getArray('tombstones');

        // --- Add Operation (Setup) ---
        // Client 1 adds Key "A" with Tag "v1"
        const tag_v1 = 'tag_v1';
        registry1.set('KeyA', { tag: tag_v1, val: 'initial' });
        bidirectionalSync(doc1, doc2);

        // --- Concurrent Ops ---
        
        // C1: REMOVE "KeyA" (Observed Remove)
        // 1. Observe Tag
        const currentEntry = registry1.get('KeyA') as any;
        // 2. Add Tag to Tombstone
        tombstones1.push([currentEntry.tag]);

        // C2: UPDATE "KeyA" (Update to v1) - simulates "Update references existing tag"
        // In Yjs, replacing the object updates the Pointer (new Item ID), 
        // BUT if we keep the SAME 'tag' field, we simulate "Touching v1".
        registry2.set('KeyA', { tag: tag_v1, val: 'updated_v1' });


        // Sync C1 and C2
        bidirectionalSync(doc1, doc2);

        // --- Verification Logic (The "View" Function) ---
        const getView = (reg: Y.Map<any>, tomb: Y.Array<any>) => {
            const entry = reg.get('KeyA');
            if (!entry) return null; // Native delete
            if (tomb.toArray().includes(entry.tag)) return null; // Tombstoned
            return entry;
        };

        const view1 = getView(registry1, tombstones1);

        // Expectation: KeyA is DEAD.
        // Because "tag_v1" is in Tombstones.
        // Even though C2 updated the value to 'updated_v1', it KEPT 'tag_v1'.
        // So the Tombstone "Checkmates" the update.
        expect(tombstones1.toArray()).toContain(tag_v1);
        expect(view1).toBeNull();
        console.log("Scenario D (Refined Update): Update to V1 died because V1 is tombstoned.");

        // --- Re-Add Wins Logic ---
        // Now C1 adds "KeyA" again with "v2"
        const tag_v2 = 'tag_v2';
        registry1.set('KeyA', { tag: tag_v2, val: 'fresh_start' });
        
        const view2 = getView(registry1, tombstones1);
        
        // Expectation: KeyA is ALIVE.
        // 'tag_v2' is NOT in tombstones.
        expect(view2).not.toBeNull();
        expect(view2.val).toBe('fresh_start');
         console.log("Scenario D (Re-Add): KeyA revived with V2.");
    });
});