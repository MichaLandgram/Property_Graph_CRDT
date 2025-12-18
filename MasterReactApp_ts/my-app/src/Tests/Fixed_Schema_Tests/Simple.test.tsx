import { getActiveGraphClass } from '../../VersionSelector';
import { syncDocs } from '../../Helper/YJS_helper/sync';
import { getDoc } from '../../Helper/YJS_helper/creator';
import { graphDoc, Graph } from '../../Helper/types_interfaces/graph';

describe('Schema Graph Add Node Test', () => {
    let graph : graphDoc;
    let schemaGraph : Graph;
    let position = { x: 0, y: 0 };
    let color = 'red';
    beforeEach(() => {
        graph = getDoc();
        const GraphClass = getActiveGraphClass();
        schemaGraph = new GraphClass();
    })
    test('Add Node with missing props (label)', () => {
        // placeholder is not allowed should throw error
        expect(() => {
            schemaGraph.addNode({ alwaysProps: { id: '1', label: 'Has', policy: 'ADD_WINS', position, color }, initialProps: { placeholder: 'New Node' }, graph });
        }).toThrow();
    })
})