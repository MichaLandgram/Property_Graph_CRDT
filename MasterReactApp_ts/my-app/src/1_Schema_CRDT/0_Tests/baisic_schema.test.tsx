import { Schema_v1 } from "../Schema/schema_v1";
import { SchemaError } from "../../0_Meta/ErrorDefinition";
import { bon19SchemaDef } from "../ExperimentHelper/Bon19_Schema";

describe("Sequential Schema Tests", () => {
    test("Autoloading", () => {
        const schema = new Schema_v1(bon19SchemaDef);
        expect(schema.getNodeTypeJSON('Person')).toBeDefined();
        console.log("HII", schema.transformToJSONFullSchema().nodeTypes.Person.labels);
        expect(schema.getNodeTypeJSON('Person').labels.toArray()).toEqual(['resident', 'citizen']);
        expect(schema.getNodeTypeJSON('Person').properties.toJSON()).toEqual({ firstName: 'string', lastName: 'string' });
        
        expect(schema.getNodeTypeJSON('Message')).toBeDefined();
        expect(schema.getNodeTypeJSON('Message').labels.toJSON()).toEqual(['note']);
        expect(schema.getNodeTypeJSON('Message').properties.toJSON()).toEqual({ mood: 'string', imageFile: 'string', creationDate: 'string', browserUsed: 'string' });
        
        expect(schema.getRelationshipTypeJSON('KNOWS')).toBeDefined();
        expect(schema.getRelationshipTypeJSON('KNOWS').sourceNodeLabel).toEqual('Person');
        expect(schema.getRelationshipTypeJSON('KNOWS').targetNodeLabel).toEqual('Person');
        expect(schema.getRelationshipTypeJSON('KNOWS').properties.toJSON()).toEqual({since: 'string'});
        
        expect(schema.getRelationshipTypeJSON('HAS_CREATOR')).toBeDefined();
        expect(schema.getRelationshipTypeJSON('HAS_CREATOR').sourceNodeLabel).toEqual('Message');
        expect(schema.getRelationshipTypeJSON('HAS_CREATOR').targetNodeLabel).toEqual('Person');
        expect(schema.getRelationshipTypeJSON('HAS_CREATOR').properties.toJSON()).toEqual({username: 'string'});
        
        expect(schema.getRelationshipTypeJSON('LIKES')).toBeDefined();
        expect(schema.getRelationshipTypeJSON('LIKES').sourceNodeLabel).toEqual('Person');
        expect(schema.getRelationshipTypeJSON('LIKES').targetNodeLabel).toEqual('Message');
        expect(schema.getRelationshipTypeJSON('LIKES').properties.toJSON()).toEqual({date: 'string'});
        
        expect(schema.getRelationshipTypeJSON('REPLY_OF')).toBeDefined();
        expect(schema.getRelationshipTypeJSON('REPLY_OF').sourceNodeLabel).toEqual('Message');
        expect(schema.getRelationshipTypeJSON('REPLY_OF').targetNodeLabel).toEqual('Message');
        expect(schema.getRelationshipTypeJSON('REPLY_OF').properties.toJSON()).toEqual({date: 'string'});
    })
    test("Add node type", () => {
        const schema = new Schema_v1();
        schema.SMO_addNodeType("Person", ["Person"], { name: "string" });
        console.log(schema.transformToJSONFullSchema());
        expect(schema.getNodeTypeJSON('Person')).toBeDefined();


        expect(() => schema.SMO_addNodeType("Person", ["Person"], { name: "string" })).toThrow(SchemaError);
        console.log(schema.transformToJSONFullSchema());
        expect(schema.getNodeTypeJSON('Person')).toBeDefined();
    });
});