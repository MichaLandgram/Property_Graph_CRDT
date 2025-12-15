// Node Types
import * as Y from 'yjs';
import { Policy, labelTypes, edgeLabelTypes } from '../Helper/types/types';


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
};


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
            return 'ADD_WINS';
    }
}