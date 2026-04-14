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
import { Schema_1 as SchemaInstance } from '../../PG_Graph_Schema/schema_1';
import { GraphError } from '../../Helper/Vizuals/GraphError';
import { DualKeyMap } from './DualKeyMap';
import { ORSetRegistry } from '../../Helper/YJS_helper/ORSetRegistry';

const DEFAULT_POLICY: Policy = 'OBSERVED_REMOVE';

/* This is a SCHEMA APPROACH TO A GRAPH BASED ON YJS */
// const ydoc = new Y.Doc()

/*
const ydoc = new Y.Doc() // Represents the collaborative graph | TOP LEVEL
const nodesMap = ydoc.getMap('nodes') // Map of nodeId to touch timestamps and removed node information
const nodePropsMap = ydoc.getMap('nodeProps') // Map of nodeId to node properties TOP LEVEL BECAUSE OF MERGING BEHAVIOUR
const edgesTargetsMap = ydoc.getMap('edgesTargets') // Map of nodeId to EdgeYJSMap [target maps to EdgeMap]
const edgesMap = inside edgesTargetsMap // Map of target to EdgeProperties

*/

const schemaInstance = new SchemaInstance();

// Normalize values before inserting into Yjs maps to avoid embedding
// unsupported types (e.g., native Map or class instances holding Y.Doc).

export class SchemaGraphV3 implements Graph {
  hasSchema : boolean = true;

  // Lazy-initialized OR-Set registries per doc
  private _registryCache = new WeakMap<Y.Doc, ORSetRegistry>();
  
  private getNodeRegistry(graph: graphDoc): ORSetRegistry {
    let registry = this._registryCache.get(graph);
    if (!registry) {
      registry = new ORSetRegistry(graph, 'nodes');
      this._registryCache.set(graph, registry);
    }
    return registry;
  }

  /** Simple ADD_WINS registry: nodeId → timestamp */
  private getNodesSimple(graph: graphDoc): Y.Map<number> {
    return graph.getMap<number>('nodes_simple');
  }

  /** Permanent policy map: nodeId → Policy (never cleared) */
  private getNodesPolicies(graph: graphDoc): Y.Map<string> {
    return graph.getMap<string>('nodes_policies');
  }

