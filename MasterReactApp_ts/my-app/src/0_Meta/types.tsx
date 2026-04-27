// Unique Identifiers for Nodes and Edges
export type NodeId = string;
export type EdgeId = string;
// Policy Types - and Mapping to the corresponding label type - REMOVE_WINS is not only included for downwards compatibility
export type Policy = "ADD_WINS" | "OBSERVED_REMOVE" | "REMOVE_WINS";

// Property Types 
export type NodeProps = Record<string, any>;
export type EdgeProps = Record<string, any>;

// Visible Node and Edge Types (only the data that is needed for the visualization)
export type VisibleNode = {
    id: NodeId;
    type: string;
    label?: string[];
    policy: Policy;
    color?: string;
    props: NodeProps;
};

export type VisibleEdge = {
    id: EdgeId;
    type: string;
    sourceId: NodeId;
    targetId: NodeId;
    props: EdgeProps;
};



export type PrimitiveData = 'string' | 'number' | 'boolean' | 'date';
export type YArrayType = { kind: 'yarray'; element: PrimitiveData | YMapType | YArrayType, ref: string };
export type YMapType   = { kind: 'ymap'; value: PrimitiveData | YMapType | YArrayType, ref: string };
export type YCounter  = { kind: 'counter' };
export type Vector = { size: number; };
export type Point = { dimensions: number[]; };

export type dataTypes =
    | PrimitiveData
    // | YArrayType
    // | YMapType
    // | YCounter
    // | Vector
    // | Point

export interface PropertyLensMap {
    value: dataTypes;  // Current target data type -> e.g., 'number', 'boolean'
    default: any;     // Default value if no transformerMap is found
    transformerMap?: Record<string, string>; // The automated mapping dictionary e.g.: { "sad": "0", "happy": "10", "default": "-1" }
}

export type whatType = "NodeType" | "RelationshipType";

export type defaultVal = {
    default: number | string | boolean | Date;
    transformerMap?: Record<string, string>;
}








/* 
*
* OLD TYPES - DEPRECATED - DO NOT USE mainly to be able to use the first IDEAS
* 
*/
export type XYPosition = {
    x: number;
    y: number;
};

export type AlwaysNodeData = {
    id: NodeId;
    label: string;
    policy: Policy;
    position: XYPosition; //currently only needed in GraphViz V1
    color: string;
}

export type labelTypes = string;
export type edgeLabelTypes = string;

// Edge Types
export type EdgeData = {
    placeholder: string;
    label: edgeLabelTypes;
}

export type boolKeys = "notNull" | "nullable";

export type addUpdateTag = "add" | "update";

export type edgeNodeToken = "Node" | "Edge";

export type AllowedConnectivity = Record<labelTypes, Record<labelTypes, edgeLabelTypes[]>>;

export type AllowedNodeProperties = Record<labelTypes, Record<boolKeys, Record<string, dataTypes>>>;


