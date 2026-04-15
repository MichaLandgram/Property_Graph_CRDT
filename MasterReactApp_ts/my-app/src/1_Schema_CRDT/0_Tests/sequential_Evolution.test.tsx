import { bon19SchemaDef } from "../ExperimentHelper/Bon19_Schema";
import { Schema_v1 } from "../Schema/schema_v1"
import { SchemaError } from "../0_Helper/SchemaError";
import { getDoc } from "../../Helper/YJS_helper/creator";

const checkPersonNodeType = (schema: Schema_v1) => {
    console.log(schema.getNodeType('Person').get('properties').toJSON());
    expect(schema.getNodeType('Person')).toBeDefined();
    expect(schema.getNodeType('Person').get('labels').toJSON()).toEqual({resident: 'resident', citizen: 'citizen'});
    expect(schema.getNodeType('Person').get('properties').toJSON()).toEqual(
        { firstName: {name: 'firstName', activeTypes: { '1': {value: 'string', default: undefined} }}, 
        lastName: {name: 'lastName', activeTypes: { '1': {value: 'string', default: undefined} }}});
}

const checkMessageNodeType = (schema: Schema_v1) => {
    expect(schema.getNodeType('Message')).toBeDefined();
    expect(schema.getNodeType('Message').get('labels').toJSON()).toEqual({note: 'note'});
    expect(schema.getNodeType('Message').get('properties').toJSON()).toEqual(
        { mood: {name: 'mood', activeTypes: { '1': {value: 'string', default: undefined} }}, 
        imageFile: {name: 'imageFile', activeTypes: { '1': {value: 'string', default: undefined} }}, 
        creationDate: {name: 'creationDate', activeTypes: { '1': {value: 'string', default: undefined} }}, 
        browserUsed: {name: 'browserUsed', activeTypes: { '1': {value: 'string', default: undefined} }}});
}

const checkKnowsRelationshipType = (schema: Schema_v1) => {
    expect(schema.getRelationshipType('KNOWS')).toBeDefined();
    expect(schema.getRelationshipType('KNOWS').get('sourceNodeLabel')).toEqual('Person');
    expect(schema.getRelationshipType('KNOWS').get('targetNodeLabel')).toEqual('Person');
    expect(schema.getRelationshipType('KNOWS').get('properties').toJSON()).toEqual(
        {since: {name: 'since', activeTypes: { '1': {value: 'string', default: undefined} }}});
}

const checkHasCreatorRelationshipType = (schema: Schema_v1) => {
    expect(schema.getRelationshipType('HAS_CREATOR')).toBeDefined();
    expect(schema.getRelationshipType('HAS_CREATOR').get('sourceNodeLabel')).toEqual('Message');
    expect(schema.getRelationshipType('HAS_CREATOR').get('targetNodeLabel')).toEqual('Person');
    expect(schema.getRelationshipType('HAS_CREATOR').get('properties').toJSON()).toEqual(
        {username: {name: 'username', activeTypes: { '1': {value: 'string', default: undefined} }}});
}

const checkLikesRelationshipType = (schema: Schema_v1) => {
    expect(schema.getRelationshipType('LIKES')).toBeDefined();
    expect(schema.getRelationshipType('LIKES').get('sourceNodeLabel')).toEqual('Person');
    expect(schema.getRelationshipType('LIKES').get('targetNodeLabel')).toEqual('Message');
    expect(schema.getRelationshipType('LIKES').get('properties').toJSON()).toEqual({
        date: {name: 'date', activeTypes: { '1': {value: 'string', default: undefined} }}});
}

const checkReplyOfRelationshipType = (schema: Schema_v1) => {
    expect(schema.getRelationshipType('REPLY_OF')).toBeDefined();
    expect(schema.getRelationshipType('REPLY_OF').get('sourceNodeLabel')).toEqual('Message');
    expect(schema.getRelationshipType('REPLY_OF').get('targetNodeLabel')).toEqual('Message');
    expect(schema.getRelationshipType('REPLY_OF').get('properties').toJSON()).toEqual(
        {date: {name: 'date', activeTypes: { '1': {value: 'string', default: undefined} }}});
}

describe("Sequential Evolution - basic", () => {
    let schema: Schema_v1;
    beforeEach(() => {
        const doc = getDoc(1);
        schema = new Schema_v1(bon19SchemaDef, doc);
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
            schema.addNodeType({IdenifyingType: "Account", labels: ["acc"], properties: {iban: "string", balance: "number", bankID: "string"}});
            expect(schema.transformToJSONFullSchema().nodeTypes.Account).toBeDefined();
            expect(schema.transformToJSONFullSchema().nodeTypes.Account.labels).toEqual({acc: "acc"});
            expect(schema.transformToJSONFullSchema().nodeTypes.Account.properties).toEqual(
                {iban: {name: 'iban', activeTypes: { '1': {value: 'string', default: undefined} }}, 
                balance: {name: 'balance', activeTypes: { '1': {value: 'number', default: undefined} }}, 
                bankID: {name: 'bankID', activeTypes: { '1': {value: 'string', default: undefined} }}});
        });
        test("Create RelationshipType", () => {
            schema.addRelationshipType({IdenifyingEdge: "OWNED_BY", sourceNodeLabel: "Account", targetNodeLabel: "Account", properties: {since: "string"}});
            expect(schema.getRelationshipType("OWNED_BY")).toBeDefined();
            expect(schema.getRelationshipType("OWNED_BY").get("sourceNodeLabel")).toEqual("Account");
            expect(schema.getRelationshipType("OWNED_BY").get("targetNodeLabel")).toEqual("Account");
            expect(schema.getRelationshipType("OWNED_BY").get("properties").toJSON()).toEqual(
                {since: {name: 'since', activeTypes: { '1': {value: 'string', default: undefined} }}});
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
            expect(schema.getNodeType("Person").get("properties").toJSON()).toEqual(
                {firstName: {name: 'name', activeTypes: { '1': {value: 'string', default: undefined} }}, 
                lastName: {name: 'lastName', activeTypes: { '1': {value: 'string', default: undefined} }}});
            schema.SMO_renamePropertyKey({Idenifying: "KNOWS", oldPropertyKey: "since", newPropertyKey: "seit", whatToChange: "RelationshipType"});
            // expect(schema.getRelationshipType("KNOWS").get("sourceNodeLabel")).toEqual("Person");
            // expect(schema.getRelationshipType("KNOWS").get("targetNodeLabel")).toEqual("Person");
            expect(schema.getRelationshipType("KNOWS").get("properties").toJSON()).toEqual(
                {since: {name: 'seit', activeTypes: { '1': {value: 'string', default: undefined} }}});
        });
        test("Rename Label Node", () => {
            expect(true);
        });
        test("Remame Edge Label", () => {
            expect(true);
        });
    });
});