import { NodeId, EdgeId, EdgeData, Policy, NodeData } from './types';
import * as Y from 'yjs';


export type graphDoc = Y.Doc;
export interface Graph {
    addNode({nodeId, initialProps, graph}: {nodeId: NodeId, initialProps: NodeData, graph: graphDoc}): void;
    updateNode({nodeId, props, graph}: {nodeId: NodeId, props: Partial<NodeData>, graph: graphDoc}): void;
    deleteNode({nodeId, graph}: {nodeId: NodeId, graph: graphDoc}): void;

    getVisibleNodes({ graph }: { graph: graphDoc}): Array<{ id: NodeId; props: NodeData, policy: Policy }>;
    getNodeProps({ nodeId, graph }: { nodeId: NodeId; graph: graphDoc}): NodeData | undefined;

    addEdge({ sourceId, targetId, initialProps, graph }: { sourceId: NodeId; targetId: NodeId; initialProps?: EdgeData; graph: graphDoc}): void;
    updateEdge({ sourceId,targetId, props, graph }: { sourceId: NodeId; targetId: NodeId; props: Partial<EdgeData>; graph: graphDoc}): void;
    deleteEdge({ sourceId, targetId, graph }: { sourceId: NodeId; targetId: NodeId;  graph: graphDoc}): void;

    getEdges({ graph }: { graph: graphDoc}): Array<{ sourceId: NodeId; targetId: NodeId; props: EdgeData }>;

}