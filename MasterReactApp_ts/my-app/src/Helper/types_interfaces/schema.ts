import { Policy, labelTypes, edgeLabelTypes, dataTypes, boolKeys } from '../types_interfaces/types';

export interface Schema_Interface {
    labelTypeValues: labelTypes[];
    edgeLabelTypeValues: edgeLabelTypes[];
    allowedConnectivity: Record<labelTypes, Record<labelTypes, edgeLabelTypes[]>>;
    allowedNodePropeerties: Record<labelTypes, Record<boolKeys, Record<string, dataTypes>>>;
    edgeTypeCardinality: Record<edgeLabelTypes, Record<labelTypes, Record<labelTypes, number>>>;
    allowedEdgeProperties: Record<edgeLabelTypes, Record<boolKeys, Record<string, dataTypes>>>;
    policyValues: Policy[];
    matchPolicyToLabelType(label: labelTypes): Policy;
}