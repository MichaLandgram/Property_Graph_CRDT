
import { getDoc } from "../../Helper/YJS_helper/creator";
import { syncDocs } from "../../Helper/YJS_helper/sync";

describe('Basis YJS Tests', () => {
        test.only("Merging YJS Maps showing differences", () => {
    
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
});