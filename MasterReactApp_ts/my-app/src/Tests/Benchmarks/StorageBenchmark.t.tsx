
import * as Y from 'yjs';
import { SchemaGraph } from '../../PG_Graph_Schema_Introduced/V1/SchemaGraph';
import { SchemaGraphV2 } from '../../PG_Graph_Schema_Introduced/Experimental_Versions/V2/SchemaGraph';
import { graphDoc } from '../../Helper/types_interfaces/graph';

const simulateLoad = (graphImpl: any, doc: graphDoc, opCount: number, deleteRate: number) => {
    const ids: string[] = [];
    
    // Add Nodes
    for(let i=0; i<opCount; i++) {
        const id = `node-${i}`;
        ids.push(id);
        const array = new Y.Array<string>();
        array.push(['item1', 'item2']);
        const map = new Y.Map<any>();
        const innerMap = new Y.Map<any>();
        innerMap.set('key1', 'value1');
        map.set('key1', innerMap);
        const counter = new Y.Map<number>();
        const initialProps = {
            testString: 'hello',
            testNumber: 42,
            testBoolean: true,
            testDate: new Date(),
            testCounter: counter,
            testArray: array,
            testMap: map,
        }
        graphImpl.addNode({
            alwaysProps: { id: id, label: 'TEST', policy: 'ADD_WINS', position: {x:0, y:0}, color: 'red' },
            initialProps: initialProps,
            graph: doc
        });
    }

    // Delete a percentage of nodes
    const deleteCount = Math.floor(opCount * deleteRate);
    for(let i=0; i<deleteCount; i++) {
        graphImpl.deleteNode({ nodeId: ids[i], graph: doc });
    }
}

describe('Storage Comparison Benchmark', () => {

    test('Benchmark V1 vs V2 Storage Size', () => {
        const OP_COUNT = 100000;
        const DELETE_RATE = 0.5; // Delete 50% of created nodes

        // --- Test V1 (Nested Maps) ---
        const doc1 = new Y.Doc();
        const v1 = new SchemaGraph();
        
        const start1 = performance.now();
        simulateLoad(v1, doc1, OP_COUNT, DELETE_RATE);
        const end1 = performance.now();
        
        const update1 = Y.encodeStateAsUpdate(doc1);
        const size1 = update1.byteLength;

        // --- Test V2 (Top-Level Maps) ---
        const doc2 = new Y.Doc();
        const v2 = new SchemaGraphV2();
        
        const start2 = performance.now();
        simulateLoad(v2, doc2, OP_COUNT, DELETE_RATE);
        const end2 = performance.now();

        const update2 = Y.encodeStateAsUpdate(doc2);
        const size2 = update2.byteLength;

        console.log(`
        Benchmark Results (${OP_COUNT} additions, ${DELETE_RATE * 100}% deletions):
        ---------------------------------------------------
        V1 (Nested Maps) Size: ${(size1 / 1024).toFixed(2)} KB
        V1 Execution Time:     ${(end1 - start1).toFixed(2)} ms
        
        V2 (Top-Level Maps) Size: ${(size2 / 1024).toFixed(2)} KB
        V2 Execution Time:        ${(end2 - start2).toFixed(2)} ms
        
        Difference (Size):        ${(size2 - size1) / 1024} KB (${((size2 - size1) / size1 * 100).toFixed(2)}%)
        ---------------------------------------------------
        `);

        // Assertions just to keep Jest happy
        expect(size2).toBeGreaterThan(0);
        expect(size1).toBeGreaterThan(0);
    });
});
