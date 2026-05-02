import { Schema_v1, SchemaDefinition } from "../Schema/schema_v1";

export const bon19SchemaExt: SchemaDefinition = {
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
        },
        {
            identifyingType: 'Forum',
            labels: ['note'],
            properties: {
                id: 'string',
                title: 'string'
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
        },
        {
            identifyingEdge: 'hasMemeber',
            sourceNodeLabel: 'Forum',
            targetNodeLabel: 'Person',
            properties: {
                creationDate: 'date'
            }  
        },
        {
            identifyingEdge: 'hasModerator',
            sourceNodeLabel: 'Forum',
            targetNodeLabel: 'Person',
            properties: {
                since: 'date'
            }  
        },
        {
            identifyingEdge: 'containerOf',
            sourceNodeLabel: 'Forum',
            targetNodeLabel: 'Message',
            properties: {}  
        },
    ]
};

export const bon19SchemaExtendet = new Schema_v1(bon19SchemaExt);
