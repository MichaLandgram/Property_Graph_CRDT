import * as Y from 'yjs';
import { PropertyGraph } from '../PropertyGraph';
import { getActiveGraphClass } from '../../VersionSelector';
import { syncDocs, bidirectionalSync } from '../../Helper/YJS_helper/sync';
import { getDoc } from '../../Helper/YJS_helper/creator';
import { graphDoc, Graph } from '../../Helper/types_interfaces/graph';
import { GrowOnlyCounter, OurVector, Point } from '../../Helper/YJS_helper/moreComplexTypes';

describe('Does addNode add a node correctly to the graph?', () => {
    let graph : graphDoc;
    let graph2 : graphDoc;
    let schemaGraph : PropertyGraph;
    let color = 'red';
    beforeEach(() => {
        console.log('beforeEach', getActiveGraphClass()); 
        // need to set the clientID to control the tie breaking for deterministic results
        graph = getDoc(1);
        graph2 = getDoc(2); 
        const GraphClass = getActiveGraphClass();
        schemaGraph = new PropertyGraph();
    })
    test('Add Node with missing props (label)', () => {
        // basic Array generation
        const array = new Y.Array<string>();
        array.push(['item1', 'item2']);

        // basic Map generation
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
        schemaGraph.addNode({ doc: graph, nodeId: '1', type: 'TEST', props: initialProps, policy: 'ADD_WINS', color });
        expect(graph.getMap('pg_n_1').size).toBeGreaterThan(0);
        schemaGraph.getVisibleNodes(graph).forEach(node => {
            const props = schemaGraph.getNodeProps(graph, node.id) ?? {};
            expect(props).not.toBe(undefined);
            expect(props['testString']).toBe('hello');
            expect(props['testNumber']).toBe(42);
            expect(props['testBoolean']).toBe(true);
            expect(new Date(props['testDate']) instanceof Date).toBe(true);
            const counter = new GrowOnlyCounter(props['testCounter']);
            expect(counter.getTotal()).toBe(0);
            expect((props['testArray'].get(0) as string)).toBe('item1');
            expect((props['testArray'].get(1) as string)).toBe('item2');
            expect((props['testMap'].get('key1') as Y.Map<any>).get('key1') as string).toBe('value1');
    });

    });
    test('How are two nodes with the same id handled from different docs?', () => {
        expect(graph.clientID).toBe(1);
        expect(graph2.clientID).toBe(2);
        const array = new Y.Array<string>();
        const array2 = new Y.Array<string>();
        array.push(['item1', 'item2']);
        array2.push(['item21', 'item21']);
        const map = new Y.Map<any>();

        const innerMap = new Y.Map<any>();
        innerMap.set('key1', 'value1');
        map.set('key1', innerMap);
        const map2 = new Y.Map<any>();
        const innerMap2 = new Y.Map<any>();
        innerMap2.set('key2', 'value2');
        map2.set('key2', innerMap2);
        const counter = new GrowOnlyCounter(new Y.Map<number>());
        const counter2 = new GrowOnlyCounter(new Y.Map<number>());

        const dd = new Date();
        const initialProps1 = {
            testString: 'hello',
            testNumber: 42,
            testBoolean: true,
            // testDate: dd,
            testCounter: counter.counter,
            testArray: array,
            testMap: map,
        }


        const resultProps = {
            id: '1',
            label: 'TEST',
            policy: 'ADD_WINS',
            color,
            testString: 'bye',
            testNumber: 2,
            testBoolean: true,
            // testDate: dd,
            testCounter: counter.counter,
            testArray: array,
            testMap: map,
        }
        const initialProps2 = {
            testString: 'hello',
            testNumber: 42,
            testBoolean: true,
            // testDate: dd,
            testCounter: counter2.counter,
            testArray: array2,
            testMap: map2,
        }
        const updateProps1 = {
            testString: 'bye',
        }
        const updateProps2 = {
            testNumber: 2,
        }
        const updateProps3 = {
            testString: 'Hi',
            testBoolean: false,
        }
        const updateProps4 = {
            testString: 'Hi2',
        }



        schemaGraph.addNode({ doc: graph, nodeId: '1', type: 'TEST', props: initialProps1, policy: 'ADD_WINS', color });
        schemaGraph.addNode({ doc: graph2, nodeId: '1', type: 'TEST', props: initialProps2, policy: 'ADD_WINS', color });

        schemaGraph.updateNode({ doc: graph, nodeId: '1', props: updateProps1 });
        schemaGraph.updateNode({ doc: graph2, nodeId: '1', props: updateProps2 });


        bidirectionalSync(graph, graph2);

        schemaGraph.updateNode({ doc: graph, nodeId: '1', props: updateProps3 });
        schemaGraph.updateNode({ doc: graph2, nodeId: '1', props: updateProps4 });

        bidirectionalSync(graph, graph2);

        // should have a combination of both updates -- my decision
        expect(schemaGraph.getVisibleNodes(graph)).toHaveLength(1);
        expect(schemaGraph.getVisibleNodes(graph2)).toHaveLength(1);
        const props1 = schemaGraph.getNodeProps(graph, '1') ?? {};
        const props2 = schemaGraph.getNodeProps(graph2, '1') ?? {};
        expect(props1.testNumber).toBe(2);
        expect(props2.testNumber).toBe(2);
        // it is Hi2 because the id is the tie breaker!
        expect(props1.testString).toBe('Hi2');
        expect(props2.testString).toBe('Hi2');
        expect(props1.testBoolean).toBe(false);
        expect(props2.testBoolean).toBe(false);
    });
});