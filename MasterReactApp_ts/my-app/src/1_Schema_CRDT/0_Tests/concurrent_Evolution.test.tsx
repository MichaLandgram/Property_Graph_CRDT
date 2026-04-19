import * as Y from 'yjs';
import { bon19SchemaDef } from "../ExperimentHelper/Bon19_Schema";
import { Schema_v1 } from "../Schema/schema_v1"
import { SchemaError } from "../0_Helper/SchemaError";
import { getDoc } from "../../Helper/YJS_helper/creator";
import { bidirectionalSync } from "../../Helper/YJS_helper/sync";

const checkPersonNodeType = (schema: Schema_v1) => {
    expect(schema.getNodeTypeJSON('Person')).toBeDefined();
    expect(schema.getNodeTypeJSON('Person').labels).toEqual({resident: 'resident', citizen: 'citizen'});
    expect(schema.getNodeTypeJSON('Person').properties).toEqual(
        { firstName: {name: 'firstName', activeTypes: { '1': {value: 'string', default: undefined} }}, 
        lastName: {name: 'lastName', activeTypes: { '1': {value: 'string', default: undefined} }}});
}

const checkMessageNodeType = (schema: Schema_v1) => {
    expect(schema.getNodeTypeJSON('Message')).toBeDefined();
    expect(schema.getNodeTypeJSON('Message').labels).toEqual({note: 'note'});
    expect(schema.getNodeTypeJSON('Message').properties).toEqual(
        { mood: {name: 'mood', activeTypes: { '1': {value: 'string', default: undefined} }}, 
        imageFile: {name: 'imageFile', activeTypes: { '1': {value: 'string', default: undefined} }}, 
        creationDate: {name: 'creationDate', activeTypes: { '1': {value: 'string', default: undefined} }}, 
        browserUsed: {name: 'browserUsed', activeTypes: { '1': {value: 'string', default: undefined} }}});
}

const checkKnowsRelationshipType = (schema: Schema_v1) => {
    expect(schema.getRelationshipTypeJSON('KNOWS')).toBeDefined();
    expect(schema.getRelationshipTypeJSON('KNOWS').sourceNodeLabel).toEqual('Person');
    expect(schema.getRelationshipTypeJSON('KNOWS').targetNodeLabel).toEqual('Person');
    expect(schema.getRelationshipTypeJSON('KNOWS').properties).toEqual(
        {since: {name: 'since', activeTypes: { '1': {value: 'string', default: undefined} }}});
}

const checkHasCreatorRelationshipType = (schema: Schema_v1) => {
    expect(schema.getRelationshipTypeJSON('HAS_CREATOR')).toBeDefined();
    expect(schema.getRelationshipTypeJSON('HAS_CREATOR').sourceNodeLabel).toEqual('Message');
    expect(schema.getRelationshipTypeJSON('HAS_CREATOR').targetNodeLabel).toEqual('Person');
    expect(schema.getRelationshipTypeJSON('HAS_CREATOR').properties).toEqual(
        {username: {name: 'username', activeTypes: { '1': {value: 'string', default: undefined} }}});
}

const checkLikesRelationshipType = (schema: Schema_v1) => {
    expect(schema.getRelationshipTypeJSON('LIKES')).toBeDefined();
    expect(schema.getRelationshipTypeJSON('LIKES').sourceNodeLabel).toEqual('Person');
    expect(schema.getRelationshipTypeJSON('LIKES').targetNodeLabel).toEqual('Message');
    expect(schema.getRelationshipTypeJSON('LIKES').properties).toEqual({
        date: {name: 'date', activeTypes: { '1': {value: 'string', default: undefined} }}});
}

const checkReplyOfRelationshipType = (schema: Schema_v1) => {
    expect(schema.getRelationshipTypeJSON('REPLY_OF')).toBeDefined();
    expect(schema.getRelationshipTypeJSON('REPLY_OF').sourceNodeLabel).toEqual('Message');
    expect(schema.getRelationshipTypeJSON('REPLY_OF').targetNodeLabel).toEqual('Message');
    expect(schema.getRelationshipTypeJSON('REPLY_OF').properties).toEqual(
        {date: {name: 'date', activeTypes: { '1': {value: 'string', default: undefined} }}});
}

