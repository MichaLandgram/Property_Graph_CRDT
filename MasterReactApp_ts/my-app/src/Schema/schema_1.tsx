import { Schema_Interface } from '../Helper/types_interfaces/schema';
import { labelTypes, edgeLabelTypes, dataTypes, boolKeys, Policy } from '../Helper/types_interfaces/types';

export class Schema_1 implements Schema_Interface {
    labelTypeValues: labelTypes[] = ['Loan', 'Account', 'Medium', 'Person', 'Company', 'TEST'];
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
        TEST: {
            notNull: {
                testString: 'string',
                testNumber: 'number',
                testBoolean: 'boolean',
                testDate: 'date',
                // YJS Types
                testCounter: { kind: 'counter' },
                testArray: { kind: 'yarray', element: 'string', ref: 'string' },
                testMap: { kind: 'ymap', value: 'string', ref: 'string' },
                // testPoint: 'point',
                // testVector: 'vector'
            },
            nullable: {
                anotherTestProp: 'number'
            }
        },
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
                faceEmbedding: { kind: 'yarray', element: 'number', ref: 'number' },
                languages: { kind: 'yarray', element: 'string', ref: 'string'}
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
                testcounter: { kind: 'counter' },
                phoneNumber: 'string',
                email: 'string',
                freqLoginType: 'string',
                lastLoginTime: 'date',
                accountLevel: 'string',
                lastLoginLocation: { dimensions: [0, 0] },
                prevPasswords: { kind: 'yarray', element: 'string', ref: 'string'}
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
                deviceInfo: { kind: 'ymap', value: 'string', ref: 'string'},
                location: { dimensions: [0, 0] },
                loginCount: { kind: 'counter'}
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
                headquarters: { dimensions: [0, 0] },
                metadata: { kind: 'ymap', value: 'string', ref: 'string'}
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


// TODO IDK?
// export function retru(label: labelTypes): string[] {
//     switch (label) {
//         case 'Medium':
//             return ['loginCount'];
//         default:
//             return [];
//     }
// }