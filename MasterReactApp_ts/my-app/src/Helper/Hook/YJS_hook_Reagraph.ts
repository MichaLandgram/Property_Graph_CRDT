import { useState, useEffect, useCallback } from 'react';
import { v4 as uuid } from 'uuid';
// import { SGraphV4 as GraphInstance } from '../../Version1/V4/SimpleGraph';
import { SchemaGraph as GraphInstance } from '../../Version2_Schema_Introduced/V1/SchemaGraph';
import { processEdgeCurvatures } from '../Vizuals/GraphUtils';
import * as Y from 'yjs';

// Reagraph types (inferred, as we don't have exact types yet)
export interface ReagraphNode {
  id: string;
  label?: string;
  [key: string]: any;
}

export interface ReagraphEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  curvature?: number;
  [key: string]: any;
}

const graphInstance = new GraphInstance();

export function useYjsGraphReagraph(graph: Y.Doc) {
  const [nodes, setNodes] = useState<ReagraphNode[]>([]);
  const [edges, setEdges] = useState<ReagraphEdge[]>([]);

  const syncNodes = useCallback(() => {
    const rawNodes = graphInstance.getVisibleNodes({ graph });
    
    const reagraphNodes: ReagraphNode[] = rawNodes.map((node: any) => ({
      id: node.id,
      label: node.label || node.id,
      data: { ...node } // Keep original data in 'data' field
    }));

    setNodes(reagraphNodes);
  }, [graph]);

  const syncEdges = useCallback(() => {
    const rawEdges = graphInstance.getEdges({ graph });
    const rawNodes = graphInstance.getVisibleNodes({ graph }); // Get current nodes to validate edges
    const validNodeIds = new Set(rawNodes.map((n: any) => n.id));

    const tempEdges: ReagraphEdge[] = rawEdges
      .filter((edge: any) => validNodeIds.has(edge.sourceId) && validNodeIds.has(edge.targetId)) // Filter dangling edges
      .map((edge: any) => ({
        id: edge.id || uuid(),
        source: edge.sourceId,
        target: edge.targetId,
        label: edge.label || '',
        data: { ...edge }
      }));

    // Use the utility to process curvatures for all edge types (parallel, bidirectional)
    const finalEdges = processEdgeCurvatures(tempEdges);

    setEdges(finalEdges);
  }, [graph]);

  useEffect(() => {
    const nodesMap = graph.getMap('nodes');
    const propertiesMap = graph.getMap('properties');
    const tombNodes = graph.getMap('removedNodes'); // Assuming this is correct from context, though not explicitly checked, but keeping as is
    const edgesMap = graph.getMap('edgesTargets'); // FIXED: Observe edgesTargets instead of edges

    syncNodes();
    syncEdges();

    const observer = () => {
      syncNodes();
      syncEdges();
    };
    
    nodesMap.observe(observer);
    propertiesMap.observe(observer);
    tombNodes.observe(observer);
    edgesMap.observeDeep(observer);

    return () => {
      nodesMap.unobserve(observer);
      propertiesMap.unobserve(observer);
      tombNodes.unobserve(observer);
      edgesMap.unobserveDeep(observer);
    };
  }, [graph, syncNodes, syncEdges]);

  return { nodes, edges };
}
