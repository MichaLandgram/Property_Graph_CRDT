// Node Types
import * as Y from 'yjs';



export type NodeId = string;


// Node Types
export type labelTypes = string;

// Edge Types - need to be consistent with edgeLabelTypeValues
export type edgeLabelTypes = string;

export type dataTypes = string | number | boolean | Array<dataTypes> | Date | Map<string, dataTypes> | Vector | Point;

export type Vector = {
    dimensions: number;
    datatype: 'number' | 'float32' | 'float64';
    values: number[];
};

export type Point = {
    x: number;
    y: number;
    z?: number;
};

// Policy Types - and Mapping to the corresponding label type
export type Policy = string;

export type edgeLabelData = Y.Map<EdgeData>;
export type edgeTargets = Y.Map<edgeLabelData>;


export type XYPosition = {
    x: number;
    y: number;
};

export type AlwaysNodeData = {
    id: NodeId;
    label: string;
    policy: Policy;
    position: XYPosition;
    color: string;
}

// Edge Types
export type EdgeData = {
    placeholder: string;
    label: edgeLabelTypes;
}

export type EdgeId = `${NodeId}+${NodeId}`

/* Helper Types */
export type boolKeys = "notNull" | "nullable";