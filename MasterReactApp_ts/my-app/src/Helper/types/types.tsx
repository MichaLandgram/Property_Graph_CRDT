// Node Types
export type NodeId = string;
export type Policy = 'ADD_WINS' | 'REMOVE_WINS';
export type labelTypes = 'Doctor' | 'Patient' | 'Medicine' | 'Disease';


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
    label?: string;
}

export type EdgeId = `${NodeId}+${NodeId}`