import { Schema_Interface } from '../Helper/types_interfaces/schema';
import { labelTypes, edgeLabelTypes, dataTypes, boolKeys, Policy } from '../Helper/types_interfaces/types';

export class Schema_1 implements Schema_Interface {
    labelTypeValues: labelTypes[] = ['Loan', 'Account', 'Medium', 'Person', 'Company'];
    edgeLabelTypeValues: edgeLabelTypes[] = ['transfer', 'withdraw', 'own', 'apply', 'invest', 'signIn', 'deposit', 'repay', 'guarantee', 'guarantorRef'];
    allowedConnectivity: Record<labelTypes, Record<labelTypes, edgeLabelTypes[]>> = {
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
    allowedNodePropeerties: Record<labelTypes, Record<boolKeys, Record<string, dataTypes>>> = {
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
                faceEmbedding: 'vector',
                languages: ['string']
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
                lastLoginLocation: 'point',
                prevPasswords: ['string']
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
                deviceInfo: 'map',
                location: 'point',
                loginCount: 'counter'
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
                headquarters: 'point',
                metadata: 'map'
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
    edgeTypeCardinality: Record<edgeLabelTypes, Record<labelTypes, Record<labelTypes, number>>> = {
        // TODO
    };
    allowedEdgeProperties: Record<edgeLabelTypes, Record<boolKeys, Record<string, dataTypes>>> = {
        Account: {
            notNull: {
                
            },
            nullable: {
                
            }
        },
        Medium: {
            notNull: {
                
            },
            nullable: {
                
            }
        },
        Company: {
            notNull: {
                
            },
            nullable: {
                
            }
        },
        Loan: {
            notNull: {
                
            },
            nullable: {
                
            }
        }
    };

    policyValues: Policy[] = ['ADD_WINS', 'REMOVE_WINS']

    matchPolicyToLabelType(label: labelTypes): Policy {
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
    
}