import exp from 'constants';
import * as Y from 'yjs';
// Node Id Type
export type NodeId = string;
// Node Label
export type labelTypes = string;

// Edge Label
export type edgeLabelTypes = string;

// Minimal interface for grow-only counters (matches Yjs counters we use)


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
    value: dataTypes;  // The target data type -> e.g., 'number', 'boolean'
    default?: any;     // Fallback value
    transformerMap?: Record<string, string>; // The automated mapping dictionary e.g.: { "sad": "0", "happy": "10", "default": "-1" }
}


// // Data Types
// export type dataTypes = 
//   | string 
//   | number 
//   | boolean 
//   | Date 
//   | Counter
//   | Y.Map<dataTypes>      // Add this
//   | Y.Array<dataTypes>;   // Add this
//   // | Vector 
//   // | Point;


// export type Point = {
//     x: number;
//     y: number;
//     z?: number;
// };

// Policy Types - and Mapping to the corresponding label type
export type Policy = "ADD_WINS" | "OBSERVED_REMOVE" | "REMOVE_WINS";




export type XYPosition = {
    x: number;
    y: number;
};

export type AlwaysNodeData = {
    id: NodeId;
    label: string;
    policy: Policy;
    position: XYPosition; // uses this for the position of the node - currently only needed in GraphViz V1
    color: string; // TODO: change this only for vizualization based on Policy 
}

// Edge Types
export type EdgeData = {
    placeholder: string;
    label: edgeLabelTypes;
}

export type EdgeId = `${NodeId}+${NodeId}`

/* Helper Types */
export type boolKeys = "notNull" | "nullable";

export type addUpdateTag = "add" | "update";

export type edgeNodeToken = "Node" | "Edge";

export type AllowedConnectivity = Record<labelTypes, Record<labelTypes, edgeLabelTypes[]>>;

export type AllowedNodeProperties = Record<labelTypes, Record<boolKeys, Record<string, dataTypes>>>;


export type whatToChange = "NodeType" | "RelationshipType";

export type defaultVal = {
    default: number | string | boolean | Date;
    transformerMap?: Record<string, string>;
}