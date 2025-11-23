import { NodeId, Policy, XYPosition } from './types';



export type NodeData = {
    id: NodeId;
    label: string;
    policy: Policy;
    position: XYPosition;
}