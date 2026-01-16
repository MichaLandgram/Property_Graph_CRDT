
import { getDoc } from "../../Helper/YJS_helper/creator";
import { bidirectionalSync, syncDocs } from "../../Helper/YJS_helper/sync";
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
});