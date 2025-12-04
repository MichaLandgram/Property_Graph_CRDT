import { useState, useEffect, useCallback } from 'react';
import { SGraphV4 } from '../../Version1/V4/SimpleGraph';
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

const graphInstance = new SGraphV4();

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

    const tempEdges: ReagraphEdge[] = rawEdges.map((edge: any) => ({
      id: edge.id || `edge-${edge.sourceId}-${edge.targetId}`,
      source: edge.sourceId,
      target: edge.targetId,
      label: edge.label || '',
      data: { ...edge }
    }));

    // Detect bidirectional edges and apply curvature
    for (let i = 0; i < tempEdges.length; i++) {
      for (let j = i + 1; j < tempEdges.length; j++) {
        const e1 = tempEdges[i];
        const e2 = tempEdges[j];
        console.log(e1, e2);
        if (e1.source === e2.target && e1.target === e2.source) {
          // Found a bidirectional pair
          e1.curvature = 1.0;
          e2.curvature = 1.0;
        }
      }
    }

    setEdges(tempEdges);
  }, [graph]);

  useEffect(() => {
    const nodesMap = graph.getMap('nodes');
    const propertiesMap = graph.getMap('properties');
    const tombNodes = graph.getMap('removedNodes');
    const edgesMap = graph.getMap('edges');

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
