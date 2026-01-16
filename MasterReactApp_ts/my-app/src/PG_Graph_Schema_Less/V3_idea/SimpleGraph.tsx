// import * as Y from 'yjs'
// import { Graph, graphDoc } from '../../Helper/types/graph';
// import { NodeId, EdgeId, EdgeData, Policy, NodeData, edgeLabelTypes } from '../../Helper/types/types';


// // const ydoc = new Y.Doc()

// // const ydoc = new Y.Doc() // Represents the collaborative graph
// // const nodesMap = ydoc.getMap('nodes') // Map of nodeId to touch timestamps
// // const propertiesMap = ydoc.getMap('properties') // Map of nodeId to node properties
// // const tombNodes = ydoc.getMap('removedNodes') // Map of removed nodeIds (tombstones)
// // const edgesMap = ydoc.getMap('edges') // Map of nodeId to EdgeYJSMap [target maps to Properties] [not used here]


// export class SGraphV3 implements Graph {
//   addNode({ nodeId, initialProps, graph }: { nodeId: NodeId; initialProps: Partial<NodeData>; graph: graphDoc; }): void {
//     const nodesMap = graph.getMap<any>('nodes');
//     const propertiesMap = graph.getMap<Y.Map<any>>('properties');
  
//     const nodeProps = new Y.Map();

//   for (const [key, value] of Object.entries(initialProps)) {
//     nodeProps.set(key, value);
//   }
  
//   graph.transact(() => {
//     nodesMap.set(nodeId, Date.now());
//     propertiesMap.set(nodeId, nodeProps);
//   });
//   }

//   updateNode({ nodeId, props, graph }: { nodeId: NodeId; props: Partial<NodeData>; graph: graphDoc; }): void {
//     const nodesMap = graph.getMap<any>('nodes');
//     const propertiesMap = graph.getMap<Y.Map<any>>('properties');
//     const nodeProps = propertiesMap.get(nodeId) || new Y.Map();

//     graph.transact(() => {
//       for (const [k, v] of Object.entries(props)) {
//       nodeProps.set(k, v);
//       nodesMap.set(nodeId, Date.now());
//     }});
//   }

//   deleteNode({ nodeId, graph }: { nodeId: NodeId; graph: graphDoc; }): void {
//   const nodesMap = graph.getMap<any>('nodes')
//   const tombNodes = graph.getMap<any>('removedNodes')
//   const propertiesMap = graph.getMap<Y.Map<any>>('properties')
//   const node = propertiesMap.get(nodeId);

//   if (!node) return;

//   const policy = node.get('policy');
  
//   graph.transact(() => {
//     if (policy === 'REMOVE_WINS') {

//       tombNodes.set(nodeId, Date.now());
//       propertiesMap.delete(nodeId);
//       nodesMap.delete(nodeId);
      
//     } else if (policy === 'ADD_WINS') {

//       nodesMap.delete(nodeId);
//       tombNodes.delete(nodeId);
//     }
//   });
//   }
//   getVisibleNodes({ graph }: { graph: graphDoc; }): Array<{ id: NodeId; props: NodeData; policy: Policy; }> {
//   const nodesMap = graph.getMap<any>('nodes')
//   const tombNodes = graph.getMap<any>('removedNodes')
//   const propertiesMap = graph.getMap<Y.Map<any>>('properties')
//   const visible: any[] = [];
  
//   nodesMap.forEach((node: number , id: NodeId) => {
//     if (!propertiesMap.has(id) && !tombNodes.has(id)) {
//       console.error(`Node properties missing for node id: ${id}`);
//       return;
//     }
//     if (tombNodes.has(id)) {
//       return;
//     }
//     const props = propertiesMap.get(id);
//     if (!props) return;
//     const policy = props.get('policy');
//     // if (!node) return; // node is timestamp number, always truthy if exists

//     if (policy === 'REMOVE_WINS') {
//       if (tombNodes.has(id)) {
//         return;
//       }
//     }
//       visible.push({ id, ...props.toJSON(), policy });
//   });
  
