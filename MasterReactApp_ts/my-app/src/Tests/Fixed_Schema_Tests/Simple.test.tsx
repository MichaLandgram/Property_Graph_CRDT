import * as Y from 'yjs';
import { getActiveGraphClass } from '../../VersionSelector';
import { syncDocs } from '../../Helper/YJS_helper/sync';
import { getDoc } from '../../Helper/YJS_helper/creator';
import { graphDoc, Graph } from '../../Helper/types_interfaces/graph';
import { GrowOnlyCounter, OurVector, Point } from '../../Helper/YJS_helper/moreComplexTypes';

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
        schemaGraph.addNode({ alwaysProps: { id: '1', label: 'TEST', policy: 'ADD_WINS', position, color }, initialProps, graph });
        // expect(() => {
        //     console.log(schemaGraph.addNode({ alwaysProps: { id: '1', label: 'TEST', policy: 'ADD_WINS', position, color }, initialProps, graph }));
        // }).toThrow();
        const nodesMap = graph.getMap<any>('nodes');
        const propertiesMap = graph.getMap<Y.Map<any>>('properties');
        expect(nodesMap.has('1')).toBe(true);
        expect(propertiesMap.has('1')).toBe(true);
        schemaGraph.getVisibleNodes({ graph }).forEach(node => {
            const props = schemaGraph.getNodeProps({ nodeId: node.id, graph });
            expect(props['testString']).toBe('hello');
            expect(props['testNumber']).toBe(42);
            expect(props['testBoolean']).toBe(true);
            expect(new Date(props['testDate']) instanceof Date).toBe(true);
            const counter = new GrowOnlyCounter(props['testCounter']);
            expect(counter.getTotal()).toBe(0);
            expect((props['testArray'].get(0) as string)).toBe('item1');
            expect((props['testArray'].get(1) as string)).toBe('item2');
            expect((props['testMap'].get('key1') as Y.Map<any>).get('key1') as string).toBe('value1');
            // expect((props['testPoint'] as Point).x).toBe(1);
            // expect((props['testPoint'] as Point).y).toBe(2);
            // expect((props['testVector'] as OurVector).x).toBe(2);
            // expect((props['testVector'] as OurVector).y).toBe(5);
            // expect((props['testVector'] as OurVector).z).toBe(6);
    });

    });
    test.skip('How are two nodes with the same id handled from different docs?', () => {
        const array = new Y.Array<string>();
        array.push(['item1', 'item2']);
        const map = new Y.Map<any>();
        const innerMap = new Y.Map<any>();
        innerMap.set('key1', 'value1');
        map.set('key1', innerMap);
        const counter = new GrowOnlyCounter(new Y.Map<number>());
        counter.increment({ doc: graph });
        const initialProps1 = {
            testString: 'hello',
            testNumber: 42,
            testBoolean: true,
            testDate: new Date(),
            testCounter: counter.counter,
            testArray: array,
            testMap: map,
        }
        const initialProps2 = {
            testString: 'hello',
            testNumber: 42,
            testBoolean: true,
            testDate: new Date(),
            testCounter: counter.counter,
            testArray: array,
            testMap: map,
        }
        schemaGraph.addNode({ alwaysProps: { id: '1', label: 'TEST', policy: 'ADD_WINS', position, color }, initialProps: initialProps1, graph });
        schemaGraph.addNode({ alwaysProps: { id: '1', label: 'TEST', policy: 'ADD_WINS', position, color }, initialProps: initialProps2, graph: graph2 });
        syncDocs(graph, graph2);
        const nodesMap = graph.getMap<any>('nodes');
        const propertiesMap = graph.getMap<Y.Map<any>>('properties');
        expect(nodesMap.has('1')).toBe(true);
        expect(propertiesMap.has('1')).toBe(true);
        expect(schemaGraph.getVisibleNodes({ graph })).toHaveLength(1);
    });
});