  /** Get the stored policy for a node (defaults to OBSERVED_REMOVE) */
  private getNodePolicy(nodeId: NodeId, graph: graphDoc): Policy {
    const policies = this.getNodesPolicies(graph);
    return (policies.get(nodeId) as Policy) || DEFAULT_POLICY;
  }
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
        // TODO Point or Vector Just ideas - would like to keep this for Future Work
     } 
    //  else if ('dimensions' in expectedType) {
    //       if (typeof incomingValue !== 'object' || incomingValue === null) {
    //           throw new GraphError(`Expected Point/Vector structure but got ${typeof incomingValue}`);
    //       }
    //       const isPoint = incomingValue instanceof Point; // from complex types
    //       const isVector = incomingValue instanceof OurVector;
    //       const isSimpleObj = 'x' in incomingValue && 'y' in incomingValue; 
    //       if (!isPoint && !isVector && !isSimpleObj) {
    //            throw new GraphError(`Expected Point/Vector but got incompatible object`);
    //       }
    //  }
  } 
  // else if (expectedType === 'vector') {
  //    if (!(incomingValue instanceof OurVector)) {
  //     throw new GraphError(`Expected type Vector but got ${typeof incomingValue}`);
  //   }
  // } else if (expectedType === 'point') {
  //   if (!(incomingValue instanceof Point)) {
  //     throw new GraphError(`Expected type Point but got ${typeof incomingValue}`);
  //   }
  // }
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
      const policy = alwaysProps.policy || DEFAULT_POLICY;

      // Validate label and required/optional properties based on schema
      this.testLabel(alwaysProps.label, 'Node');
      this.testProps(initialProps, alwaysProps.label, 'notNull', 'Node');
      this.testProps(initialProps, alwaysProps.label, 'nullable', 'Node');

      graph.transact(() => {
        // Store policy permanently (survives deletion)
        this.getNodesPolicies(graph).set(alwaysProps.id, policy);

        if (policy === 'ADD_WINS') {
          // Simple: store nodeId → timestamp
          this.getNodesSimple(graph).set(alwaysProps.id, Date.now());
        } else {
          // OBSERVED_REMOVE: add tag to OR-Set registry
          this.getNodeRegistry(graph).add(alwaysProps.id);
        }

        const nodePropsYMap = graph.getMap(`n_${alwaysProps.id}`);
        const nodeProps = new DualKeyMap(nodePropsYMap);
        for (const [key, value] of Object.entries(alwaysProps)) {
             nodePropsYMap.set(key, value); 
        }

        for (const [key, value] of Object.entries(initialProps)) {
          nodeProps.setInitial(key, value);
        }
      });
  }

  updateNode({ nodeId, props, graph }: { nodeId: NodeId; props: any; graph: graphDoc; }): void {
    // Check if node is alive (policy-aware)
    if (!this.isNodeAlive(nodeId, graph)) {
      throw new GraphError(`Node ${nodeId} not found or removed - cannot update`);
    }

    // Access Top-Level Map
    const nodePropsYMap = graph.getMap(`n_${nodeId}`);
    const nodeProps = new DualKeyMap(nodePropsYMap);
    
    const label = nodeProps.get('label') as labelTypes || nodeProps.get('init_label') as labelTypes;
    
    const currentProps = nodeProps.getAll() || {};
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
        nodeProps.setUpdate(k, v, expectedType, graph);
      }
    });
  }
  deleteNode({ nodeId, graph }: { nodeId: NodeId; graph: graphDoc; }): void {
    if (!this.isNodeAlive(nodeId, graph)) {
      throw new GraphError(`Node ${nodeId} not found or already removed`);
    }

    const policy = this.getNodePolicy(nodeId, graph);
    const nodeProps = graph.getMap(`n_${nodeId}`);
    
    graph.transact(() => {
      if (policy === 'ADD_WINS') {
        // Simple: delete from nodesSimple (Yjs LWW — concurrent add wins)
        this.getNodesSimple(graph).delete(nodeId);
      } else {
        // OBSERVED_REMOVE: tombstone all observed tags
        this.getNodeRegistry(graph).remove(nodeId);
        // Clear property data (OR-Set cascade)
        nodeProps.clear();
      }
    });
  }
  getVisibleNodes({ graph }: { graph: graphDoc; }): Array<{ id: NodeId; props: any; }> {
    const visible: any[] = [];
    const seen = new Set<NodeId>();

    // 1. ADD_WINS nodes (from simple map)
    const nodesSimple = this.getNodesSimple(graph);
    nodesSimple.forEach((_ts, id) => {
      if (this.getNodePolicy(id, graph) !== 'ADD_WINS') return;
      seen.add(id);
      const propsMap = graph.getMap(`n_${id}`);
      if (propsMap.size === 0) return;
      const nodeProps = new DualKeyMap(propsMap);
      visible.push({ id, ...nodeProps.getAll() });
    });

    // 2. OBSERVED_REMOVE nodes (from OR-Set registry)
    const aliveIds = this.getNodeRegistry(graph).getAllAlive();
    for (const id of aliveIds) {
      if (seen.has(id)) continue;
      const propsMap = graph.getMap(`n_${id}`);
      if (propsMap.size === 0) continue;
      const nodeProps = new DualKeyMap(propsMap);
      visible.push({ id, ...nodeProps.getAll() });
    }
    
    return visible;
  }

  getNodeProps({ nodeId, graph }: { nodeId: NodeId; graph: graphDoc; }): any | undefined {
    if (!this.isNodeAlive(nodeId, graph)) return undefined;

    const propsYMap = graph.getMap(`n_${nodeId}`);
    const nodeProps = new DualKeyMap(propsYMap);
    return nodeProps.getAll();
  }

  addEdge({ sourceId, targetId, label, initialProps, graph, edgeId }: { sourceId: NodeId; targetId: NodeId; label: edgeLabelTypes; initialProps: EdgeData; graph: graphDoc; edgeId?: EdgeId }): void {
    // 1. Validate Schema
    this.testLabel(label, 'Edge');
    this.testConnectivity({sourceId, targetId, edgeLabel: label, graph});

    // Ensure Source/Target are alive (policy-aware)
    if (!this.isNodeAlive(sourceId, graph)) throw new GraphError(`Source Node ${sourceId} does not exist or is removed`);
    if (!this.isNodeAlive(targetId, graph)) throw new GraphError(`Target Node ${targetId} does not exist or is removed`);

    // 2. Snapshot tags for OBSERVED_REMOVE endpoints, empty for ADD_WINS
    const sourcePolicy = this.getNodePolicy(sourceId, graph);
    const targetPolicy = this.getNodePolicy(targetId, graph);
    const sourceTags = sourcePolicy === 'OBSERVED_REMOVE' 
        ? this.getNodeRegistry(graph).getAliveTags(sourceId) 
        : [];
    const targetTags = targetPolicy === 'OBSERVED_REMOVE' 
        ? this.getNodeRegistry(graph).getAliveTags(targetId) 
        : [];

   // 3. For Test purposes, we allow edgeId to be passed in, otherwise generate a new one
   const edgeUUID = edgeId || crypto.randomUUID();

    graph.transact(() => {
      // 4. Store Data in Top-Level Map
      const edgePropsYMap = graph.getMap(`e_${edgeUUID}`);
      const edgeProps = new DualKeyMap(edgePropsYMap);
      
      // Initialize Properties using DualKey Logic
      for (const [key, value] of Object.entries(initialProps)) {
          edgeProps.setInitial(key, value);
      }
      // Always store Source/Target/Label + observed tags in the Data Map
      edgePropsYMap.set('sourceId', sourceId);
      edgePropsYMap.set('targetId', targetId);
      edgePropsYMap.set('label', label);
      edgePropsYMap.set('sourceTags', sourceTags);   // Version-bound (OBSERVED_REMOVE) or empty (ADD_WINS)
      edgePropsYMap.set('targetTags', targetTags);

      // 5. Update Topology Index
      const edgesTargetsMap = graph.getMap<Y.Map<Y.Array<string>>>('edgesTargets');
      
      let targetMap = edgesTargetsMap.get(sourceId);
      if (!targetMap) {
        targetMap = new Y.Map();
        edgesTargetsMap.set(sourceId, targetMap);
      }

      let edgeList = targetMap.get(targetId);
      if (!edgeList) {
        edgeList = new Y.Array();
        targetMap.set(targetId, edgeList);
      }

      edgeList.push([edgeUUID]);
    }); 
  }

  updateEdge({ edgeId, props, graph }: { edgeId: EdgeId; props: Partial<EdgeData>; graph: graphDoc; }): void {
    const edgePropsYMap = graph.getMap(`e_${edgeId}`);
    const edgeProps = new DualKeyMap(edgePropsYMap);
    
    graph.transact(() => {
      // Update Properties using DualKey Logic
      for (const [key, value] of Object.entries(props)) {
          edgeProps.setUpdate(key, value);
      }
    });
  }

  deleteEdge({ edgeId, graph }: { edgeId: EdgeId; graph: graphDoc; }): void {
    const edgePropsYMap = graph.getMap(`e_${edgeId}`);
    
    graph.transact(() => {
      edgePropsYMap.clear();
    });
  }

  getEdges({ graph }: { graph: graphDoc; }): Array<{ sourceId: NodeId; targetId: NodeId; props: EdgeData; }> {
    const nodeRegistry = this.getNodeRegistry(graph);
    const edgesTargetsMap = graph.getMap<Y.Map<Y.Array<string>>>('edgesTargets');
    const edges: any[] = [];
    
    // Iterate Topology (Source -> Target -> UUIDs)
    edgesTargetsMap.forEach((sourceMap, sourceId) => {
      if (!sourceMap) return;
      
      sourceMap.forEach((edgeList, targetId) => {
          if (!edgeList) return;
          edgeList.forEach((edgeUUID: string) => {
              const edgePropsMap = graph.getMap(`e_${edgeUUID}`);
              
              // If map is empty (was cleared/deleted), skip it
              if (edgePropsMap.size === 0) return;

              // Policy-aware endpoint liveness check
              const storedSourceId = edgePropsMap.get('sourceId') as string;
              const storedTargetId = edgePropsMap.get('targetId') as string;
              const sourcePolicy = this.getNodePolicy(storedSourceId, graph);
              const targetPolicy = this.getNodePolicy(storedTargetId, graph);

              // Check source alive
              if (sourcePolicy === 'ADD_WINS') {
                if (!this.getNodesSimple(graph).has(storedSourceId)) return;
              } else {
                const sourceTags: string[] = edgePropsMap.get('sourceTags') as string[] || [];
                if (!sourceTags.some(tag => nodeRegistry.isTagAlive(tag))) return;
              }

              // Check target alive
              if (targetPolicy === 'ADD_WINS') {
                if (!this.getNodesSimple(graph).has(storedTargetId)) return;
              } else {
                const targetTags: string[] = edgePropsMap.get('targetTags') as string[] || [];
                if (!targetTags.some(tag => nodeRegistry.isTagAlive(tag))) return;
              }

              const edgeProps = new DualKeyMap(edgePropsMap);
              const props = edgeProps.getAll();

              edges.push({ 
                  id: edgeUUID,
                  sourceId: storedSourceId, 
                  targetId: storedTargetId, 
                  ...props 
              });
          });
      });
    });
    return edges;
  }

  /* Referential Integrity / Ghost Nodes */

  /** Policy-aware node liveness check */
  private isNodeAlive(nodeId: NodeId, graph: graphDoc): boolean {
      const policy = this.getNodePolicy(nodeId, graph);
      if (policy === 'ADD_WINS') {
        return this.getNodesSimple(graph).has(nodeId);
      } else {
        return this.getNodeRegistry(graph).isAlive(nodeId);
      }
  }

  /**
   * Identifies "Ghost Nodes": Nodes that are referenced by an Edge but are considered "Dead" (removed or non-existent).
   * Note: With OR-Set + version-bound edges, getEdges() already filters dead edges.
   * This method is kept for optional topology cleanup.
   */
  getGhostNodes({ graph }: { graph: graphDoc; }): Set<NodeId> {
      const ghosts = new Set<NodeId>();
      const edgesTargetsMap = graph.getMap<Y.Map<Y.Array<string>>>('edgesTargets');

      edgesTargetsMap.forEach((sourceMap, sourceId) => {
          if (!this.isNodeAlive(sourceId, graph)) {
              ghosts.add(sourceId);
          }
          if (!sourceMap) return;
          sourceMap.forEach((_, targetId) => {
              if (!this.isNodeAlive(targetId, graph)) {
                  ghosts.add(targetId);
              }
          });
      });
      return ghosts;
  }

  /**
   * Strategy C: Reactive / Cascading Delete.
   * Removes all edges that point to or from "Ghost Nodes".
   * Note: With version-bound edges, this is optional cleanup (edges are already invisible at read time).
   */
  garbageCollectGhosts({ graph }: { graph: graphDoc; }): void {
      const ghosts = this.getGhostNodes({ graph });
      if (ghosts.size === 0) return;

      const edgesTargetsMap = graph.getMap<Y.Map<Y.Array<string>>>('edgesTargets');
      
      graph.transact(() => {
          edgesTargetsMap.forEach((sourceMap, sourceId) => {
              if (!sourceMap) return;
              sourceMap.forEach((edgeList, targetId) => {
                  if (!edgeList) return;
                  if (ghosts.has(sourceId) || ghosts.has(targetId)) {
                      edgeList.forEach((edgeUUID: string) => {
                          console.log(`[GC] Cleaning up edge ${edgeUUID} (${sourceId} -> ${targetId})`);
                          this.deleteEdge({ edgeId: edgeUUID as EdgeId, graph });
                      });
                  }
              });
          });
      });
  }
}
