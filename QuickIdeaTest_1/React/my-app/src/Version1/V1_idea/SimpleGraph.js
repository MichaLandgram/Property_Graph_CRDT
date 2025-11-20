import * as Y from 'yjs'


// const ydoc = new Y.Doc()
// const nodesMap = ydoc.getMap('nodes')
// const tombNodes = ydoc.getMap('removedNodes')
// const edgesMap = ydoc.getMap('edges')

export function addNode({ id, initialProps = {}, graph }) {
  console.log('Add Node:', id, initialProps);
  const nodesMap = graph.getMap('nodes')
  const nodeProps = new Y.Map()

  for (const [key, value] of Object.entries(initialProps)) {
    nodeProps.set(key, value)
  }
  
  graph.transact(() => {
    nodesMap.set(id, nodeProps)
  })
}

// export function updateNode({ id, props, graph }) {
//   const nodesMap = graph.getMap('nodes');
//   console.log('Before Update Node Map:', nodesMap.get(id)?.toJSON());
//   const node = nodesMap.get(id) || new Y.Map();
//   console.log('Updated Node Map:', nodesMap.toJSON(), id, node.toJSON());
  
//   graph.transact(() => {
//     for (const [k, v] of Object.entries(props)) {
//     node.set(k, v);
//   }
//   });
//   // nodesMap.set(id, node.clone());
// }

export function updateNode({ id, props, graph }) {
  const nodesMap = graph.getMap('nodes');
  let isNewNode = false;
  let node = nodesMap.get(id);

  if (!node) {
    node = new Y.Map();
    isNewNode = true;
  }
  
  graph.transact(() => {
    for (const [k, v] of Object.entries(props)) {
      node.set(k, v);
    }
    
    if (isNewNode) {
        nodesMap.set(id, node);
    }
  });
}

export function deleteNode({ id, graph }) {
  const nodesMap = graph.getMap('nodes')
  const tombNodes = graph.getMap('removedNodes')
  const node = nodesMap.get(id);

  if (!node) return;

  const policy = node.get('policy');
  
  graph.transact(() => {
    if (policy === 'REMOVE_WINS') {

      tombNodes.set(id, Date.now());
      
    } else if (policy === 'ADD_WINS') {

      nodesMap.delete(id);

      tombNodes.delete(id); 
    }
  });
}

export function getVisibleNodes({ graph }) {
  const nodesMap = graph.getMap('nodes')
  const tombNodes = graph.getMap('removedNodes')

  const visible = [];
  
  nodesMap.forEach((node, id) => {
    const policy = node.get('policy');
    
    if (!node) return; 

    if (policy === 'REMOVE_WINS') {
      if (tombNodes.has(id)) {
        return; // (Remove Wins)
      }
    } 
    
    visible.push({ id, ...node.toJSON(), policy });
  });
  
  return visible;
}

function addEdge(id, sourceId, targetId, initialProps = {}) {
  const edgeProps = new Y.Map()

  edgeProps.set('source', sourceId)
  edgeProps.set('target', targetId)
  

  for (const [key, value] of Object.entries(initialProps)) {
    edgeProps.set(key, value)
  }

  // ydoc.transact(() => {
  //   edgesMap.set(id, edgeProps)
  // })
}

export function test () {
  const graph = new Y.Doc()
  graph.getMap('nodes')
  graph.getMap('removedNodes')
  graph.getMap('edges')
}


export function test2 () {
  addNode('node-3', { label: 'City', name: 'Wonderland' })


}