//   return visible;
//   }
//   getNodeProps({ nodeId, graph }: { nodeId: NodeId; graph: graphDoc; }): NodeData | undefined {
//     const propertiesMap = graph.getMap<Y.Map<any>>('properties');
//     const props = propertiesMap.get(nodeId);
//     return props ? props.toJSON() as NodeData : undefined;
//   }
//   addEdge({ sourceId, targetId, label, initialProps = { label:'Has', placeholder: 'New Edge' }, graph }: { sourceId: NodeId; targetId: NodeId; label: edgeLabelTypes; initialProps?: EdgeData; graph: graphDoc; }): void {
//     const edgesMap = graph.getMap<Y.Map<Y.Map<any>>>('edges');
//     const nodesMap = graph.getMap<any>('nodes');

    
//     graph.transact(() => {
//       let edgeMap = edgesMap.get(sourceId);
//       if (!edgeMap) {
//         edgeMap = new Y.Map();
//         edgesMap.set(sourceId, edgeMap);
//       }
      
//       const edgeProps = new Y.Map();
//       for (const [key, value] of Object.entries(initialProps)) {
//         edgeProps.set(key, value);
//       }
//       edgeMap.set(targetId, edgeProps);
//       nodesMap.set(sourceId, Date.now());
//       nodesMap.set(targetId, Date.now());
//     }); 
//   }
//   updateEdge({ sourceId, targetId, props, graph }: { sourceId: NodeId; targetId: NodeId; props: Partial<EdgeData>; graph: graphDoc; }): void {
//     throw new Error('Method not implemented.');
//   }
//   deleteEdge({ sourceId, targetId, graph }: { sourceId: NodeId; targetId: NodeId; graph: graphDoc; }): void {
//   const edgesMap = graph.getMap<Y.Map<Y.Map<any>>>('edges')
//   const edgeMap = edgesMap.get(sourceId);
//   if (!edgeMap) {
//     console.error(`Edge map for sourceId ${sourceId} does not exist.`);
//     return;
//   }
//   edgeMap.delete(targetId);
//   }
//   getEdges({ graph }: { graph: graphDoc; }): Array<{ sourceId: NodeId; targetId: NodeId; props: EdgeData; }> {
//   const edgesMap = graph.getMap<Y.Map<Y.Map<any>>>('edges');
//   const nodes = graph.getMap<any>('nodes');
//   const edges: any[] = [];
//   for (let sourceId of Array.from(nodes.keys())) {
//     const edgeMap = edgesMap.get(sourceId);
//     if (!edgeMap) {
//       console.log("No edge map for sourceId:", sourceId);
//       // edges.push(...[]);
//       continue;
//     }
//     edgeMap.forEach((props: Y.Map<any>, targetId: NodeId) => {
//       edges.push({ sourceId, targetId, ...props.toJSON() as EdgeData });
//     });
//   }
//   return edges;
//   }
// }
// // const minimalInitialProps: Partial<NodeData> = {
// //   policy: 'ADD_WINS',
// //   label: 'Node',
// // };

// // export function addNode({ id, initialProps = minimalInitialProps, graph }: AddNodeArgs) {
// //   const nodesMap = graph.getMap<any>('nodes');
// //   const propertiesMap = graph.getMap<Y.Map<any>>('properties');
// //   
// //   const nodeProps = new Y.Map();

// //   for (const [key, value] of Object.entries(initialProps)) {
// //     nodeProps.set(key, value);
// //   }
// //   
// //   graph.transact(() => {
// //     nodesMap.set(id, Date.now());
// //     propertiesMap.set(id, nodeProps);
// //   });
// // }

// // export function updateNode({ id, props, graph }: UpdateNodeArgs) {
// //   const nodesMap = graph.getMap<any>('nodes');
// //   const propertiesMap = graph.getMap<Y.Map<any>>('properties');
// //   const nodeProps = propertiesMap.get(id) || new Y.Map();

// //   graph.transact(() => {
// //     for (const [k, v] of Object.entries(props)) {
// //     nodeProps.set(k, v);
// //     nodesMap.set(id, Date.now());
// //   }});
// // }


// // export function deleteNode({ id, graph }: DeleteNodeArgs) {
// //   const nodesMap = graph.getMap<any>('nodes')
// //   const tombNodes = graph.getMap<any>('removedNodes')
// //   const propertiesMap = graph.getMap<Y.Map<any>>('properties')
// //   const node = propertiesMap.get(id);

