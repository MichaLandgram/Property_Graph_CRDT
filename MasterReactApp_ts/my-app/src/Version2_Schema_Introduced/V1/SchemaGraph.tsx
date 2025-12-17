import * as Y from 'yjs'
import { Graph, graphDoc } from '../../Helper/types_interfaces/graph';
import { NodeId, EdgeId, EdgeData, Policy, AlwaysNodeData, edgeLabelTypes, labelTypes, boolKeys } from '../../Helper/types_interfaces/types';
import {
  allowedNodePropeerties,
  allowedEdgeProperties,
} from '../../Schema/schema_1';
/* This is a SCHEMA_LESS APPROACH TO A GRAPH BASED ON YJS */
// const ydoc = new Y.Doc()

// const ydoc = new Y.Doc() // Represents the collaborative graph | TOP LEVEL
// const nodesMap = ydoc.getMap('nodes') // Map of nodeId to touch timestamps and removed node information
// const propertiesMap = ydoc.getMap('properties') // Map of nodeId to node properties
// const edgesTargetsMap = ydoc.getMap('edgesTargets') // Map of nodeId to EdgeYJSMap [target maps to EdgeMap]
// const edgesMap = inside edgesTargetsMap // Map of target to EdgeProperties

export class SchemaGraph implements Graph {
  hasSchema : boolean = true;
  isSchemaCorrect(graph: graphDoc): boolean {
    throw new Error('Method not implemented.');
  }
  testProps(incoming: any, label: labelTypes | edgeLabelTypes, boolKey: boolKeys): void {
    if (boolKey === 'notNull') {
      Object.entries(allowedNodePropeerties[label]['notNull']).forEach(([key, value]) => {
        if (incoming[key] === null || incoming[key] === undefined) {
          throw new Error(`Property ${key} is null or undefined but has to be included`);
        } else if (typeof incoming[key] !== value) {
          throw new Error(`Property ${key} has to be of type ${value}`);
        }
      });
    } else if (boolKey === 'nullable') {
      Object.entries(allowedNodePropeerties[label]['nullable']).forEach(([key, value]) => {
        if (incoming[key] === null || incoming[key] === undefined) {
          return; // Property is nullable, so it can be null or undefined
        } else if (typeof incoming[key] !== value) {
          throw new Error(`Property ${key} has to be of type ${value}`);
        }
      });
    }
  }
  addNode({ alwaysProps, initialProps, graph }: { alwaysProps: AlwaysNodeData; initialProps: any; graph: graphDoc; }): void {
    try {
      if (alwaysProps.label === null || alwaysProps.label === undefined) {
        throw new Error('Label is null or undefined but has to be included');
      }
      const nodesMap = graph.getMap<any>('nodes');
      const propertiesMap = graph.getMap<Y.Map<any>>('properties');

      this.testProps(alwaysProps, alwaysProps.label, 'notNull');
      this.testProps(initialProps, alwaysProps.label, 'nullable');

      const nodeProps = new Y.Map();
      for (const [key, value] of Object.entries(alwaysProps)) {
        nodeProps.set(key, value);
      }
      for (const [key, value] of Object.entries(initialProps)) {
        nodeProps.set(key, value);
      }
      
      graph.transact(() => {
        nodesMap.set(alwaysProps.id, Date.now());
        propertiesMap.set(alwaysProps.id, nodeProps);
      });
    } catch (error) {
        throw error;
    }
  }

  updateNode({ nodeId, props, graph }: { nodeId: NodeId; props: any; graph: graphDoc; }): void {
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
  getVisibleNodes({ graph }: { graph: graphDoc; }): Array<{ id: NodeId; props: any; policy: Policy; }> {
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
  getNodeProps({ nodeId, graph }: { nodeId: NodeId; graph: graphDoc; }): any | undefined {
    const propertiesMap = graph.getMap<Y.Map<any>>('properties');
    const props = propertiesMap.get(nodeId);
    return props ? props.toJSON() as any : undefined;
  }
  addEdge({ sourceId, targetId, label, initialProps = { label: 'Has', placeholder: 'New Edge' }, graph }: { sourceId: NodeId; targetId: NodeId; label: edgeLabelTypes; initialProps?: EdgeData; graph: graphDoc; }): void {
    const edgesTargetsMap = graph.getMap<Y.Map<Y.Array<any>>>('edgesTargets');
    const nodesMap = graph.getMap<any>('nodes');

    
    graph.transact(() => {
      let edgesMap = edgesTargetsMap.get(sourceId);
      if (!edgesMap) {
        edgesMap = new Y.Map();
        edgesTargetsMap.set(sourceId, edgesMap);
      }

      let specificTargetEdgesArray = edgesMap.get(targetId);
      if (!specificTargetEdgesArray) {
        specificTargetEdgesArray = new Y.Array();
        edgesMap.set(targetId, specificTargetEdgesArray);
      }
      
      const edgeProps = new Y.Map<any>();
      for (const [key, value] of Object.entries(initialProps)) {
        console.log(key, value);
        edgeProps.set(key, value);
      }
      specificTargetEdgesArray.push([edgeProps]);
      // touch operation on both nodes as if they were updated
      nodesMap.set(sourceId, Date.now());
      nodesMap.set(targetId, Date.now());
    }); 
  }
  updateEdge({ sourceId, targetId, props, graph }: { sourceId: NodeId; targetId: NodeId; props: Partial<EdgeData>; graph: graphDoc; }): void {
    throw new Error('Method not implemented.');
  }
  deleteEdge({ sourceId, targetId, graph }: { sourceId: NodeId; targetId: NodeId; graph: graphDoc; }): void {
  const edgesMap = graph.getMap<Y.Map<Y.Array<any>>>('edgesTargets')
  const edgeMap = edgesMap.get(sourceId);
  if (!edgeMap) {
    console.error(`Edge map for sourceId ${sourceId} does not exist.`);
    return;
  }
  edgeMap.delete(targetId);
  }
  getEdges({ graph }: { graph: graphDoc; }): Array<{ sourceId: NodeId; targetId: NodeId; props: EdgeData; }> {
  const edgesTargetsMap = graph.getMap<Y.Map<Y.Array<any>>>('edgesTargets');
  const nodesMap = graph.getMap<any>('nodes');
  const edges: any[] = [];
  for (let sourceId of Array.from(nodesMap.keys())) {
    const edgeMap = edgesTargetsMap.get(sourceId);
    if (!edgeMap) {
      // console.log("No edge targets map for sourceId:", sourceId);
      continue;
    }
    
    for (const targetId of Array.from(edgeMap.keys())) {
        const edgeList = edgeMap.get(targetId);
        if (edgeList) {
            edgeList.forEach((edgeProps: any) => {
                 edges.push({ sourceId, targetId, ...edgeProps.toJSON() as EdgeData });
            });
        }
    }
  }
  return edges;
  }
}
