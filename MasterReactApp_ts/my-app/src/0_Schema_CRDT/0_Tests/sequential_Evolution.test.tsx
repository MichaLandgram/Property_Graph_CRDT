import { bon19SchemaDef } from "../ExperimentHelper/Bon19_Schema";
import { Schema_v1 } from "../Schema/schema_v1"
import { SchemaError } from "../0_Helper/SchemaError";

const checkPersonNodeType = (schema: Schema_v1) => {
    console.log(schema.getNodeType('Person').get('properties').toJSON());
    expect(schema.getNodeType('Person')).toBeDefined();
    expect(schema.getNodeType('Person').get('labels').toArray()).toEqual(['resident', 'citizen']);
    expect(schema.getNodeType('Person').get('properties').toJSON()).toEqual({ firstName: {name: 'firstName', value: 'string'}, lastName: {name: 'lastName', value: 'string'} });
}

const checkMessageNodeType = (schema: Schema_v1) => {
    expect(schema.getNodeType('Message')).toBeDefined();
    expect(schema.getNodeType('Message').get('labels').toJSON()).toEqual(['note']);
    expect(schema.getNodeType('Message').get('properties').toJSON()).toEqual({ mood: {name: 'mood', value: 'string'}, imageFile: {name: 'imageFile', value: 'string'}, creationDate: {name: 'creationDate', value: 'string'}, browserUsed: {name: 'browserUsed', value: 'string'} });
}

const checkKnowsRelationshipType = (schema: Schema_v1) => {
    expect(schema.getRelationshipType('KNOWS')).toBeDefined();
    expect(schema.getRelationshipType('KNOWS').get('sourceNodeLabel')).toEqual('Person');
    expect(schema.getRelationshipType('KNOWS').get('targetNodeLabel')).toEqual('Person');
    expect(schema.getRelationshipType('KNOWS').get('properties').toJSON()).toEqual({since: {name: 'since', value: 'string'}});
}

const checkHasCreatorRelationshipType = (schema: Schema_v1) => {
    expect(schema.getRelationshipType('HAS_CREATOR')).toBeDefined();
    expect(schema.getRelationshipType('HAS_CREATOR').get('sourceNodeLabel')).toEqual('Message');
    expect(schema.getRelationshipType('HAS_CREATOR').get('targetNodeLabel')).toEqual('Person');
    expect(schema.getRelationshipType('HAS_CREATOR').get('properties').toJSON()).toEqual({username: {name: 'username', value: 'string'}});
}

const checkLikesRelationshipType = (schema: Schema_v1) => {
    expect(schema.getRelationshipType('LIKES')).toBeDefined();
    expect(schema.getRelationshipType('LIKES').get('sourceNodeLabel')).toEqual('Person');
    expect(schema.getRelationshipType('LIKES').get('targetNodeLabel')).toEqual('Message');
    expect(schema.getRelationshipType('LIKES').get('properties').toJSON()).toEqual({date: {name: 'date', value: 'string'}});
}

const checkReplyOfRelationshipType = (schema: Schema_v1) => {
    expect(schema.getRelationshipType('REPLY_OF')).toBeDefined();
    expect(schema.getRelationshipType('REPLY_OF').get('sourceNodeLabel')).toEqual('Message');
    expect(schema.getRelationshipType('REPLY_OF').get('targetNodeLabel')).toEqual('Message');
    expect(schema.getRelationshipType('REPLY_OF').get('properties').toJSON()).toEqual({date: {name: 'date', value: 'string'}});
}

