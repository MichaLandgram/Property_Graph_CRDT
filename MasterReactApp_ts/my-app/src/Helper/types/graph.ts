import { NodeId, EdgeId } from './types';
import { NodeData } from './node';
import * as Y from 'yjs';


export type graphDoc = Y.Doc;
export interface Graph {
    addNode(nodeId: NodeId, initialProps: NodeData, graph: graphDoc): void;
    updateNode(nodeId: NodeId, props: Partial<NodeData>, graph: graphDoc): void;
    deleteNode(nodeId: NodeId, graph: graphDoc): void;
}