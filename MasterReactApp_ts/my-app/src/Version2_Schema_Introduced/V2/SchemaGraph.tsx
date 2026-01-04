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
import { dataTypes } from '../../Helper/types_interfaces/types';
import { GrowOnlyCounter, OurVector, Point } from '../../Helper/YJS_helper/moreComplexTypes';
import { Schema_1 as SchemaInstance } from '../../Schema/schema_1';
import { GraphError } from '../../Helper/Vizuals/GraphError';

/* This is a SCHEMA APPROACH TO A GRAPH BASED ON YJS */
// const ydoc = new Y.Doc()

// const ydoc = new Y.Doc() // Represents the collaborative graph | TOP LEVEL
// const nodesMap = ydoc.getMap('nodes') // Map of nodeId to touch timestamps and removed node information
// const nodePropsMap = ydoc.getMap('nodeProps') // Map of nodeId to node properties TOP LEVEL BECAUSE OF MERGING BEHAVIOUR
// const edgesTargetsMap = ydoc.getMap('edgesTargets') // Map of nodeId to EdgeYJSMap [target maps to EdgeMap]
// const edgesMap = inside edgesTargetsMap // Map of target to EdgeProperties

const schemaInstance = new SchemaInstance();

// Normalize values before inserting into Yjs maps to avoid embedding
// unsupported types (e.g., native Map or class instances holding Y.Doc).

