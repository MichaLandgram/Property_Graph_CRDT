import * as Y from 'yjs';
import { SchemaGraph } from '../PG_Graph_Schema_Introduced/V1/SchemaGraph';
import { SchemaGraphV2 } from '../PG_Graph_Schema_Introduced/Experimental_Versions/V2/SchemaGraph';
// import { SchemaGraphV3 } from '../PG_Graph_Schema_Introduced/V3/SchemaGraph';
import { simulateLoad } from './runStorageBenchmark';
import { performance } from 'perf_hooks';
import * as fs from 'fs';
import * as path from 'path';

const createSnapshot = (sourceDoc: Y.Doc) => {
    const targetDoc = new Y.Doc();
    const sourceNodes = sourceDoc.getMap('nodes');
    const targetNodes = targetDoc.getMap('nodes');

    // Clone 'nodes' map
    sourceNodes.forEach((value, key) => {
        // value is the timestamp (number) or removal flag
        targetNodes.set(key, value);
        
        // Copy node properties for V2 (n_ID)
        const sourceProps = sourceDoc.getMap(`n_${key}`);
        if (sourceProps.size > 0) { 
             const targetProps = targetDoc.getMap(`n_${key}`);
             sourceProps.forEach((propVal, propKey) => {
                 // CRITICAL FIX: Direct set fails for nested YJS types (Y.Map, Y.Array)
                 // We must check if propVal is a YJS type and clone its JSON content
                 if (propVal instanceof Y.AbstractType) {
                     // Clone as JSON data
                     const jsonContent = propVal.toJSON();
                     // Re-initialize based on type
                     if (propVal instanceof Y.Map) {
                         const newMap = new Y.Map();
                         targetProps.set(propKey, newMap);
                         // simple copy for now, simplistic recursion
                         for (const [k, v] of Object.entries(jsonContent)) {
                             newMap.set(k, v);
                         }
                     } else if (propVal instanceof Y.Array) {
                         const newArray = new Y.Array();
                         targetProps.set(propKey, newArray);
                         newArray.push(jsonContent as any[]);
                     }
                 } else {
                    // Primitive values
                    targetProps.set(propKey, propVal);
                 }
             });
        }
    });

    return targetDoc;
};

const measureBenchmark = (opCount: number, deleteRate: number, updateRate: number) => {
    const iterations = 5; // Reduced iterations for speed
    let totalTimeV1 = 0;
    let totalTimeV2 = 0;
    let totalTimeV3 = 0;
    let lastSizeV1 = 0;
    let lastSizeV2 = 0;
    let lastSizeV3 = 0;
    let lastSizeV1Snapshot = 0;
    let lastSizeV2Snapshot = 0;
    let lastSizeV3Snapshot = 0;

    for (let i = 0; i < iterations; i++) {
        // --- Test V1 (Nested Maps) ---
        const start1 = performance.now();
        const doc1 = new Y.Doc();
        const v1 = new SchemaGraph();
        simulateLoad(v1, doc1, opCount, deleteRate, updateRate);
        const end1 = performance.now();
        const update1 = Y.encodeStateAsUpdate(doc1);
        lastSizeV1 = update1.byteLength;
        totalTimeV1 += (end1 - start1);

        // --- Snapshot V1 ---
        const snapshotDoc1 = createSnapshot(doc1);
        const snapshotUpdate1 = Y.encodeStateAsUpdate(snapshotDoc1);
        lastSizeV1Snapshot = snapshotUpdate1.byteLength;

        // --- Test V2 (Top-Level Maps) ---
        const start2 = performance.now();
        const doc2 = new Y.Doc();
        const v2 = new SchemaGraphV2();
        simulateLoad(v2, doc2, opCount, deleteRate, updateRate);
        const end2 = performance.now();
        const update2 = Y.encodeStateAsUpdate(doc2);
        lastSizeV2 = update2.byteLength;
        totalTimeV2 += (end2 - start2);

        // --- Snapshot V2 ---
        const snapshotDoc2 = createSnapshot(doc2);
        const snapshotUpdate2 = Y.encodeStateAsUpdate(snapshotDoc2);
        lastSizeV2Snapshot = snapshotUpdate2.byteLength;

        // --- Test V3 (DualKeyMap Wrapper) ---
        // const start3 = performance.now();
        // const doc3 = new Y.Doc();
        // const v3 = new SchemaGraphV3();
        // simulateLoad(v3, doc3, opCount, deleteRate, updateRate);
        // const end3 = performance.now();
        // const update3 = Y.encodeStateAsUpdate(doc3);
        // lastSizeV3 = update3.byteLength;
        // totalTimeV3 += (end3 - start3);
        
        // // --- Snapshot V3 ---
        // const snapshotDoc3 = createSnapshot(doc3);
        // const snapshotUpdate3 = Y.encodeStateAsUpdate(snapshotDoc3);
        // lastSizeV3Snapshot = snapshotUpdate3.byteLength;
    }

    return {
        opCount,
        v1: {
            time: totalTimeV1 / iterations,
            size: lastSizeV1,
            snapshotSize: lastSizeV1Snapshot
        },
        v2: {
            time: totalTimeV2 / iterations,
            size: lastSizeV2,
            snapshotSize: lastSizeV2Snapshot
        },
        v3: {
            time: totalTimeV3 / iterations,
            size: lastSizeV3,
            snapshotSize: lastSizeV3Snapshot
        }
    };
};

const runSweep = () => {
    // node count up to 200 in steps of 2
    const opCounts = [];
    for (let i = 2; i <= 1000; i += 10) {
        opCounts.push(i);
    }
    
    const deleteRate = 0.5;
    const updateRate = 0.5;
    const results: any[] = [];

    console.log('Starting Benchmark Sweep...');

    for (const count of opCounts) {
        process.stdout.write(` Running for ${count} nodes... \r`);
        const result = measureBenchmark(count, deleteRate, updateRate);
        results.push(result);
    }
    console.log('\nBenchmark complete.');

    const output = {
        config: {
            deleteRate,
            updateRate
        },
        results
    };

    const outputPath = path.join(__dirname, 'benchmark_results.json');
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
    console.log(`Results saved to ${outputPath}`);
};

runSweep();
