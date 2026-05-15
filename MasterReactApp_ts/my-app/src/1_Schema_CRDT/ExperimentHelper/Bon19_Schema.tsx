import { Schema_v1, SchemaDefinition } from "../Schema_v1/schema_v1";

export const bon19SchemaDef: SchemaDefinition = {
    nodes: [
        {
            identifyingType: 'Person',
            labels: ['resident', 'citizen'],
            properties: {
                firstName: 'string',
                lastName: 'string'
            }
        },
        {
            identifyingType: 'Message',
            labels: ['note'],
            properties: {
                mood: 'string',
                imageFile: 'string',
                creationDate: 'string',
                browserUsed: 'string'
            }
        }
    ],
    relationships: [
        {
            identifyingEdge: 'KNOWS',
            sourceNodeLabel: 'Person',
            targetNodeLabel: 'Person',
            properties: {
                since: 'string'
            }
        },
        {
            identifyingEdge: 'HAS_CREATOR',
            sourceNodeLabel: 'Message',
            targetNodeLabel: 'Person',
            properties: {
                username: 'string'
            }
        },
        {
            identifyingEdge: 'LIKES',
            sourceNodeLabel: 'Person',
            targetNodeLabel: 'Message',
            properties: {
                date: 'string'
            }
        },
        {
            identifyingEdge: 'REPLY_OF',
            sourceNodeLabel: 'Message',
            targetNodeLabel: 'Message',
            properties: {
                date: 'string'
            }
        }
    ]
};

export const bon19Schema = new Schema_v1(bon19SchemaDef);
