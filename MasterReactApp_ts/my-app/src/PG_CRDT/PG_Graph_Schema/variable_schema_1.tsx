import { Policy, dataTypes, labelTypes, edgeLabelTypes, boolKeys, AllowedConnectivity, AllowedNodeProperties } from "../../Helper/types_interfaces/types";
import { Schema_1 as SchemaInstance } from "./schema_1";
import * as Y from 'yjs';


const Schema = new SchemaInstance();
const labelTypeValues = Schema.labelTypeValues;
const edgeLabelTypeValues = Schema.edgeLabelTypeValues;
const initialAllowedConnectivity = Schema.allowedConnectivity;
const initialAllowedNodeProperties = Schema.allowedNodePropeerties;
const getInitialPolicy = Schema.matchPolicyToLabelType;

export class CollaborativeSchema {
    doc: Y.Doc;
    allowedConnectivity: Y.Map<Y.Map<Y.Array<edgeLabelTypes>>>;
    allowedNodeProperties: Y.Map<Y.Map<Y.Map<dataTypes | Y.Array<dataTypes>>>>;
    labelTypes: Y.Array<labelTypes>;
    edgeLabelTypes: Y.Array<edgeLabelTypes>;
    policyMapping: Y.Map<Policy>;

    constructor(doc: Y.Doc) {
        this.doc = doc;
        this.allowedConnectivity = doc.getMap('allowedConnectivity');
        this.allowedNodeProperties = doc.getMap('allowedNodeProperties');
        this.labelTypes = doc.getArray('labelTypes');
        this.edgeLabelTypes = doc.getArray('edgeLabelTypes');
        this.policyMapping = doc.getMap('policyMapping');

        this.init();
    }

    private init() {
        this.doc.transact(() => {
            if (this.allowedConnectivity.size === 0) {
                this.initializeAllowedConnectivity();
            }
            if (this.allowedNodeProperties.size === 0) {
                this.initializeAllowedNodeProperties();
            }
            if (this.labelTypes.length === 0) {
                this.labelTypes.push(labelTypeValues);
            }
            if (this.edgeLabelTypes.length === 0) {
                this.edgeLabelTypes.push(edgeLabelTypeValues);
            }
            if (this.policyMapping.size === 0) {
                labelTypeValues.forEach(label => {
                    this.policyMapping.set(label, getInitialPolicy(label));
                });
            }
        });
    }

    private initializeAllowedConnectivity() {
        Object.entries(initialAllowedConnectivity).forEach(([source, targets]) => {
            const targetMap = new Y.Map<Y.Array<string>>();
            Object.entries(targets).forEach(([target, edges]) => {
                const edgeArray = new Y.Array<string>();
                edgeArray.push(edges);
                targetMap.set(target, edgeArray);
            });
            this.allowedConnectivity.set(source, targetMap);
        });
    }

    private initializeAllowedNodeProperties() {
        Object.entries(initialAllowedNodeProperties).forEach(([label, props]) => {
            const boolKeyMap = new Y.Map<Y.Map<any>>();
            Object.entries(props).forEach(([boolKey, properties]) => {
                const propMap = new Y.Map<any>();
                Object.entries(properties).forEach(([propName, propType]) => {
                    if (Array.isArray(propType)) {
                        const typeArray = new Y.Array<string>();
                        typeArray.push(propType as string[]);
                        propMap.set(propName, typeArray);
                    } else {
                        propMap.set(propName, propType);
                    }
                });
                boolKeyMap.set(boolKey, propMap);
            });
            this.allowedNodeProperties.set(label, boolKeyMap);
        });
    }

    getAllowedConnectivity(): AllowedConnectivity {
        return this.allowedConnectivity.toJSON() as AllowedConnectivity;
    }

    getAllowedNodeProperties(): AllowedNodeProperties {
        return this.allowedNodeProperties.toJSON() as AllowedNodeProperties;
    }

    getLabelTypes(): string[] {
        return this.labelTypes.toArray();
    }

    getEdgeLabelTypes(): string[] {
        return this.edgeLabelTypes.toArray();
    }

    getPolicy(label: string): Policy {
        return this.policyMapping.get(label) || 'ADD_WINS'; // Default fall back
    }

    // Helper methods for modification
    addAllowedEdge(source: string, target: string, edgeType: string) {
        this.doc.transact(() => {
            if (!this.allowedConnectivity.has(source)) {
                this.allowedConnectivity.set(source, new Y.Map<Y.Array<string>>());
            }
            const targetMap = this.allowedConnectivity.get(source)!;
            
            if (!targetMap.has(target)) {
                targetMap.set(target, new Y.Array<string>());
            }
            const edgeArray = targetMap.get(target)!;
            
            if (!edgeArray.toArray().includes(edgeType)) {
                edgeArray.push([edgeType]);
            }
        });
    }

    addAllowedNodeProperty(label: string, boolKey: 'notNull' | 'nullable', propName: string, propType: dataTypes ) {
        this.doc.transact(() => {
            if (!this.allowedNodeProperties.has(label)) {
                this.allowedNodeProperties.set(label, new Y.Map<Y.Map<any>>());
            }
            const boolMap = this.allowedNodeProperties.get(label)!;
            
            if (!boolMap.has(boolKey)) {
                boolMap.set(boolKey, new Y.Map<any>());
            }
            const propMap = boolMap.get(boolKey)!;
            
            if (Array.isArray(propType)) {
                const typeArray = new Y.Array<dataTypes>();
                typeArray.push(propType);
                propMap.set(propName, typeArray);
            } else {
                propMap.set(propName, propType);
            }
        });
    }

    addLabelType(label: string, defaultPolicy: Policy = 'ADD_WINS') {
        this.doc.transact(() => {
             if (!this.labelTypes.toArray().includes(label)) {
                 this.labelTypes.push([label]);
             }
             if (!this.policyMapping.has(label)) {
                 this.policyMapping.set(label, defaultPolicy);
             }
        });
    }

    addEdgeLabelType(label: string) {
        this.doc.transact(() => {
             if (!this.edgeLabelTypes.toArray().includes(label)) {
                 this.edgeLabelTypes.push([label]);
             }
        });
    }
    
    setPolicy(label: string, policy: Policy) {
        this.policyMapping.set(label, policy);
    }
}


export const edgeTypeCardinality: Record<edgeLabelTypes, Record<labelTypes, Record<labelTypes, number>>> = {
    // TODO
}


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