export class SchemaGraphV2 implements Graph {
  hasSchema : boolean = true;
  isSchemaCorrect(graph: graphDoc): boolean {
    throw new Error('Method not implemented.');
  }
  private typeCheck(incomingValue: any, expectedType: dataTypes) {
  if (expectedType === 'string') {
    if (typeof incomingValue !== 'string') {
      throw new GraphError(`Expected type string but got ${typeof incomingValue}`);
    }
  } else if (expectedType === 'number') {
    if (typeof incomingValue !== 'number') {
      throw new GraphError(`Expected type number but got ${typeof incomingValue}`);
    }
  } else if (expectedType === 'boolean') {
    if (typeof incomingValue !== 'boolean') {
      throw new GraphError(`Expected type boolean but got ${typeof incomingValue}`);
    }
  } else if (expectedType === 'date') {
    if (!(incomingValue instanceof Date) && typeof incomingValue !== 'string') {
       if (!(incomingValue instanceof Date)) {
          throw new GraphError(`Expected type date but got ${typeof incomingValue}`);
       }
    }
  } else if (typeof expectedType === 'object') {
     if ('kind' in expectedType) {
        if (expectedType.kind === 'counter') {
            const isYMap = incomingValue instanceof Y.Map;
            // Allow numbers for counter updates (diff-based)
            if (!isYMap && typeof incomingValue !== 'number') {
                throw new GraphError(`Expected type Counter (Y.Map) or number (for update) but got ${typeof incomingValue}`);
            }
        } else if (expectedType.kind === 'yarray') {
            const isArray = incomingValue instanceof Y.Array || Array.isArray(incomingValue);
            if (!isArray) {
                throw new GraphError(`Expected type Array (or Y.Array) but got ${typeof incomingValue}`);
             }
            //  // Deep check each element
            //  incomingValue.forEach((item: any) => {
            //       typeCheck(item, expectedType.element);
            //  });
        } else if (expectedType.kind === 'ymap') {
             // We expect a Map or Y.Map or maybe a plain object? 
             // Yjs maps are usually initialized with plain objects or Y.Maps.
             const isMap = incomingValue instanceof Y.Map || (typeof incomingValue === 'object' && incomingValue !== null);
             if (!isMap) {
                  throw new GraphError(`Expected type Map (or Object/Y.Map) but got ${typeof incomingValue}`);
             }
            //  // Deep check each key-value pair
            //  Object.entries(incomingValue).forEach(([key, value]) => {
            //       typeCheck(value, expectedType.value);
            //  });
        }
        // TODO Point or Vector Just ideas
     } else if ('dimensions' in expectedType) {
          if (typeof incomingValue !== 'object' || incomingValue === null) {
              throw new GraphError(`Expected Point/Vector structure but got ${typeof incomingValue}`);
          }
          const isPoint = incomingValue instanceof Point; // from complex types
          const isVector = incomingValue instanceof OurVector;
          const isSimpleObj = 'x' in incomingValue && 'y' in incomingValue; 
          if (!isPoint && !isVector && !isSimpleObj) {
               throw new GraphError(`Expected Point/Vector but got incompatible object`);
          }
     }
  } else if (expectedType === 'vector') {
     if (!(incomingValue instanceof OurVector)) {
      throw new GraphError(`Expected type Vector but got ${typeof incomingValue}`);
    }
  } else if (expectedType === 'point') {
    if (!(incomingValue instanceof Point)) {
      throw new GraphError(`Expected type Point but got ${typeof incomingValue}`);
    }
  }
};
  private setNormalizedValueAdd({k,v, nodeProps}: {k: string, v: any, nodeProps: Y.Map<any>}) : void {
    if (v instanceof GrowOnlyCounter) {
      nodeProps.set(k, v.counter);
      return;
    }
    if (v instanceof Y.Map || v instanceof Y.Array) {
      nodeProps.set(k, v);
      return;
    }
    const initKey = `init_${k}`;
    if (v instanceof Date) {
      nodeProps.set(initKey, v.toISOString());
      return;
    }
    if (v instanceof Point) {
      nodeProps.set(initKey, { x: v.x, y: v.y });
      return;
    }
    if (v instanceof OurVector) {
      nodeProps.set(initKey, { x: v.x, y: v.y, z: v.z });
      return;
    }
    nodeProps.set(initKey, v);
    return;
  };
  private setNormalizedValueUpdate({k,v,expectedType, nodeProps, graph}: {k: string, v: any, expectedType: any, nodeProps: Y.Map<any>, graph: graphDoc}) : void {
        // Handle Counter Updates
        if (expectedType && typeof expectedType === 'object' && 'kind' in expectedType) { 
          console.log('expectedType', v);
            if (expectedType.kind === 'counter' && typeof v === 'number') {
                 let currentCounterMap = nodeProps.get(k);
                 if (!currentCounterMap || !(currentCounterMap instanceof Y.Map)) {
                  console.log('Counter not found, creating new one');
                     const newMap = new Y.Map<number>();
                     nodeProps.set(k, newMap);
                     currentCounterMap = newMap;
                 }
                 if (currentCounterMap instanceof Y.Map) {
                     const counterWrapper = new GrowOnlyCounter(currentCounterMap, graph);
                     const currentTotal = counterWrapper.getTotal();
                     const diff = v - currentTotal;
                     if (diff > 0) {
                         counterWrapper.increment({ amount: diff });
                     } else if (diff < 0) {
                         console.warn(`GrowOnlyCounter for ${k} cannot be decremented. Ignored.`);
                     }
                     return;
                 }
            // Handle Array Updates
            } else if (expectedType.kind === 'yarray' && Array.isArray(v)) {
                 let currentArray = nodeProps.get(k);
                 if (!currentArray || !(currentArray instanceof Y.Array)) {
                     const newArray = new Y.Array();
                     nodeProps.set(k, newArray);
                     currentArray = newArray;
                 }
                 // currently remove strategy will be diff-based
                 if (currentArray instanceof Y.Array) {
                     const length = currentArray.length;
                     if (length > 0) currentArray.delete(0, length);
                     currentArray.push(v);
                 }
                 return;
            // Handle Map Updates
            } else if (expectedType.kind === 'ymap' && typeof v === 'object' && v !== null && !(v instanceof Y.Map)) {
                 let currentMap = nodeProps.get(k);
                 if (!currentMap || !(currentMap instanceof Y.Map)) {
                     const newMap = new Y.Map();
                     nodeProps.set(k, newMap);
                     currentMap = newMap;
                 }
                 if (currentMap instanceof Y.Map) {
                     const currentKeys = Array.from(currentMap.keys());
                     const newKeys = Object.keys(v);
                     const vAny = v as any;
                     
                     newKeys.forEach(inputKey => {
                         if (currentMap.get(inputKey) !== vAny[inputKey]) {
                             currentMap.set(inputKey, vAny[inputKey]);
                         }
                     });

                     currentKeys.forEach(existingKey => {
                         if (!(existingKey in v)) {
                             currentMap.delete(existingKey);
                         }
                     });
                 }
                 return;
            }
            return;
        // Handle Simple Updates
        } else {
            nodeProps.set(k, v);
            
            // Memory Optimization: Delete init key if it exists
            const initKey = `init_${k}`;
            if (nodeProps.has(initKey)) {
                nodeProps.delete(initKey);
            }
        }
  };
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
          // defined check
          if (incoming[key] === null || incoming[key] === undefined) {
            throw new GraphError(`Property ${key} is null or undefined but has to be included, incoming[key]: ${incoming[key]}`);
          }
          // Type Checks
          this.typeCheck(incoming[key], value);
        });
      } else if (boolKey === 'nullable') {
        Object.entries(schemaInstance.allowedNodePropeerties[label]['nullable']).forEach(([key, value]) => {
          if (incoming[key] === null || incoming[key] === undefined) {
            return; // Property is nullable, so it can be null or undefined
          }
          // Type check using the same rules as notNull
          this.typeCheck(incoming[key], value);
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



  /* Graph Main Interaction Interface */

  addNode({ alwaysProps, initialProps, graph }: { alwaysProps: AlwaysNodeData; initialProps: any; graph: graphDoc; }): void {
      const nodesMap = graph.getMap<any>('nodes');

      // Validate label and required/optional properties based on schema
      this.testLabel(alwaysProps.label, 'Node');
      this.testProps(initialProps, alwaysProps.label, 'notNull', 'Node');
      this.testProps(initialProps, alwaysProps.label, 'nullable', 'Node');
      const allProps = {...alwaysProps, ...initialProps};
      
      const schemaProps = {
        ...(schemaInstance.allowedNodePropeerties[alwaysProps.label]?.['notNull'] || {}),
        ...(schemaInstance.allowedNodePropeerties[alwaysProps.label]?.['nullable'] || {})
    }; 
      graph.transact(() => {
        nodesMap.set(alwaysProps.id, Date.now());
        
        // Use Top-Level Shared Type for Node Properties (Enables Merging)
        const nodeProps = graph.getMap(`n_${alwaysProps.id}`);
        
        // Always properties: Set directly without init_ prefix logic
        for (const [key, value] of Object.entries(alwaysProps)) {
             nodeProps.set(key, value); 
        }

        // Initial properties: Use normalization with init_ prefix
        for (const [key, value] of Object.entries(initialProps)) {
          const expectedType = schemaProps[key];
          this.setNormalizedValueAdd({k:key,v:value, nodeProps});
        }
      });
  }

  updateNode({ nodeId, props, graph }: { nodeId: NodeId; props: any; graph: graphDoc; }): void {
    const nodesMap = graph.getMap<any>('nodes');
    
    // Check existence via Registry (nodesMap)
    if (!nodesMap.has(nodeId)) {throw new GraphError(`Node ${nodeId} not found - cannot update something that does not exist`);}

    // Access Top-Level Map
    const nodeProps = graph.getMap(`n_${nodeId}`);
    
    const label = nodeProps.get('label') as labelTypes || nodeProps.get('init_label') as labelTypes;
    
    // find more compact solution!!
    const currentProps = this.getNodeProps({ nodeId, graph }) || {};
    const mergedProps = { ...currentProps, ...props };
    
    // Validate the FINAL state, not just the update
    this.testProps(mergedProps, label, 'notNull', 'Node');
    this.testProps(mergedProps, label, 'nullable', 'Node');

    const schemaProps = {
        ...(schemaInstance.allowedNodePropeerties[label]?.['notNull'] || {}),
        ...(schemaInstance.allowedNodePropeerties[label]?.['nullable'] || {})
    };

    graph.transact(() => {
      for (const [k, v] of Object.entries(props)) {
        const expectedType = schemaProps[k];
        this.setNormalizedValueUpdate({k,v,expectedType, nodeProps, graph});
        nodesMap.set(nodeId, Date.now());
      }
    });
  }
  deleteNode({ nodeId, graph }: { nodeId: NodeId; graph: graphDoc; }): void {
    const nodesMap = graph.getMap<any>('nodes')
    // const propertiesMap = graph.getMap<Y.Map<any>>('properties')
    const nodeProps = graph.getMap(`n_${nodeId}`);

    // If node not in registry, it's considered non-existent
    if (!nodesMap.has(nodeId)) {throw new GraphError(`Node ${nodeId} not found - cannot delete something that does not exist`);}

    const policy = nodeProps.get('policy') || nodeProps.get('init_policy');
    
    graph.transact(() => {
      if (policy === 'REMOVE_WINS') {
        nodesMap.set(nodeId, { removed: true });
        // propertiesMap.delete(nodeId); 
        // We cannot delete the top-level map, but we can clear it
        nodeProps.clear();
      } else if (policy === 'ADD_WINS') {
        nodesMap.delete(nodeId);
      }
    });
  }
  getVisibleNodes({ graph }: { graph: graphDoc; }): Array<{ id: NodeId; props: any; policy: Policy; }> {
    const nodesMap = graph.getMap<any>('nodes')
    // const propertiesMap = graph.getMap<Y.Map<any>>('properties')
    const visible: any[] = [];
    
    nodesMap.forEach((node: any , id: NodeId) => {
        // Access Top-Level Map
        const propsMap = graph.getMap(`n_${id}`);
      
      if (node.removed) {
          // REMOVE_WINS logic preserved in registry
           return;
      }
      
      const policy = propsMap.get('policy') || propsMap.get('init_policy');

      if (policy === 'REMOVE_WINS') {
        if (node.removed) {
          return; // Node is already removed and should not be visible
        }
      }
        visible.push({ id, ...propsMap.toJSON(), policy });
    });
    
    return visible;
  }
  getNodeProps({ nodeId, graph }: { nodeId: NodeId; graph: graphDoc; }): any | undefined {
    const nodesMap = graph.getMap<any>('nodes');
    if (!nodesMap.has(nodeId)) return undefined;

    const props = graph.getMap(`n_${nodeId}`);
    
    const returnProps: any = {};
    const combinedProps = new Map<string, any>();

    props.forEach((value: any, key: string) => {
       if (key.startsWith('init_')) {
           const realKey = key.replace('init_', '');
           if (!combinedProps.has(realKey)) {
               combinedProps.set(realKey, value);
           }
       } else {
           // Direct update value - takes precedence
           combinedProps.set(key, value);
       }
    });

    combinedProps.forEach((value, key) => {
         returnProps[key] = value;
    });

    // console.log('returnProps:', returnProps);

    return returnProps;
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
        // console.log(key, value);
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