describe("Sequential Evolution - basic", () => {
    let schema: Schema_v1;
    beforeEach(() => {
        schema = new Schema_v1(bon19SchemaDef);
    })
    describe("CREATE", () => {
    test("Autoloading", () => {
        checkPersonNodeType(schema);
        checkMessageNodeType(schema);
        checkKnowsRelationshipType(schema);
        checkHasCreatorRelationshipType(schema);
        checkLikesRelationshipType(schema);
        checkReplyOfRelationshipType(schema);
    })
        test("Create NodeType", () => {
            schema.addNodeType("Account", ["acc"], {iban: "string", balance: "number", bankID: "string"});
            expect(schema.transformToJSONFullSchema().nodeTypes.Account).toBeDefined();
            expect(schema.transformToJSONFullSchema().nodeTypes.Account.labels).toEqual(["acc"]);
            expect(schema.transformToJSONFullSchema().nodeTypes.Account.properties).toEqual({iban: {name: 'iban', value: 'string'}, balance: {name: 'balance', value: 'number'}, bankID: {name: 'bankID', value: 'string'}});
        });
        test("Create RelationshipType", () => {
            schema.addRelationshipType("OWNED_BY", "Account", "Account", {since: "string"});
            expect(schema.getRelationshipType("OWNED_BY")).toBeDefined();
            expect(schema.getRelationshipType("OWNED_BY").get("sourceNodeLabel")).toEqual("Account");
            expect(schema.getRelationshipType("OWNED_BY").get("targetNodeLabel")).toEqual("Account");
            expect(schema.getRelationshipType("OWNED_BY").get("properties").toJSON()).toEqual({since: {name: 'since', value: 'string'}});
        });
    });
    describe("DROP", () => {
        test("Drop NodeType", () => {
            expect(schema.getNodeType("Person")).toBeDefined();
            schema.dropNodeType("Person");
            expect(() => schema.getNodeType("Person")).toThrow(SchemaError);

        });
        test("Drop RelationshipType", () => {
            expect(schema.getRelationshipType("KNOWS")).toBeDefined();
            schema.deleteRelationshipType("KNOWS");
            expect(() => schema.getRelationshipType("KNOWS")).toThrow(SchemaError);
        });
    });
    describe("Rname", () => {
        test("Rename Property Key of NodeType and Edge", () => {
            schema.SMO_renamePropertyKey({Idenifying: "Person", oldPropertyKey: "firstName", newPropertyKey: "name", whatToChange: "NodeType"});
            // expect(schema.getNodeType("Person").get("labels").toArray()).toEqual(["resident", "citizen"]);
            expect(schema.getNodeType("Person").get("properties").toJSON()).toEqual({firstName: {name: 'name', value: 'string'}, lastName: {name: 'lastName', value: 'string'}});
            schema.SMO_renamePropertyKey({Idenifying: "KNOWS", oldPropertyKey: "since", newPropertyKey: "seit", whatToChange: "RelationshipType"});
            // expect(schema.getRelationshipType("KNOWS").get("sourceNodeLabel")).toEqual("Person");
            // expect(schema.getRelationshipType("KNOWS").get("targetNodeLabel")).toEqual("Person");
            expect(schema.getRelationshipType("KNOWS").get("properties").toJSON()).toEqual({since: {name: 'seit', value: 'string'}});
        });
        test("Rename Label Node", () => {
            schema.updateNodeType({IdenifyingType: "Person", labels: ["person"], properties: {firstName: "string", lastName: "string"}});
            expect(schema.getNodeType("Person").get("labels").toArray()).toEqual(["person"]);
            expect(schema.getNodeType("Person").get("properties").toJSON()).toEqual({firstName: {name: 'firstName', value: 'string'}, lastName: {name: 'lastName', value: 'string'}});
        });
        test("Remame Edge Label", () => {
            schema.updateRelationshipType({IdenifyingLabel: "KNOWS", sourceNodeLabel: "Person", targetNodeLabel: "Person", properties: {since: "string"}});
            expect(schema.getRelationshipType("KNOWS").get("sourceNodeLabel")).toEqual("Person");
            expect(schema.getRelationshipType("KNOWS").get("targetNodeLabel")).toEqual("Person");
            expect(schema.getRelationshipType("KNOWS").get("properties").toJSON()).toEqual({since: {name: 'since', value: 'string'}});
        });
    });
});