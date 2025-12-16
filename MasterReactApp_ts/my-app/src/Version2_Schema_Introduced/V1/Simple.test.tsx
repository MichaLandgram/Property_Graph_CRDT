import { SchemaGraph as GraphInstance } from './SchemaGraph';
import { syncDocs } from '../../Helper/sync';
import { getDoc } from '../../Helper/creator';
import { graphDoc } from '../../Helper/types/graph';

describe('Schema Graph Add Node Test', () => {
    let graph : graphDoc;
    let schemaGraph : GraphInstance;
    let position = { x: 0, y: 0 };
    let color = 'red';
    beforeEach(() => {
        graph = getDoc();
        schemaGraph = new GraphInstance();
    })
    test('Add Node with missing props (label)', () => {
        // placeholder is not allowed should throw error
        expect(() => {
            schemaGraph.addNode({ alwaysProps: { id: '1', label: 'Has', policy: 'ADD_WINS', position, color }, initialProps: { placeholder: 'New Node' }, graph });
        }).toThrow();
    })
})