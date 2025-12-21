import * as Y from 'yjs'
import { Graph, graphDoc } from '../../Helper/types_interfaces/graph';
import { NodeId, 
          EdgeId, 
          EdgeData, 
          Policy, 
          AlwaysNodeData, 
          edgeLabelTypes, 
          labelTypes, 
          boolKeys, 
          edgeNodeToken
         } from '../../Helper/types_interfaces/types';
import { Schema_1 as SchemaInstance } from '../../Schema/schema_1';
import { GraphError } from '../../Helper/GraphError';
/* This is a SCHEMA_LESS APPROACH TO A GRAPH BASED ON YJS */
// const ydoc = new Y.Doc()

// const ydoc = new Y.Doc() // Represents the collaborative graph | TOP LEVEL
// const nodesMap = ydoc.getMap('nodes') // Map of nodeId to touch timestamps and removed node information
// const propertiesMap = ydoc.getMap('properties') // Map of nodeId to node properties
// const edgesTargetsMap = ydoc.getMap('edgesTargets') // Map of nodeId to EdgeYJSMap [target maps to EdgeMap]
// const edgesMap = inside edgesTargetsMap // Map of target to EdgeProperties

const schemaInstance = new SchemaInstance();

export class SchemaGraph implements Graph {
  hasSchema : boolean = true;
  isSchemaCorrect(graph: graphDoc): boolean {
    throw new Error('Method not implemented.');
  }
  testLabel(label: labelTypes | edgeLabelTypes, edgeNodeToken: edgeNodeToken): void {
    if (edgeNodeToken === 'Node' && !schemaInstance.labelTypeValues.includes(label)) {
      throw new GraphError(`Node Label ${label} is not allowed`);
    }
    if (edgeNodeToken === 'Edge' && !schemaInstance.edgeLabelTypeValues.includes(label)) {
      throw new GraphError(`Edge Label ${label} is not allowed`);
    }
  }
  testProps(incoming: any, label: labelTypes | edgeLabelTypes, boolKey: boolKeys, edgeNodeToken: edgeNodeToken): void {
    if (edgeNodeToken === 'Node') {
      if (boolKey === 'notNull') {
        // unsure if necessary keep it for now
        Object.entries(schemaInstance.allowedNodePropeerties[label]['notNull']).forEach(([key, value]) => {
          if (incoming[key] === null || incoming[key] === undefined) {
            throw new GraphError(`Property ${key} is null or undefined but has to be included`);
          } else if (typeof incoming[key] !== value) {
            throw new GraphError(`Property ${key} has to be of type ${value}`);
          }
        });
      } else if (boolKey === 'nullable') {
        Object.entries(schemaInstance.allowedNodePropeerties[label]['nullable']).forEach(([key, value]) => {
          if (incoming[key] === null || incoming[key] === undefined) {
            return; // Property is nullable, so it can be null or undefined
          } else if (typeof incoming[key] !== value) {
            throw new GraphError(`Property ${key} has to be of type ${value}`);
          }
        });
      }
    } else {
      if (boolKey === 'notNull') {
        Object.entries(schemaInstance.allowedEdgeProperties[label]['notNull']).forEach(([key, value]) => {
          // unsure if necessary keep it for now
          if (incoming[key] === null || incoming[key] === undefined) {
            throw new GraphError(`Property ${key} is null or undefined but has to be included`);
          } else if (typeof incoming[key] !== value) {
            throw new GraphError(`Property ${key} has to be of type ${value}`);
          }
        });
      } else if (boolKey === 'nullable') {
        Object.entries(schemaInstance.allowedEdgeProperties[label]['nullable']).forEach(([key, value]) => {
          if (incoming[key] === null || incoming[key] === undefined) {
            return; // Property is nullable, so it can be null or undefined
          } else if (typeof incoming[key] !== value) {
            throw new GraphError(`Property ${key} has to be of type ${value}`);
          }
        });
      }
    } 
  }
  testConnectivity({sourceId, targetId, edgeLabel, graph}: {sourceId: NodeId, targetId: NodeId, edgeLabel: edgeLabelTypes, graph: graphDoc}): void {
      const sourceNodeLabel = this.getNodeProps({nodeId: sourceId, graph}).label;
      const targetNodeLabel = this.getNodeProps({nodeId: targetId, graph}).label;
      // block connectivity betweem nodes overall based on the schema 
      if (!schemaInstance.allowedConnectivity[sourceNodeLabel][targetNodeLabel]) {
        throw new GraphError(`Connectivity between ${sourceNodeLabel} and ${targetNodeLabel} is not allowed`);
      }
      // block specific label-connections based on the schema
      if (!schemaInstance.allowedConnectivity[sourceNodeLabel][targetNodeLabel].includes(edgeLabel)) {
        throw new GraphError(`${edgeLabel} between ${sourceNodeLabel} and ${targetNodeLabel} is not allowed`);
      }
  }
  addNode({ alwaysProps, initialProps, graph }: { alwaysProps: AlwaysNodeData; initialProps: any; graph: graphDoc; }): void {
      const nodesMap = graph.getMap<any>('nodes');
      const propertiesMap = graph.getMap<Y.Map<any>>('properties');

      // not necessary to test because strictly typed
      // alwaysProps.label is always defined because of the type AlwaysNodeData
      // this.testProps(alwaysProps, alwaysProps.label, 'notNull');
      this.testLabel(alwaysProps.label, 'Node');
      this.testProps(initialProps, alwaysProps.label, 'nullable', 'Node');
      const allProps = {...alwaysProps, ...initialProps};

      const nodeProps = new Y.Map();
      for (const [key, value] of Object.entries(allProps)) {
        nodeProps.set(key, value);
      }
      
      graph.transact(() => {
        nodesMap.set(alwaysProps.id, Date.now());
        propertiesMap.set(alwaysProps.id, nodeProps);
      });
  }
  updateNode({ nodeId, props, graph }: { nodeId: NodeId; props: any; graph: graphDoc; }): void {
    const nodesMap = graph.getMap<any>('nodes');
    const propertiesMap = graph.getMap<Y.Map<any>>('properties');

    const nodeProps = propertiesMap.get(nodeId)
    if (!nodeProps) {throw new GraphError(`Node ${nodeId} not found - cannot update something that does not exist`);}
    
    this.testProps(props, nodeProps.get('label'), 'nullable', 'Node');

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

    if (!node) {throw new GraphError(`Node ${nodeId} not found - cannot delete something that does not exist`);}

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
          return; // Node is already removed and should not be visible
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
  addEdge({ sourceId, targetId, label, initialProps, graph }: { sourceId: NodeId; targetId: NodeId; label: edgeLabelTypes; initialProps: EdgeData; graph: graphDoc; }): void {
    const edgesTargetsMap = graph.getMap<Y.Map<Y.Array<any>>>('edgesTargets');
    const nodesMap = graph.getMap<any>('nodes');

    this.testLabel(label, 'Edge');
    this.testConnectivity({sourceId, targetId, edgeLabel: label, graph});
    
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