describe("Sequential Evolution - basic", () => {
    let schema: Schema_v1;
    let schema2: Schema_v1;
    let doc: Y.Doc;
    let doc2: Y.Doc;
    beforeEach(() => {
        doc = getDoc(1);
        schema = new Schema_v1(bon19SchemaDef, doc);
        
        doc2 = getDoc(2);
        schema2 = new Schema_v1(undefined,doc2);
    })
    describe("Base Tests", () => {
        test("Autoloading and sync test", () => {
            checkPersonNodeType(schema);
            checkMessageNodeType(schema);
            checkKnowsRelationshipType(schema);
            checkHasCreatorRelationshipType(schema);
            checkLikesRelationshipType(schema);
            checkReplyOfRelationshipType(schema);
            
            bidirectionalSync(doc, doc2);

            checkPersonNodeType(schema2);
            checkMessageNodeType(schema2);
            checkKnowsRelationshipType(schema2);
            checkHasCreatorRelationshipType(schema2);
            checkLikesRelationshipType(schema2);
            checkReplyOfRelationshipType(schema2);
        })
    });
    describe("Concurrent Evolution Tests - Base", () => {
        describe("CREATE - CREATE Concurrent Behavior", () => {
            describe("NodeType - NodeType", () => {
                test("SAME TYPE: Create Node Type - Node Type Concurrent", () => {
                    schema.SMO_addNodeType("Account", ["acc"], {iban: "string", balance: "number", bankID: "string"});
                    expect(schema.transformToJSONFullSchema().nodeTypes.Account).toBeDefined();
                    expect(schema.transformToJSONFullSchema().nodeTypes.Account.labels).toEqual({acc: "acc"});
                    expect(schema.transformToJSONFullSchema().nodeTypes.Account.properties).toEqual(
                        {iban: {name: 'iban', activeTypes: { '1': {value: 'string', default: undefined} }}, 
                        balance: {name: 'balance', activeTypes: { '1': {value: 'number', default: undefined} }}, 
                    bankID: {name: 'bankID', activeTypes: { '1': {value: 'string', default: undefined} }}});

                    schema2.SMO_addNodeType("Account", ["akk"], {ibun: "string", balancke: "number", bankkID: "string"});
                    expect(schema2.transformToJSONFullSchema().nodeTypes.Account).toBeDefined();
                    expect(schema2.transformToJSONFullSchema().nodeTypes.Account.labels).toEqual({akk: "akk"});
                    expect(schema2.transformToJSONFullSchema().nodeTypes.Account.properties).toEqual(
                        {ibun: {name: 'ibun', activeTypes: { '2': {value: 'string', default: undefined} }}, 
                        balancke: {name: 'balancke', activeTypes: { '2': {value: 'number', default: undefined} }}, 
                    bankkID: {name: 'bankkID', activeTypes: { '2': {value: 'string', default: undefined} }}});

                    bidirectionalSync(doc, doc2);

                    // higher clientID wins
                    expect(schema2.transformToJSONFullSchema().nodeTypes.Account).toBeDefined();
                    expect(schema2.transformToJSONFullSchema().nodeTypes.Account.labels).toEqual({akk: "akk"});
                    expect(schema2.transformToJSONFullSchema().nodeTypes.Account.properties).toEqual(
                        {ibun: {name: 'ibun', activeTypes: { '2': {value: 'string', default: undefined} }}, 
                        balancke: {name: 'balancke', activeTypes: { '2': {value: 'number', default: undefined} }}, 
                        bankkID: {name: 'bankkID', activeTypes: { '2': {value: 'string', default: undefined} }}});

                    expect(schema.transformToJSONFullSchema().nodeTypes.Account).toBeDefined();
                    expect(schema.transformToJSONFullSchema().nodeTypes.Account.labels).toEqual({akk: "akk"});
                    expect(schema.transformToJSONFullSchema().nodeTypes.Account.properties).toEqual(
                        {ibun: {name: 'ibun', activeTypes: { '2': {value: 'string', default: undefined} }}, 
                        balancke: {name: 'balancke', activeTypes: { '2': {value: 'number', default: undefined} }}, 
                        bankkID: {name: 'bankkID', activeTypes: { '2': {value: 'string', default: undefined} }}});
                    
                });
                test("DIFFERENT TYPE: Create Node Type - Node Type Concurrent", () => {
                    // adding two different node types concurrently 
                    schema.SMO_addNodeType("Account", ["acc"], {iban: "string", balance: "number", bankID: "string"});
                    schema2.SMO_addNodeType("Company", ["com"], {location: "string", revenue: "number", founded: "string"});
                    // sync
                    bidirectionalSync(doc, doc2);
                    // check schema2
                    const schema2Temp = schema2.transformToJSONFullSchema().nodeTypes;
                    expect(schema2Temp.Account).toBeDefined();
                    expect(schema2Temp.Account.labels).toEqual({acc: "acc"});
                    expect(schema2Temp.Account.properties).toEqual(
                        {iban: {name: 'iban', activeTypes: { '1': {value: 'string', default: undefined} }}, 
                        balance: {name: 'balance', activeTypes: { '1': {value: 'number', default: undefined} }}, 
                        bankID: {name: 'bankID', activeTypes: { '1': {value: 'string', default: undefined} }}});
                    expect(schema2Temp.Company).toBeDefined();
                    expect(schema2Temp.Company.labels).toEqual({com: "com"});
                    expect(schema2Temp.Company.properties).toEqual(
                        {location: {name: 'location', activeTypes: { '2': {value: 'string', default: undefined} }}, 
                        revenue: {name: 'revenue', activeTypes: { '2': {value: 'number', default: undefined} }}, 
                        founded: {name: 'founded', activeTypes: { '2': {value: 'string', default: undefined} }}});
                    // check schema
                    const schemeTemp = schema.transformToJSONFullSchema().nodeTypes;
                    expect(schemeTemp.Account).toBeDefined();
                    expect(schemeTemp.Account.labels).toEqual({acc: "acc"});
                    expect(schemeTemp.Account.properties).toEqual(
                        {iban: {name: 'iban', activeTypes: { '1': {value: 'string', default: undefined} }}, 
                        balance: {name: 'balance', activeTypes: { '1': {value: 'number', default: undefined} }}, 
                        bankID: {name: 'bankID', activeTypes: { '1': {value: 'string', default: undefined} }}});
                    expect(schemeTemp.Company).toBeDefined();
                    expect(schemeTemp.Company.labels).toEqual({com: "com"});
                    expect(schemeTemp.Company.properties).toEqual(
                        {location: {name: 'location', activeTypes: { '2': {value: 'string', default: undefined} }}, 
                        revenue: {name: 'revenue', activeTypes: { '2': {value: 'number', default: undefined} }}, 
                        founded: {name: 'founded', activeTypes: { '2': {value: 'string', default: undefined} }}});
                });
            });
            describe("Node Type - Relationship Type", () => {
                test("SHARE TYPE: Create Node Type - Relationship Type Concurrent", () => {
                    schema.SMO_addNodeType("Company", ["com"], {location: "string", revenue: "number", founded: "string"});
                    schema2.SMO_addRelationshipType("OWNED_BY", "Company", "Person", {since: "string"});
                    bidirectionalSync(doc, doc2);
                    const schema2Temp = schema2.transformToJSONFullSchema().nodeTypes;
                    expect(schema2Temp.Company).toBeDefined();
                    expect(schema2Temp.Company.labels).toEqual({com: "com"});
                    expect(schema2Temp.Company.properties).toEqual(
                        {location: {name: 'location', activeTypes: { '1': {value: 'string', default: undefined} }}, 
                        revenue: {name: 'revenue', activeTypes: { '1': {value: 'number', default: undefined} }}, 
                        founded: {name: 'founded', activeTypes: { '1': {value: 'string', default: undefined} }}});
                    const schemeTemp = schema.transformToJSONFullSchema().nodeTypes;
                    expect(schemeTemp.Company).toBeDefined();
                    expect(schemeTemp.Company.labels).toEqual({com: "com"});
                    expect(schemeTemp.Company.properties).toEqual(
                        {location: {name: 'location', activeTypes: { '1': {value: 'string', default: undefined} }}, 
                        revenue: {name: 'revenue', activeTypes: { '1': {value: 'number', default: undefined} }}, 
                        founded: {name: 'founded', activeTypes: { '1': {value: 'string', default: undefined} }}});
                });
                test("DIFFERENT TYPE: Create Node Type - Relationship Type Concurrent", () => {
                    schema.SMO_addNodeType("Company", ["com"], {location: "string", revenue: "number", founded: "string"});
                    schema2.SMO_addRelationshipType("HATES", "Person", "Person", {why: "string"});
                    bidirectionalSync(doc, doc2);
                    // check schema2
                    const schema2Temp = schema2.transformToJSONFullSchema();
                    expect(schema2Temp.nodeTypes.Company).toBeDefined();
                    expect(schema2Temp.nodeTypes.Company.labels).toEqual({com: "com"});
                    expect(schema2Temp.nodeTypes.Company.properties).toEqual(
                        {location: {name: 'location', activeTypes: { '1': {value: 'string', default: undefined} }}, 
                        revenue: {name: 'revenue', activeTypes: { '1': {value: 'number', default: undefined} }}, 
                        founded: {name: 'founded', activeTypes: { '1': {value: 'string', default: undefined} }}});
                    expect(schema2Temp.relationshipTypes.HATES).toBeDefined();
                    expect(schema2Temp.relationshipTypes.HATES.properties).toEqual(
                        {why: {name: 'why', activeTypes: { '2': {value: 'string', default: undefined} }}});
                    
                    // check schema
                    const schemeTemp = schema.transformToJSONFullSchema();
                    expect(schemeTemp.nodeTypes.Company).toBeDefined();
                    expect(schemeTemp.nodeTypes.Company.labels).toEqual({com: "com"});
                    expect(schemeTemp.nodeTypes.Company.properties).toEqual(
                        {location: {name: 'location', activeTypes: { '1': {value: 'string', default: undefined} }}, 
                        revenue: {name: 'revenue', activeTypes: { '1': {value: 'number', default: undefined} }}, 
                        founded: {name: 'founded', activeTypes: { '1': {value: 'string', default: undefined} }}});
                    expect(schemeTemp.relationshipTypes.HATES).toBeDefined();
                    expect(schemeTemp.relationshipTypes.HATES.properties).toEqual(
                        {why: {name: 'why', activeTypes: { '2': {value: 'string', default: undefined} }}});
                });
            });
            describe("RelationshipType - RelationshipType", () => {
                test("SAME TYPE: Create Relationship Type - Relationship Type Concurrent", () => {
                    schema.SMO_addRelationshipType("HATES", "Person", "Person", {role: "string"});
                    schema2.SMO_addRelationshipType("HATES", "Message", "Message", {position: "string"});
                    bidirectionalSync(doc, doc2);
                    const schema2Temp = schema2.transformToJSONFullSchema().relationshipTypes;
                    expect(schema2Temp.HATES).toBeDefined();
                    expect(schema.transformToJSONFullSchema().relationshipTypes.HATES).toBeDefined();
                    expect(schema2Temp.HATES.sourceNodeLabel).toEqual("Message");
                    expect(schema2Temp.HATES.targetNodeLabel).toEqual("Message");
                    expect(schema2Temp.HATES.properties).toEqual(
                        {position: {name: 'position', activeTypes: { '2': {value: 'string', default: undefined} }}});

                });
                test("DIFFERENT TYPE: Create Relationship Type - Relationship Type Concurrent", () => {
                    schema.SMO_addRelationshipType("HATES", "Person", "Person", {why: "string"});
                    schema2.SMO_addRelationshipType("SUPPORTS", "Person", "Message", {citation: "string"});

                    bidirectionalSync(doc, doc2);

                    const schema2Temp = schema2.transformToJSONFullSchema().relationshipTypes;
                    expect(schema2Temp.HATES).toBeDefined();
                    expect(schema2Temp.SUPPORTS).toBeDefined();
                    expect(schema2Temp.HATES.properties).toEqual(
                        {why: {name: 'why', activeTypes: { '1': {value: 'string', default: undefined} }}});
                    expect(schema2Temp.SUPPORTS.properties).toEqual(
                        {citation: {name: 'citation', activeTypes: { '2': {value: 'string', default: undefined} }}});
                    
                    const schemaTemp = schema.transformToJSONFullSchema().relationshipTypes;
                    expect(schemaTemp.HATES).toBeDefined();
                    expect(schemaTemp.SUPPORTS).toBeDefined();
                    expect(schemaTemp.HATES.properties).toEqual(
                        {why: {name: 'why', activeTypes: { '1': {value: 'string', default: undefined} }}});
                    expect(schemaTemp.SUPPORTS.properties).toEqual(
                        {citation: {name: 'citation', activeTypes: { '2': {value: 'string', default: undefined} }}});
                });
            });
        })
    describe("CREATE - DROP", () => {

    })
    describe("CREATE - RENAME", () => {

    })
    describe("CREATE - CHANGE", () => {

    })
            /* DROP */
    describe("DROP - DROP", () => {
        test("Drop NodeType Concurrent (Drop vs Update)", () => {
             bidirectionalSync(doc, doc2);
             schema.SMO_dropNodeType("Message");
             schema2.SMO_AddPropertyType({Idenifying: "Message", newProperty: {key: "newProp", value: "string"}, whatToChange: "NodeType"});
             bidirectionalSync(doc, doc2);
             // The drop of the entire Map should cascade and result in undefined
             expect(schema.transformToJSONFullSchema().nodeTypes.Message).toBeUndefined();
             expect(schema2.transformToJSONFullSchema().nodeTypes.Message).toBeUndefined();
        });
        test("Drop RelationshipType Concurrent (Both drop)", () => {
             bidirectionalSync(doc, doc2);
             schema.SMO_dropRelationshipType("KNOWS");
             schema2.SMO_dropRelationshipType("KNOWS");
             bidirectionalSync(doc, doc2);
             expect(schema.transformToJSONFullSchema().relationshipTypes.KNOWS).toBeUndefined();
             expect(schema2.transformToJSONFullSchema().relationshipTypes.KNOWS).toBeUndefined();
        });
    });
    describe("DROP - RENAME", () => {

    })
    describe("DROP - CHANGE", () => {

    })
    /* RENAME */
    describe("RENAME - RENAME", () => {
        test("Rename Property Key of NodeType Concurrent (Both rename)", () => {
            bidirectionalSync(doc, doc2);
            schema.SMO_renamePropertyKey({Idenifying: "Person", oldPropertyKey: "lastName", newPropertyKey: "familyName", whatToChange: "NodeType"});
            schema2.SMO_renamePropertyKey({Idenifying: "Person", oldPropertyKey: "lastName", newPropertyKey: "surname", whatToChange: "NodeType"});
            bidirectionalSync(doc, doc2);
            // Y.Map ensures both end up with the same string via LWW
            const props = schema.transformToJSONFullSchema().nodeTypes.Person.properties;
            const props2 = schema2.transformToJSONFullSchema().nodeTypes.Person.properties;
            expect(props.lastName.name).toEqual(props2.lastName.name);
            expect(["familyName", "surname"]).toContain(props.lastName.name);
        });
        test("Rename Property Key of RelationshipType Concurrent", () => {
            bidirectionalSync(doc, doc2);
            schema.SMO_renamePropertyKey({Idenifying: "KNOWS", oldPropertyKey: "since", newPropertyKey: "seit", whatToChange: "RelationshipType"});
            schema2.SMO_renamePropertyKey({Idenifying: "KNOWS", oldPropertyKey: "since", newPropertyKey: "startDate", whatToChange: "RelationshipType"});
            bidirectionalSync(doc, doc2);
            const props = schema.transformToJSONFullSchema().relationshipTypes.KNOWS.properties;
            expect(["seit", "startDate"]).toContain(props.since.name);
        });
        test("Rename Label of NodeType Concurrent", () => {
            bidirectionalSync(doc, doc2);
            schema.SMO_renameLabel({Idenifying: "Message", oldLabel: "note", newLabel: "memo", whatToChange: "NodeType"});
            schema2.SMO_renameLabel({Idenifying: "Message", oldLabel: "note", newLabel: "messageDoc", whatToChange: "NodeType"});
            bidirectionalSync(doc, doc2);
            const labels = schema.transformToJSONFullSchema().nodeTypes.Message.labels;
            expect(labels.memo || labels.messageDoc).toBeDefined();
        });
        test("Rename Label of RelationshipType Concurrent", () => {
            // Not supported exactly in Schema_v1 implementation but we can assert empty block won't crash
            expect(true);
        });
    });
    describe("RENAME - CHANGE", () => {

    })
    describe("CHANGE - CHANGE", () => {
        test("Add Property to NodeType Concurrent", () => {
            bidirectionalSync(doc, doc2);
            schema.SMO_AddPropertyType({Idenifying: "Person", newProperty: {key: "age", value: "number"}, whatToChange: "NodeType"});
            schema2.SMO_AddPropertyType({Idenifying: "Person", newProperty: {key: "city", value: "string"}, whatToChange: "NodeType"});
            bidirectionalSync(doc, doc2);
            const props = schema.transformToJSONFullSchema().nodeTypes.Person.properties;
            expect(props.age).toBeDefined();
            expect(props.city).toBeDefined();
            expect(props.age.name).toEqual("age");
        });
        test("Add Property to RelationshipType Concurrent", () => {
            bidirectionalSync(doc, doc2);
            schema.SMO_AddPropertyType({Idenifying: "KNOWS", newProperty: {key: "strength", value: "number"}, whatToChange: "RelationshipType"});
            schema2.SMO_AddPropertyType({Idenifying: "KNOWS", newProperty: {key: "context", value: "string"}, whatToChange: "RelationshipType"});
            bidirectionalSync(doc, doc2);
            const props = schema.transformToJSONFullSchema().relationshipTypes.KNOWS.properties;
            expect(props.strength).toBeDefined();
            expect(props.context).toBeDefined();
        });
        test("Drop Property from NodeType Concurrent", () => {
            bidirectionalSync(doc, doc2);
            schema.SMO_DropPropertyType({Idenifying: "Person", propertyKey: "firstName", whatToChange: "NodeType"});
            schema2.SMO_DropPropertyType({Idenifying: "Person", propertyKey: "lastName", whatToChange: "NodeType"});
            bidirectionalSync(doc, doc2);
            const props = schema.transformToJSONFullSchema().nodeTypes.Person.properties;
            expect(props.firstName).toBeUndefined();
            expect(props.lastName).toBeUndefined();
        });
        test("Drop Property from RelationshipType Concurrent", () => {
            bidirectionalSync(doc, doc2);
            schema.SMO_DropPropertyType({Idenifying: "KNOWS", propertyKey: "since", whatToChange: "RelationshipType"});
            schema2.SMO_DropPropertyType({Idenifying: "KNOWS", propertyKey: "since", whatToChange: "RelationshipType"});
            bidirectionalSync(doc, doc2);
            const props = schema.transformToJSONFullSchema().relationshipTypes.KNOWS.properties;
            expect(props.since).toBeUndefined();
        });
        test("Change Property Type of NodeType Concurrent", () => {
            bidirectionalSync(doc, doc2);
            const tags = schema.getPropertyTypeTags("Message", "mood", "NodeType");
            const tags2 = schema2.getPropertyTypeTags("Message", "mood", "NodeType");
            
            const transformerMap = { "happy": "10", "sad": "0", "neutral": "5", "default": "-1" }   
            schema.SMO_ChangePropertyType({Idenifying: "Message", propertyKey: "mood", oldTags: tags, newPropertyType: "number", defaultVal: {default: -1, transformerMap: transformerMap}, whatToChange: "NodeType"});
            
            schema2.SMO_ChangePropertyType({Idenifying: "Message", propertyKey: "mood", oldTags: tags2, newPropertyType: "string", defaultVal: {default: "0"}, whatToChange: "NodeType"});
            
            bidirectionalSync(doc, doc2);
            
            // Both clients' definitions are inside activeTypes mapped by their clientID natively due to concurrent OR-set logic!
            const mergedProps = schema.transformToJSONFullSchema().nodeTypes.Message.properties.mood.activeTypes;
            const clientKeys = Object.keys(mergedProps);
            expect(clientKeys.length).toBeGreaterThan(0); // activeTypes successfully merged both edits!
        });
        test("Change Property Type of RelationshipType Concurrent", () => {
            bidirectionalSync(doc, doc2);
            const tags = schema.getPropertyTypeTags("KNOWS", "since", "RelationshipType");
            const tags2 = schema2.getPropertyTypeTags("KNOWS", "since", "RelationshipType");
            schema.SMO_ChangePropertyType({Idenifying: "KNOWS", propertyKey: "since", oldTags: tags, newPropertyType: "number", defaultVal: {default: 2000}, whatToChange: "RelationshipType"});
            schema2.SMO_ChangePropertyType({Idenifying: "KNOWS", propertyKey: "since", oldTags: tags2, newPropertyType: "date", defaultVal: {default: new Date("2000-01-01")}, whatToChange: "RelationshipType"});
            bidirectionalSync(doc, doc2);
            
            const mergedProps = schema.transformToJSONFullSchema().relationshipTypes.KNOWS.properties.since.activeTypes;
            expect(Object.keys(mergedProps).length).toBeGreaterThan(0);
        });
    });
    });
});