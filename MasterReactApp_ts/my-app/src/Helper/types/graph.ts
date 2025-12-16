import { NodeId, EdgeId, EdgeData, Policy, AlwaysNodeData, edgeLabelTypes, labelTypes, boolKeys  } from './types';
import * as Y from 'yjs';


export type graphDoc = Y.Doc;
export interface Graph {
    hasSchema : boolean;
    isSchemaCorrect(graph: graphDoc): boolean;
    testProps(incoming: any, label: labelTypes | edgeLabelTypes, boolKey: boolKeys ): void;

    addNode({alwaysProps, initialProps, graph}: {alwaysProps: Partial<AlwaysNodeData>, initialProps: any, graph: graphDoc}): void;
    updateNode({nodeId, props, graph}: {nodeId: NodeId, props: any, graph: graphDoc}): void;
    deleteNode({nodeId, graph}: {nodeId: NodeId, graph: graphDoc}): void;

    getVisibleNodes({ graph }: { graph: graphDoc}): Array<{ id: NodeId; props: any, policy: Policy }>;
    getNodeProps({ nodeId, graph }: { nodeId: NodeId; graph: graphDoc}): any | undefined;

    addEdge({ sourceId, targetId, label, initialProps, graph }: { sourceId: NodeId; targetId: NodeId; label: edgeLabelTypes; initialProps?: EdgeData; graph: graphDoc}): void;
    updateEdge({ sourceId,targetId, props, graph }: { sourceId: NodeId; targetId: NodeId; props: Partial<EdgeData>; graph: graphDoc}): void;
    deleteEdge({ sourceId, targetId, graph }: { sourceId: NodeId; targetId: NodeId;  graph: graphDoc}): void;

    getEdges({ graph }: { graph: graphDoc}): Array<{ sourceId: NodeId; targetId: NodeId; props: EdgeData }>;

}