// Node Types
import * as Y from 'yjs';
export type NodeId = string;
export type Policy = 'ADD_WINS' | 'REMOVE_WINS';
export type labelTypes = 'Doctor' | 'Patient' | 'Medicine' | 'Disease';
export type edgeLabelTypes = 'Treats' | 'Has' | 'Causes';
export type edgeLabelData = Y.Map<EdgeData>;
export type edgeTargets = Y.Map<edgeLabelData>;


export type XYPosition = {
    x: number;
    y: number;
};

export type NodeData = {
    id: NodeId;
    label: labelTypes;
    policy: Policy;
    position: XYPosition;
    color: string;

    TESTDATA1: string;
    TESTDATA2: string;
    TESTDATA3: string;
}

// Edge Types
export type EdgeData = {
    placeholder: string;
    label: edgeLabelTypes;
}

export type EdgeId = `${NodeId}+${NodeId}`