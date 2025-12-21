// import * as Y from 'yjs'


// // const ydoc = new Y.Doc() // Represents the collaborative graph
// // const nodesMap = ydoc.getMap('nodes') // Map of nodeId to node properties AND EdgeYJSMap [target maps to Properties]

// export function addNode({ id, initialProps = {
//   policy: 'ADD_WINS',
//   label: 'Node',
//   position: { x: 0, y: 0 }
// }, graph }) {

//   const props = {
//     policy: initialProps.policy || 'ADD_WINS',
//     label: initialProps.label || 'Node',
//     position: initialProps.position || { x: 0, y: 0 },
//     edges: new Y.Map<string, Y.Map<any>>()
//   }  
//   const nodesMap = graph.getMap('nodes')
//   const nodeProps = new Y.Map()

//   for (const [key, value] of Object.entries(props)) {
//     nodeProps.set(key, value)
//   }
  
//   graph.transact(() => {
//     nodesMap.set(id, nodeProps)
//   })
// }

// export function updateNode({ id, props, graph }) {
//   const nodesMap = graph.getMap('nodes');
//   const node = nodesMap.get(id) || new Y.Map();

//   graph.transact(() => {
//     for (const [k, v] of Object.entries(props)) {
//     node.set(k, v);
//     // the clone is necessary to trigger Yjs updates in maps but it kills the nested syncing :C
//     nodesMap.set(id, node.clone());
//   }
//   });

// }

// export function deleteNode({ id, graph }) {
//   const nodesMap = graph.getMap('nodes')
//   const tombNodes = graph.getMap('removedNodes')
//   const node = nodesMap.get(id);

//   if (!node) return;

//   const policy = node.get('policy');
  
//   graph.transact(() => {
//     if (policy === 'REMOVE_WINS') {

//       tombNodes.set(id, Date.now());
      
//     } else if (policy === 'ADD_WINS') {

//       nodesMap.delete(id);
//       tombNodes.delete(id); 
//     }
//   });
// }

// export function getVisibleNodes({ graph }) {
//   const nodesMap = graph.getMap('nodes')
//   const tombNodes = graph.getMap('removedNodes')

//   const visible = [];
  
//   nodesMap.forEach((node, id) => {
//     const policy = node.get('policy');
    
//     if (!node) return; 

//     if (policy === 'REMOVE_WINS') {
//       if (tombNodes.has(id)) {
//         return; // (Remove Wins)
//       }
//     } 
    
//     visible.push({ id, ...node.toJSON(), policy });
//   });
  
//   return visible;
// }

// export function getNodeProps(graph, id) {
//   const nodesMap = graph.getMap('nodes');
//   return nodesMap.get(id).toJSON();
// }

// export function addEdge({ sourceId, targetId, initialProps = {}, graph }) {
//  // TODO
//  console.log("Not implemented");
// }

// export function updateEdge({ sourceId, targetId, props, graph }) {
//  // TODO
//  console.log("Not implemented");
// }

// export function removeEdge({ sourceId, targetId, graph }) {
//  // TODO
//  console.log("Not implemented");
// }