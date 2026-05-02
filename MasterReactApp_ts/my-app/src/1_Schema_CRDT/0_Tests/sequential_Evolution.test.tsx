import { bon19SchemaDef } from "../ExperimentHelper/Bon19_Schema";
import { Schema_v1 } from "../Schema/schema_v1"
import { SchemaError } from "../../0_Meta/ErrorDefinition";
import { getDoc } from "../../Helper/YJS_helper/creator";

const checkPersonNodeType = (schema: Schema_v1) => {
    console.log(schema.getNodeTypeJSON('Person'));
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
    beforeEach(() => {
        const doc = getDoc(1);
        schema = new Schema_v1(bon19SchemaDef, doc);
    })
    /* CREATE */
    describe("CREATE", () => {
        test("Autoloading", () => {
            checkPersonNodeType(schema);
            checkMessageNodeType(schema);
            checkKnowsRelationshipType(schema);
            checkHasCreatorRelationshipType(schema);
            checkLikesRelationshipType(schema);
            checkReplyOfRelationshipType(schema);
        });
        test("Create NodeType", () => {
            schema.SMO_addNodeType("Account", ["acc"], {iban: "string", balance: "number", bankID: "string"});
            expect(schema.transformToJSONFullSchema().nodeTypes.Account).toBeDefined();
            expect(schema.transformToJSONFullSchema().nodeTypes.Account.labels).toEqual({acc: "acc"});
            expect(schema.transformToJSONFullSchema().nodeTypes.Account.properties).toEqual(
                {iban: {name: 'iban', activeTypes: { '1': {value: 'string', default: undefined} }}, 
                balance: {name: 'balance', activeTypes: { '1': {value: 'number', default: undefined} }}, 
                bankID: {name: 'bankID', activeTypes: { '1': {value: 'string', default: undefined} }}});
        });
        test("Create RelationshipType", () => {
            schema.SMO_addRelationshipType("OWNED_BY", "Account", "Account", {since: "string"});
            expect(schema.getRelationshipTypeJSON("OWNED_BY")).toBeDefined();
            expect(schema.getRelationshipTypeJSON("OWNED_BY").sourceNodeLabel).toEqual("Account");
            expect(schema.getRelationshipTypeJSON("OWNED_BY").targetNodeLabel).toEqual("Account");
            expect(schema.getRelationshipTypeJSON("OWNED_BY").properties).toEqual(
                {since: {name: 'since', activeTypes: { '1': {value: 'string', default: undefined} }}});
        });
    });
    /* DROP */
    describe("DROP", () => {
        test("Drop NodeType", () => {
            expect(schema.getNodeTypeJSON("Person")).toBeDefined();
            schema.SMO_dropNodeType("Person");
            expect(() => schema.getNodeTypeJSON("Person")).toThrow(SchemaError);

        });
        test("Drop RelationshipType", () => {
            expect(schema.getRelationshipTypeJSON("KNOWS")).toBeDefined();
            schema.SMO_dropRelationshipType("KNOWS");
            expect(() => schema.getRelationshipTypeJSON("KNOWS")).toThrow(SchemaError);
        });
    });
    /* RENAME */
    describe("Rename", () => {
        test("Rename Property Key of NodeType and Edge", () => {
            schema.SMO_renamePropertyKey({Idenifying: "Person", oldPropertyKey: "firstName", newPropertyKey: "name", whatType: "NodeType"});
            expect(schema.getNodeTypeJSON("Person").properties).toEqual(
                {firstName: {name: 'name', activeTypes: { '1': {value: 'string', default: undefined} }}, 
                lastName: {name: 'lastName', activeTypes: { '1': {value: 'string', default: undefined} }}});
        });
        test("Rename Property Key of RelationshipType", () => {
            schema.SMO_renamePropertyKey({Idenifying: "KNOWS", oldPropertyKey: "since", newPropertyKey: "seit", whatType: "RelationshipType"});
            expect(schema.getRelationshipTypeJSON("KNOWS").properties).toEqual(
                {since: {name: 'seit', activeTypes: { '1': {value: 'string', default: undefined} }}});
        });
        test("Rename Label of NodeType", () => {
            expect(true);
        });
        test("Rename Label of RelationshipType", () => {
            expect(true);
        });
    });
    describe("Change", () => {
        test("Add Property to NodeType", () => {
            schema.SMO_AddPropertyType({Idenifying: "Person", newProperty: {key: "age", value: "number"}, whatType: "NodeType"});
            expect(schema.getNodeTypeJSON("Person").properties).toEqual(
                {firstName: {name: 'firstName', activeTypes: { '1': {value: 'string', default: undefined} }}, 
                lastName: {name: 'lastName', activeTypes: { '1': {value: 'string', default: undefined} }}, 
                age: {name: 'age', activeTypes: { '1': {value: 'number', default: undefined} }}});
        });
        test("Add Property to RelationshipType", () => {
            schema.SMO_AddPropertyType({Idenifying: "HATES", newProperty: {key: "since", value: "string"}, whatType: "RelationshipType"});
            expect(schema.getRelationshipTypeJSON("HATES").properties).toEqual(
                {since: {name: 'since', activeTypes: { '1': {value: 'string', default: undefined} }}});
        });
        test("Drop Property from NodeType", () => {
            schema.SMO_DropPropertyType({Idenifying: "Person", propertyKey: "firstName", whatType: "NodeType"});
            expect(schema.getNodeTypeJSON("Person").properties).toEqual(
                {lastName: {name: 'lastName', activeTypes: { '1': {value: 'string', default: undefined} }}});
        });
        test("Drop Property from RelationshipType", () => {
            schema.SMO_DropPropertyType({Idenifying: "KNOWS", propertyKey: "since", whatType: "RelationshipType"});
            expect(schema.getRelationshipTypeJSON("KNOWS").properties).toEqual({});
        });
        test("Change Property Type of NodeType", () => {
            const tags = schema.getPropertyTypeTags("Message", "mood", "NodeType");
            const transformerMap = {
                "happy": "10",
                "sad": "0",
                "neutral": "5",
                "default": "-1"
            }   
            schema.SMO_ChangePropertyType({Idenifying: "Message", propertyKey: "mood", oldTags: tags, newPropertyType: "number", defaultVal: {default: -1, transformerMap: transformerMap}, whatType: "NodeType"});
            expect(schema.getNodeTypeJSON("Message").properties.mood).toEqual({ name: 'mood', activeTypes: { '1': {value: 'number', default: -1, transformerMap: transformerMap} } });
        });
        test("Change Property Type of RelationshipType", () => {
            const tags = schema.getPropertyTypeTags("KNOWS", "since", "RelationshipType");
            schema.SMO_ChangePropertyType({Idenifying: "KNOWS", propertyKey: "since", oldTags: tags, newPropertyType: "number", defaultVal: {default: 2000}, whatType: "RelationshipType"});
            expect(schema.getRelationshipTypeJSON("KNOWS").properties.since).toEqual({ name: 'since', activeTypes: { '1': {value: 'number', default: 2000} } });
        });
    });
});