import { useState, useEffect, useCallback } from 'react';
import { getVisibleNodes, updateNode, deleteNode, addNode } from '../../Version1/V2_idea/SimpleGraph';

// if no position random
const getRandomPos = () => ({ x: Math.random() * 500, y: Math.random() * 500 });

export function useYjsGraph(graph) {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]); // not implemented yet

  const syncNodes = useCallback(() => {
    const rawNodes = getVisibleNodes({ graph });
    
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

  useEffect(() => {
    const nodesMap = graph.getMap('nodes');
    const propertiesMap = graph.getMap('properties');
    const tombNodes = graph.getMap('removedNodes');


    syncNodes();

    const observer = () => syncNodes();
    
    nodesMap.observe(observer);
    propertiesMap.observe(observer);
    tombNodes.observe(observer);

    return () => {
      nodesMap.unobserve(observer);
      propertiesMap.unobserve(observer);
      tombNodes.unobserve(observer);
    };
  }, [graph, syncNodes]);

  // Wrapper für Node-Changes durch React Flow (Dragging)
  const onNodesChange = useCallback((changes) => {
    changes.forEach((change) => {
      if (change.type === 'position' && change.position) {
        updateNode({
            id: change.id,
            props: { x: change.position.x, y: change.position.y },
            graph
        });
      }
    });
  }, [graph]);

  return { nodes, edges, onNodesChange };
}