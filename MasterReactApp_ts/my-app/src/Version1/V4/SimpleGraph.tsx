import * as Y from 'yjs'
import { Graph, graphDoc } from '../../Helper/types/graph';
import { NodeId, EdgeId, EdgeData, Policy, NodeData, edgeLabelTypes } from '../../Helper/types/types';


// const ydoc = new Y.Doc()

// const ydoc = new Y.Doc() // Represents the collaborative graph | TOP LEVEL
// const nodesMap = ydoc.getMap('nodes') // Map of nodeId to touch timestamps and removed node information
// const propertiesMap = ydoc.getMap('properties') // Map of nodeId to node properties
// const edgesTargetsMap = ydoc.getMap('edgesTargets') // Map of nodeId to EdgeYJSMap [target maps to EdgeMap]
// const edgesMap = inside edgesTargetsMap // Map of target to EdgeProperties

export class SGraphV4 implements Graph {
  addNode({ nodeId, initialProps, graph }: { nodeId: NodeId; initialProps: Partial<NodeData>; graph: graphDoc; }): void {
    const nodesMap = graph.getMap<any>('nodes');
    const propertiesMap = graph.getMap<Y.Map<any>>('properties');
  
    const nodeProps = new Y.Map();

  for (const [key, value] of Object.entries(initialProps)) {
    nodeProps.set(key, value);
  }
  
  graph.transact(() => {
    nodesMap.set(nodeId, Date.now());
    propertiesMap.set(nodeId, nodeProps);
  });
  }

  updateNode({ nodeId, props, graph }: { nodeId: NodeId; props: Partial<NodeData>; graph: graphDoc; }): void {
    const nodesMap = graph.getMap<any>('nodes');
    const propertiesMap = graph.getMap<Y.Map<any>>('properties');
    const nodeProps = propertiesMap.get(nodeId) || new Y.Map();

    graph.transact(() => {
      for (const [k, v] of Object.entries(props)) {
      nodeProps.set(k, v);
      nodesMap.set(nodeId, Date.now());
    }});
  }

  deleteNode({ nodeId, graph }: { nodeId: NodeId; graph: graphDoc; }): void {
  const nodesMap = graph.getMap<any>('nodes')
  const propertiesMap = graph.getMap<Y.Map<any>>('properties')
  const node = propertiesMap.get(nodeId);

  if (!node) return;

  const policy = node.get('policy');
  
  graph.transact(() => {
    if (policy === 'REMOVE_WINS') {

      nodesMap.set(nodeId, { removed: true });
      propertiesMap.delete(nodeId);
      
    } else if (policy === 'ADD_WINS') {

      nodesMap.delete(nodeId);
    }
  });
  }
  getVisibleNodes({ graph }: { graph: graphDoc; }): Array<{ id: NodeId; props: NodeData; policy: Policy; }> {
  const nodesMap = graph.getMap<any>('nodes')
  const propertiesMap = graph.getMap<Y.Map<any>>('properties')
  const visible: any[] = [];
  
  nodesMap.forEach((node: any , id: NodeId) => {
    if (!propertiesMap.has(id) && !node.removed) {
      console.error(`Node properties missing for node id: ${id}`);
      return;
    }
    const props = propertiesMap.get(id);
    if (!props) return;
    const policy = props.get('policy');

    if (policy === 'REMOVE_WINS') {
      if (node.removed) {
        return;
      }
    }
      visible.push({ id, ...props.toJSON(), policy });
  });
  
  return visible;
  }
  getNodeProps({ nodeId, graph }: { nodeId: NodeId; graph: graphDoc; }): NodeData | undefined {
    const propertiesMap = graph.getMap<Y.Map<any>>('properties');
    const props = propertiesMap.get(nodeId);
    return props ? props.toJSON() as NodeData : undefined;
  }
  addEdge({ sourceId, targetId, label, initialProps = { label: 'Has', placeholder: 'New Edge' }, graph }: { sourceId: NodeId; targetId: NodeId; label: edgeLabelTypes; initialProps?: EdgeData; graph: graphDoc; }): void {
    const edgesTargetsMap = graph.getMap<any>('edgesTargets');
    const nodesMap = graph.getMap<any>('nodes');

    
    graph.transact(() => {
      let edgesMap = edgesTargetsMap.get(sourceId);
      if (!edgesMap) {
        edgesMap = new Y.Map();
        edgesTargetsMap.set(sourceId, edgesMap);
      }

      let specificTargetEdgesMap = edgesMap.get(targetId);
      if (!specificTargetEdgesMap) {
        specificTargetEdgesMap = new Y.Map();
        edgesMap.set(targetId, specificTargetEdgesMap);
      }
      
      const edgeProps = new Y.Map<any>();
      for (const [key, value] of Object.entries(initialProps)) {
        edgeProps.set(key, value);
      }
      specificTargetEdgesMap.set(targetId, edgeProps);
      // touch operation on both nodes as if they were updated
      nodesMap.set(sourceId, Date.now());
      nodesMap.set(targetId, Date.now());
    }); 
  }
  updateEdge({ sourceId, targetId, props, graph }: { sourceId: NodeId; targetId: NodeId; props: Partial<EdgeData>; graph: graphDoc; }): void {
    throw new Error('Method not implemented.');
  }
  deleteEdge({ sourceId, targetId, graph }: { sourceId: NodeId; targetId: NodeId; graph: graphDoc; }): void {
  const edgesMap = graph.getMap<Y.Map<Y.Map<any>>>('edgesTargets')
  const edgeMap = edgesMap.get(sourceId);
  if (!edgeMap) {
    console.error(`Edge map for sourceId ${sourceId} does not exist.`);
    return;
  }
  edgeMap.delete(targetId);
  }
  getEdges({ graph }: { graph: graphDoc; }): Array<{ sourceId: NodeId; targetId: NodeId; props: EdgeData; }> {
  const edgesTargetsMap = graph.getMap<Y.Map<Y.Map<any>>>('edgesTargets');
  const nodesMap = graph.getMap<any>('nodes');
  const edges: any[] = [];
  for (let sourceId of Array.from(nodesMap.keys())) {
    const edgeMap = edgesTargetsMap.get(sourceId);
    if (!edgeMap) {
      console.log("No edge targets map for sourceId:", sourceId);
      continue;
    }
    edgesTargetsMap.forEach((edgeMap, sourceId) => {
      edgeMap.forEach((props, targetId) => {
        edges.push({ sourceId, targetId, ...props.toJSON() as EdgeData });
      });
    })
  }
  return edges;
  }
}
