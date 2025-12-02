export type NodeId = string;
export type Policy = 'ADD_WINS' | 'REMOVE_WINS';
export type EdgeId = `${NodeId}+${NodeId}`
export type EdgeData = {
    label?: string;
}


export type XYPosition = {
    x: number;
    y: number;
};

export type NodeData = {
    id: NodeId;
    label: string;
    policy: Policy;
    position: XYPosition;
}