import { processEdgeCurvatures } from './GraphUtils';
import { ReagraphEdge } from './Hook/YJS_hook_Reagraph';

describe('processEdgeCurvatures', () => {
    it('should return empty list for empty input', () => {
        const result = processEdgeCurvatures([]);
        expect(result).toEqual([]);
    });

    it('should assign 0 curvature to single edge between two nodes', () => {
        const edges: ReagraphEdge[] = [
            { id: 'e1', source: 'a', target: 'b' }
        ];
        const result = processEdgeCurvatures(edges);
        expect(result[0].curvature).toBe(0);
    });

    it('should assign opposite curvatures to two parallel same-direction edges', () => {
        const edges: ReagraphEdge[] = [
            { id: 'e1', source: 'a', target: 'b' },
            { id: 'e2', source: 'a', target: 'b' }
        ];
        // Sorted by ID: e1, e2
        // Count 2. 
        // e1 index 0: deviation = 0 - 0.5 = -0.5 -> curv -0.25 (step 0.5)
        // e2 index 1: deviation = 1 - 0.5 = 0.5 -> curv 0.25
        
        const result = processEdgeCurvatures(edges);
        expect(result).toHaveLength(2);
        const e1 = result.find(e => e.id === 'e1');
        const e2 = result.find(e => e.id === 'e2');
        
        expect(e1?.curvature).not.toBe(0);
        expect(e2?.curvature).not.toBe(0);
        expect(e1?.curvature).toBe(-0.25);
        expect(e2?.curvature).toBe(0.25);
    });

    it('should assign valid curvatures to bidirectional edges (standard case)', () => {
        // A->B and B->A
        const edges: ReagraphEdge[] = [
            { id: 'ab', source: 'a', target: 'b' },
            { id: 'ba', source: 'b', target: 'a' }
        ];
        // Canonical pair: a-b
        // Sorted edges by ID: ab, ba.
        // ab index 0: dev -0.5 -> curv -0.25. Direction matches canonical (a<b). Final -0.25.
        // ba index 1: dev 0.5 -> curv 0.25. Direction OPPOSITE canonical (b>a). Final -0.25.
        // WAIT. 
        // If both are -0.25.
        // ab curves "left" by 0.25.
        // ba curves "left" by 0.25.
        // Since they point opposite, "left" for ab is "right" for ba. They will form a cycle.
        // This is DESIRED for bidirectional graphs usually.
        
        const result = processEdgeCurvatures(edges);
        const ab = result.find(e => e.id === 'ab');
        const ba = result.find(e => e.id === 'ba');

        // Logic verification
        // ab: curv -0.25
        // ba: curv -0.25
        expect(ab?.curvature).toBe(-0.25);
        expect(ba?.curvature).toBe(-0.25);
    });

    it('should handle uneven odd numbers', () => {
        const edges: ReagraphEdge[] = [
            { id: 'e1', source: 'a', target: 'b' },
            { id: 'e2', source: 'a', target: 'b' },
            { id: 'e3', source: 'a', target: 'b' }
        ];
        // Indices 0, 1, 2
        // Devs: -1, 0, 1
        // Curvs: -0.5, 0, 0.5
        const result = processEdgeCurvatures(edges);
        const e2 = result.find(e => e.id === 'e2');
        expect(e2?.curvature).toBe(0);
    });
});
