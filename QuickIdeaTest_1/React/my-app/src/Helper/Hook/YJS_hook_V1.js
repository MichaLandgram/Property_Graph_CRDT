import { useState, useEffect, useCallback, useRef } from 'react';
import { getVisibleNodes, updateNode, getEdges, removeEdge, deleteNode, addNode, addEdge } from '../../Version1/V3_idea/SimpleGraph';

// if no position random
const getRandomPos = () => ({ x: Math.random() * 500, y: Math.random() * 500 });

export function useYjsGraph(graph) {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]); // not implemented yet

  const syncNodes = useCallback(() => {
    const rawNodes = getVisibleNodes({ graph });
    console.log("Raw Nodes:", rawNodes);
    
    const flowNodes = rawNodes.map((node) => ({
      id: node.id,
      type: 'databaseNode',
      position: { x: node.x || getRandomPos().x, y: node.y || getRandomPos().y },
      data: { 
        ...node,
        label: node.label || node.id 
      }, 
    }));

    setNodes(flowNodes);
  }, [graph]);

  const syncEdges = useCallback(() => {
    const rawEdges = getEdges({ graph });
    console.log("Raw Edges:", rawEdges);

    const flowEdges = rawEdges.map((edge) => ({
      id: edge.id || `edge-${edge.sourceId}-${edge.targetId}`,
      source: edge.sourceId,
      target: edge.targetId,
      type: 'default',
      animated: true,
      data: { ...edge }, 
    }));

    setEdges(flowEdges);
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

  const onNodesChange = useCallback((changes) => {
    changes.forEach((change) => {
      if (change.type === 'position' && change.position) {
        // Update directly to YJS
        // The error suppression in GraphEditor handles the ResizeObserver noise.
        updateNode({
            id: change.id,
            props: { x: change.position.x, y: change.position.y },
            graph
        });
      }
    });
  }, [graph]);


  const onEdgesChange = useCallback((changes) => {
    changes.forEach((change) => {
      if (change.type === 'add') {
        const newEdge = change.item;
        addEdge({
          sourceId: newEdge.source,
          targetId: newEdge.target,
          initialProps: {
            label: "Test",
            type: "relation"
          },
          graph
        });
      }
      if (change.type === 'remove') {
        const edge = edges.find(e => e.id === change.id);
        if (edge) {
          removeEdge({
            sourceId: edge.source,
            targetId: edge.target,
            graph
          });
        }
      }
    });
  }, [graph, edges]);

  return { nodes, edges, onNodesChange, onEdgesChange };
}