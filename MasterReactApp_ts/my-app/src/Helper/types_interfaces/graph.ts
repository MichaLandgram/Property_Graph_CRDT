import { NodeId, 
        EdgeId, 
        EdgeData, 
        Policy, 
        AlwaysNodeData, 
        edgeLabelTypes, 
        labelTypes, 
        boolKeys, 
        edgeNodeToken } from './types';
import * as Y from 'yjs';


export type graphDoc = Y.Doc;
export interface Graph {
    hasSchema : boolean;
    isSchemaCorrect(graph: graphDoc): boolean;
    testLabel(label: labelTypes | edgeLabelTypes, edgeNodeToken: edgeNodeToken): void;
    testProps(incoming: any, label: labelTypes | edgeLabelTypes, boolKey: boolKeys, edgeNodeToken: edgeNodeToken): void;

    addNode({alwaysProps, initialProps, graph}: {alwaysProps: Partial<AlwaysNodeData>, initialProps: any, graph: graphDoc}): void;
    updateNode({nodeId, props, graph}: {nodeId: NodeId, props: any, graph: graphDoc}): void;
    deleteNode({nodeId, graph}: {nodeId: NodeId, graph: graphDoc}): void;

    getVisibleNodes({ graph }: { graph: graphDoc}): Array<{ id: NodeId; props: any }>;
    getNodeProps({ nodeId, graph }: { nodeId: NodeId; graph: graphDoc}): any | undefined;

    addEdge({ sourceId, targetId, label, initialProps, graph, edgeId }: { sourceId: NodeId; targetId: NodeId; label: edgeLabelTypes; initialProps?: EdgeData; graph: graphDoc; edgeId?: EdgeId}): void;
    updateEdge({ edgeId, props, graph }: { edgeId: EdgeId; props: Partial<EdgeData>; graph: graphDoc}): void;
    deleteEdge({ edgeId, graph }: { edgeId: EdgeId; graph: graphDoc}): void;

    getEdges({ graph }: { graph: graphDoc}): Array<{ sourceId: NodeId; targetId: NodeId; props: EdgeData }>;

}
