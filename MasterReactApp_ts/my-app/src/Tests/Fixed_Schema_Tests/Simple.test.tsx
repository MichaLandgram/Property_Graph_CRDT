import * as Y from 'yjs';
import { getActiveGraphClass } from '../../VersionSelector';
import { syncDocs } from '../../Helper/YJS_helper/sync';
import { getDoc } from '../../Helper/YJS_helper/creator';
import { graphDoc, Graph } from '../../Helper/types_interfaces/graph';
import { GrowOnlyCounter, OurVector, Point } from '../../Helper/YJS_helper/moreComplexTypes';
import { Vector } from 'neo4j-driver';

describe('Schema Graph Add Node Test', () => {
    let graph : graphDoc;
    let graph2 : graphDoc;
    let schemaGraph : Graph;
    let position = { x: 0, y: 0 };
    let color = 'red';
    beforeEach(() => {
        graph = getDoc();
        graph2 = getDoc();
        const GraphClass = getActiveGraphClass();
        schemaGraph = new GraphClass();
    })
    test('Add Node with missing props (label)', () => {
        const array = new Y.Array<string>();
        array.push(['item1', 'item2']);
        const map = new Y.Map<string>();
        map.set('key1', 'value1');
        const initialProps = {
            testString: 'hello',
            testNumber: 42,
            testBoolean: true,
            testDate: new Date(),
            // Use the same Y.Doc (graph) so we don't embed a counter backed by a different doc
            testCounter: new GrowOnlyCounter(graph, 'testCounter'),
            testArray: array,
            testMap: map,
            // testPoint: new Point(1,2),
            // testVector: new OurVector(2,5,6)
        }
        schemaGraph.addNode({ alwaysProps: { id: '1', label: 'TEST', policy: 'ADD_WINS', position, color }, initialProps, graph });
        // expect(() => {
        //     console.log(schemaGraph.addNode({ alwaysProps: { id: '1', label: 'TEST', policy: 'ADD_WINS', position, color }, initialProps, graph }));
        // }).toThrow();
        const nodesMap = graph.getMap<any>('nodes');
        const propertiesMap = graph.getMap<Y.Map<any>>('properties');
        expect(nodesMap.has('1')).toBe(true);
        expect(propertiesMap.has('1')).toBe(true);
        console.log('Node Properties Map:', propertiesMap.get('1')?.toJSON());
        schemaGraph.getVisibleNodes({ graph }).forEach(node => {
            const props = schemaGraph.getNodeProps({ nodeId: node.id, graph });
            console.log('Node Props:', props);
            expect(props['testString']).toBe('hello');
            expect(props['testNumber']).toBe(42);
            expect(props['testBoolean']).toBe(true);
            expect(new Date(props['testDate']) instanceof Date).toBe(true);
            expect(new GrowOnlyCounter(graph, props['testCounter']).getTotal()).toBe(0);
            console.log('testArray:', props['testArray'] instanceof Y.Array, props['testArray']);
            expect((props['testArray'][0] as string)).toBe('item1');
            expect((props['testArray'][1] as string)).toBe('item2');
            console.log('testMap:', props['testMap']);
            expect((console.log('testMap:', props['testMap']), props['testMap']['key1'] as string)).toBe('value1');
            // expect((props['testPoint'] as Point).x).toBe(1);
            // expect((props['testPoint'] as Point).y).toBe(2);
            // expect((props['testVector'] as OurVector).x).toBe(2);
            // expect((props['testVector'] as OurVector).y).toBe(5);
            // expect((props['testVector'] as OurVector).z).toBe(6);
    });
    });
})