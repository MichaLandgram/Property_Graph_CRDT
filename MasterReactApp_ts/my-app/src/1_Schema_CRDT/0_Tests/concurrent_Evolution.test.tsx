import * as Y from 'yjs';
import { bon19SchemaDef } from "../ExperimentHelper/Bon19_Schema";
import { Schema_v1 } from "../Schema/schema_v1"
import { SchemaError } from "../0_Helper/SchemaError";
import { getDoc } from "../../Helper/YJS_helper/creator";
import { bidirectionalSync } from "../../Helper/YJS_helper/sync";

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
        describe("Create", () => {
            test("Create Node Type - Node Type Concurrent, same type", () => {
                schema.addNodeType({IdenifyingType: "Account", labels: ["acc"], properties: {iban: "string", balance: "number", bankID: "string"}});
                expect(schema.transformToJSONFullSchema().nodeTypes.Account).toBeDefined();
                expect(schema.transformToJSONFullSchema().nodeTypes.Account.labels).toEqual({acc: "acc"});
                expect(schema.transformToJSONFullSchema().nodeTypes.Account.properties).toEqual(
                    {iban: {name: 'iban', activeTypes: { '1': {value: 'string', default: undefined} }}, 
                    balance: {name: 'balance', activeTypes: { '1': {value: 'number', default: undefined} }}, 
                bankID: {name: 'bankID', activeTypes: { '1': {value: 'string', default: undefined} }}});

                schema2.addNodeType({IdenifyingType: "Account", labels: ["akk"], properties: {ibun: "string", balancke: "number", bankkID: "string"}});
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
            test("Create Node Type - Relationship Type Concurrent", () => {
                
            });
            test("Create Relationship Type", () => {
                
            });
        })
    });
});