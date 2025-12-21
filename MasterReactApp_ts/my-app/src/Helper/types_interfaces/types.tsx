// Node Id Type
export type NodeId = string;
// Node Label
export type labelTypes = string;

// Edge Label
export type edgeLabelTypes = string;

// Data Types
export type dataTypes = string | number | boolean | Array<dataTypes> | Date | Map<string, dataTypes> | Counter // | Vector | Point;

export type Counter = {
    value: number;
}

export type Point = {
    x: number;
    y: number;
    z?: number;
};

// Policy Types - and Mapping to the corresponding label type
export type Policy = "ADD_WINS" | "REMOVE_WINS"




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

export type edgeNodeToken = "Node" | "Edge";

export type AllowedConnectivity = Record<labelTypes, Record<labelTypes, edgeLabelTypes[]>>;

export type AllowedNodeProperties = Record<labelTypes, Record<boolKeys, Record<string, dataTypes>>>;
