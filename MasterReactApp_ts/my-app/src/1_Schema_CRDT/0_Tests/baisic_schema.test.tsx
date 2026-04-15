import { Schema_v1 } from "../Schema/schema_v1";
import { SchemaError } from "../0_Helper/SchemaError";
import { bon19SchemaDef } from "../ExperimentHelper/Bon19_Schema";

describe("Sequential Schema Tests", () => {
    test("Autoloading", () => {
        const schema = new Schema_v1(bon19SchemaDef);
        expect(schema.getNodeType('Person')).toBeDefined();
        console.log("HII", schema.transformToJSONFullSchema().nodeTypes.Person.labels);
        expect(schema.getNodeType('Person').get('labels').toArray()).toEqual(['resident', 'citizen']);
        expect(schema.getNodeType('Person').get('properties').toJSON()).toEqual({ firstName: 'string', lastName: 'string' });
        
        expect(schema.getNodeType('Message')).toBeDefined();
        expect(schema.getNodeType('Message').get('labels').toJSON()).toEqual(['note']);
        expect(schema.getNodeType('Message').get('properties').toJSON()).toEqual({ mood: 'string', imageFile: 'string', creationDate: 'string', browserUsed: 'string' });
        
        expect(schema.getRelationshipType('KNOWS')).toBeDefined();
        expect(schema.getRelationshipType('KNOWS').get('sourceNodeLabel')).toEqual('Person');
        expect(schema.getRelationshipType('KNOWS').get('targetNodeLabel')).toEqual('Person');
        expect(schema.getRelationshipType('KNOWS').get('properties').toJSON()).toEqual({since: 'string'});
        
        expect(schema.getRelationshipType('HAS_CREATOR')).toBeDefined();
        expect(schema.getRelationshipType('HAS_CREATOR').get('sourceNodeLabel')).toEqual('Message');
        expect(schema.getRelationshipType('HAS_CREATOR').get('targetNodeLabel')).toEqual('Person');
        expect(schema.getRelationshipType('HAS_CREATOR').get('properties').toJSON()).toEqual({username: 'string'});
        
        expect(schema.getRelationshipType('LIKES')).toBeDefined();
        expect(schema.getRelationshipType('LIKES').get('sourceNodeLabel')).toEqual('Person');
        expect(schema.getRelationshipType('LIKES').get('targetNodeLabel')).toEqual('Message');
        expect(schema.getRelationshipType('LIKES').get('properties').toJSON()).toEqual({date: 'string'});
        
        expect(schema.getRelationshipType('REPLY_OF')).toBeDefined();
        expect(schema.getRelationshipType('REPLY_OF').get('sourceNodeLabel')).toEqual('Message');
        expect(schema.getRelationshipType('REPLY_OF').get('targetNodeLabel')).toEqual('Message');
        expect(schema.getRelationshipType('REPLY_OF').get('properties').toJSON()).toEqual({date: 'string'});
    })
    test("Add node type", () => {
        const schema = new Schema_v1();
        schema.addNodeType({IdenifyingType: 'Person', labels: ['Person'], properties: { name: 'string' }});
        console.log(schema.transformToJSONFullSchema());
        expect(schema.getNodeType('Person')).toBeDefined();


        expect(() => schema.addNodeType({IdenifyingType: 'Person', labels: ['Person'], properties: { name: 'string' }})).toThrow(SchemaError);
        console.log(schema.transformToJSONFullSchema());
        expect(schema.getNodeType('Person')).toBeDefined();
    });
});