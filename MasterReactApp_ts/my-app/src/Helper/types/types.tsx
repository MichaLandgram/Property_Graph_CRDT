// Node Types
import * as Y from 'yjs';
export type NodeId = string;


// Node Types
export type labelTypes = string;

// Edge Types - need to be consistent with edgeLabelTypeValues
export type edgeLabelTypes = string;


// Policy Types - and Mapping to the corresponding label type
export type Policy = string;

export type edgeLabelData = Y.Map<EdgeData>;
export type edgeTargets = Y.Map<edgeLabelData>;


export type XYPosition = {
    x: number;
    y: number;
};

export type NodeData = {
    id: NodeId;
    label: string;
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