// //   if (!node) return;

// //   const policy = node.get('policy');
// //   
// //   graph.transact(() => {
// //     if (policy === 'REMOVE_WINS') {

// //       tombNodes.set(id, Date.now());
// //       propertiesMap.delete(id);
// //       nodesMap.delete(id);
// //       
// //     } else if (policy === 'ADD_WINS') {

// //       nodesMap.delete(id);
// //       tombNodes.delete(id);
// //     }
// //   });
// // }


// // export function addEdge({ sourceId, targetId, initialProps = {}, graph }: AddEdgeArgs) {
// //   const edgesMap = graph.getMap<Y.Map<Y.Map<any>>>('edges');
// //   const nodesMap = graph.getMap<any>('nodes');
// //   let edgeMap = edgesMap.get(sourceId);
// //   
// //   graph.transact(() => {
// //     if (!edgeMap) {
// //       edgeMap = new Y.Map();
// //       edgesMap.set(sourceId, edgeMap);
// //     }
// //     
// //     const edgeProps = new Y.Map();
// //     for (const [key, value] of Object.entries(initialProps)) {
// //       edgeProps.set(key, value);
// //     }
// //     edgeMap.set(targetId, edgeProps);
// //     nodesMap.set(sourceId, Date.now());
// //     nodesMap.set(targetId, Date.now());
// //   });
// // }


// // export function updateEdge({ sourceId, targetId, props, graph }: UpdateEdgeArgs) {
// //   // TODO
// // }


// // export function removeEdge({ sourceId, targetId, graph }: RemoveEdgeArgs) {
// //   const edgesMap = graph.getMap<Y.Map<Y.Map<any>>>('edges')
// //   const edgeMap = edgesMap.get(sourceId);
// //   if (!edgeMap) {
// //     console.error(`Edge map for sourceId ${sourceId} does not exist.`);
// //     return;
// //   }
// //   edgeMap.delete(targetId);
// // }

// // 
// // export function getVisibleNodes({ graph }: GetVisibleNodesArgs) {
// //   const nodesMap = graph.getMap<any>('nodes')
// //   const tombNodes = graph.getMap<any>('removedNodes')
// //   const propertiesMap = graph.getMap<Y.Map<any>>('properties')
// //   const visible: any[] = [];
// //   
// //   nodesMap.forEach((node, id) => {
// //     if (!propertiesMap.has(id) && !tombNodes.has(id)) {
// //       console.error(`Node properties missing for node id: ${id}`);
// //       return;
// //     }
// //     if (tombNodes.has(id)) {
// //       return;
// //     }
// //     const props = propertiesMap.get(id);
// //     if (!props) return;
// //     const policy = props.get('policy');
// //     // if (!node) return; // node is timestamp number, always truthy if exists

// //     if (policy === 'REMOVE_WINS') {
// //       if (tombNodes.has(id)) {
// //         return;
// //       }
// //     }
// //       visible.push({ id, ...props.toJSON(), policy });
// //   });
// //   
// //   return visible;
// // }

//   // export function getNodeProps(graph: Y.Doc, id: string) {
//   //   const propertiesMap = graph.getMap<Y.Map<any>>('properties');
//   //   const props = propertiesMap.get(id);
//   //   return props ? props.toJSON() : null;
//   // }


// // export function getEdges({ graph }: GetEdgesArgs) {
// //   const edgesMap = graph.getMap<Y.Map<Y.Map<any>>>('edges');
// //   const nodes = graph.getMap<any>('nodes');
// //   const edges: any[] = [];
// //   for (let sourceId of Array.from(nodes.keys())) {
// //     const edgeMap = edgesMap.get(sourceId);
// //     if (!edgeMap) {
// //       // console.log("No edge map for sourceId:", sourceId);
// //       // edges.push(...[]);
// //       continue;
// //     }
// //     edgeMap.forEach((props, targetId) => {
// //       edges.push({ sourceId, targetId, ...props.toJSON() });
// //     });
// //   }
// //   return edges;
// // }