import { Schema_v1, SchemaDefinition } from "../Schema/schema_v1";

export const base: SchemaDefinition = {
    nodes: [
        {
            identifyingType: 'Person',
            labels: ['Person'],
            properties: {
                name: 'string',
                isBlocked: 'boolean',
                createTime: 'date',
                gender: 'string'
            }
        },
        {
            identifyingType: 'Account',
            labels: ['Account'],
            properties: {
                createTime: 'date',
                isBlocked: 'boolean',
                type: 'string',
                nickname: 'string'
            }
        },
        {
            identifyingType: 'Medium',
            labels: ['Medium'],
            properties: {
                type: 'string',
                createTime: 'date',
                isBlocked: 'boolean'
            }
        },
        {
            identifyingType: 'Company',
            labels: ['Company'],
            properties: {
                name: 'string',
                isBlocked: 'boolean',
                createTime: 'date'
            }
        },
        {
            identifyingType: 'Loan',
            labels: ['Loan'],
            properties: {
                loanAmount: 'number',
                balance: 'number',
                usage: 'string',
                interestRate: 'number'
            }
        }
    ],
    relationships: [
        {
            identifyingEdge: 'own',
            sourceNodeLabel: 'Person',
            targetNodeLabel: 'Account',
            properties: {}
        },
        {
            identifyingEdge: 'apply',
            sourceNodeLabel: 'Person',
            targetNodeLabel: 'Account',
            properties: {}
        },
        {
            identifyingEdge: 'invest',
            sourceNodeLabel: 'Person',
            targetNodeLabel: 'Company',
            properties: {}
        },
        {
            identifyingEdge: 'signIn',
            sourceNodeLabel: 'Medium',
            targetNodeLabel: 'Account',
            properties: {}
        },
        {
            identifyingEdge: 'deposit',
            sourceNodeLabel: 'Loan',
            targetNodeLabel: 'Account',
            properties: {}
        },
        {
            identifyingEdge: 'repay',
            sourceNodeLabel: 'Loan',
            targetNodeLabel: 'Account',
            properties: {}
        },
        {
            identifyingEdge: 'guarantee',
            sourceNodeLabel: 'Loan',
            targetNodeLabel: 'Company',
            properties: {}
        },
        {
            identifyingEdge: 'guarantorRef',
            sourceNodeLabel: 'Loan',
            targetNodeLabel: 'Person',
            properties: {}
        }
    ]
};

export const baseSchema = base;