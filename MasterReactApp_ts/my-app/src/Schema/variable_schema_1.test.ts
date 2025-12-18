
import * as Y from 'yjs';
import { CollaborativeSchema } from './variable_schema_1';

describe('CollaborativeSchema', () => {
    let doc: Y.Doc;
    let schema: CollaborativeSchema;

    beforeEach(() => {
        doc = new Y.Doc();
        schema = new CollaborativeSchema(doc);
    });

    it('should initialize with default allowed connectivity', () => {
        const connectivity = schema.getAllowedConnectivity();
        expect(connectivity).toBeDefined();
        expect(connectivity.Account.Account).toContain('transfer');
        expect(connectivity.Person.Account).toContain('own');
    });

    it('should initialize with default allowed node properties', () => {
        const props = schema.getAllowedNodeProperties();
        expect(props).toBeDefined();
        expect(props.Person.notNull.name).toBe('string');
        const languages = props.Person.nullable.languages;
        expect(Array.isArray(languages)).toBe(true);
        expect(languages).toContain('string');
    });

    it('should initialize with default label types and policies', () => {
        const labelTypes = schema.getLabelTypes();
        expect(labelTypes).toContain('Person');
        expect(labelTypes).toContain('Account');
        
        expect(schema.getPolicy('Person')).toBe('REMOVE_WINS');
        expect(schema.getPolicy('Account')).toBe('REMOVE_WINS');
        expect(schema.getPolicy('Loan')).toBe('ADD_WINS');
    });

    it('should allow adding new allowed edge collaboratively', () => {
        const doc2 = new Y.Doc();
        // Since Yjs sync isn't automatic in unit tests without a connector or manual formatting,
        // we'll just test that the schema instance updates the underlying doc structure correct.
        // For distinct docs to sync, we'd need to apply updates. Here we just test the API.
        
        schema.addAllowedEdge('Person', 'Loan', 'newEdgeType');
        
        const connectivity = schema.getAllowedConnectivity();
        expect(connectivity.Person.Loan).toContain('newEdgeType');
    });

    it('should allow adding new allowed node property collaboratively', () => {
        schema.addAllowedNodeProperty('Person', 'notNull', 'newProp', 'string');
        
        const props = schema.getAllowedNodeProperties();
        expect(props.Person.notNull.newProp).toBe('string');
    });

    it('should allow adding new label type with policy', () => {
        schema.addLabelType('NewNode', 'ADD_WINS');
        
        expect(schema.getLabelTypes()).toContain('NewNode');
        expect(schema.getPolicy('NewNode')).toBe('ADD_WINS');
    });

    it('should allow adding new edge label type', () => {
        schema.addEdgeLabelType('newEdgeLabel');
        expect(schema.getEdgeLabelTypes()).toContain('newEdgeLabel');
    });

    it('should sync changes between two schemas on same doc', () => {
        const schema2 = new CollaborativeSchema(doc);
        
        schema.addLabelType('SyncedNode', 'REMOVE_WINS');
        
        expect(schema2.getLabelTypes()).toContain('SyncedNode');
        expect(schema2.getPolicy('SyncedNode')).toBe('REMOVE_WINS');
    });
});
