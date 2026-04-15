// Node Types
import { 
    Policy, 
    labelTypes, 
    edgeLabelTypes, 
    dataTypes,
    boolKeys } from '../../../Helper/types_interfaces/types';


// Node Types
export const labelTypeValues = ['Loan', 'Account', 'Medium', 'Person', 'Company'];


// Edge Types
export const edgeLabelTypeValues = [
    'transfer',
    'withdraw',
    'own',
    'apply',
    'invest',
    'signIn',
    'deposit',
    'repay',
    'guarantee',
    'guarantorRef'
];

// Record of all allowed connections between nodes
export const allowedConnectivity: Record<labelTypes, Record<labelTypes, edgeLabelTypes[]>> = {
    Account: {
        Account: ['transfer', 'withdraw'],
        Loan: ['deposit']
    },
    Person: {
        Account: ['own', 'apply'],
        Company: ['invest']
    },
    Company: {
        Account: ['own'],
        Company: ['own'],
    },
    Medium: {
        Account: ['signIn'],
    },
    Loan: {
        Account: ['repay'],
        Company: ['guarantee'],
        Person: ['guarantorRef'],
    }
}

export const edgeTypeCardinality: Record<edgeLabelTypes, Record<labelTypes, Record<labelTypes, number>>> = {
    // TODO
}


// Record that contains all allowed node properties
export const allowedNodePropeerties: Record<labelTypes, Record<boolKeys, Record<string, dataTypes>>> = {
    Person: {
        notNull: {
            name: 'string',
            isBlocked: 'boolean',
            createTime: 'date',
            gender: 'string'
        },
        nullable: {
            birthday: 'date',
            country: 'string',
            city: 'string',
            // faceEmbedding: 'vector',
            // languages: ['string']
        }
    },
    Account: {
        notNull: {
            createTime: 'date',
            isBlocked: 'boolean',
            type: 'string',
            nickname: 'string'
        },
        nullable: {
            phoneNumber: 'string',
            email: 'string',
            freqLoginType: 'string',
            lastLoginTime: 'date',
            accountLevel: 'string',
            // lastLoginLocation: 'point',
            // prevPasswords: ['string']
        }
    },
    Medium: {
        notNull: {
            type: 'string',
            createTime: 'date',
            isBlocked: 'boolean'
        },
        nullable: {
            lastLoginTime: 'date',
            riskLevel: 'string',
            // deviceInfo: 'map',
            // location: 'point',
            // loginCount: 'number'
        }
    },
    Company: {
        notNull: {
            name: 'string',
            isBlocked: 'boolean',
            createTime: 'date'
        },
        nullable: {
            country: 'string',
            city: 'string',
            business: 'string',
            description: 'string',
            url: 'string',
            // headquarters: 'point',
            // metadata: 'map'
        }
    },
    Loan: {
        notNull: {
            loanAmount: 'number',
            balance: 'number',
            usage: 'string',
            interestRate: 'number'
        },
        nullable: {
            guarantorRef: 'string'
        }
    }
};

export const allowedEdgeProperties: Record<edgeLabelTypes, Record<boolKeys, Record<string, dataTypes>>> = {
    // TODO
}

// Policy Types - and Mapping to the corresponding label type
export const policyValues = ['ADD_WINS', 'REMOVE_WINS'];

export function MatchPolicyToLabelType(label: labelTypes): Policy {
    switch (label) {
        case 'Loan':
            return 'ADD_WINS';
        case 'Account':
            return 'REMOVE_WINS';
        case 'Medium':
            return 'ADD_WINS';
        case 'Person':
            return 'REMOVE_WINS';
        case 'Company':
            return 'ADD_WINS';
        default:
            throw new Error('Invalid label type');
    }
}