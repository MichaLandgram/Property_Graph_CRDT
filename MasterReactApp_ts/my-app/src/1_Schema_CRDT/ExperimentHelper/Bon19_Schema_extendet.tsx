import { Schema_v1, SchemaDefinition } from "../Schema/schema_v1";

export const bon19SchemaExt: SchemaDefinition = {
    nodes: [
        {
            identifyingType: 'Person',
            labels: ['resident', 'citizen'],
            properties: {
                firstName: 'string',
                lastName: 'string',
                isBlocked: 'boolean',
                age: 'number',
                gender: 'string'   
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
        // {
        //     identifyingEdge: 'HAS_MEMBER',
        //     sourceNodeLabel: 'Forum',
        //     targetNodeLabel: 'Person',
        //     properties: {
        //         creationDate: 'date'
        //     }  
        // },
        {
            identifyingEdge: 'HAS_MODERATOR',
            sourceNodeLabel: 'Forum',
            targetNodeLabel: 'Person',
            properties: {
                since: 'date'
            }  
        },
        {
            identifyingEdge: 'CONTAINER_OF',
            sourceNodeLabel: 'Forum',
            targetNodeLabel: 'Message',
            properties: {}  
        },
    ]
};

export const bon19SchemaExtendet = new Schema_v1(bon19SchemaExt);
