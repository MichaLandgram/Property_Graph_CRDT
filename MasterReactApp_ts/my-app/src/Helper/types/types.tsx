export type NodeId = string;
export type Policy = 'ADD_WINS' | 'REMOVE_WINS';
export type EdgeId = `${NodeId}+${NodeId}`


export type XYPosition = {
    x: number;
    y: number;
};