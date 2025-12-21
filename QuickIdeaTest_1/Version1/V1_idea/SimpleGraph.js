import * as Y from 'yjs'

const ydoc = new Y.Doc()

const nodesMap = ydoc.getMap('nodes')
const removalMap = ydoc.getMap('removals')
const edgesMap = ydoc.getMap('edges')

function addNode(id, initialProps = {}) {
  const nodeProps = new Y.Map()
  for (const [key, value] of Object.entries(initialProps)) {
    nodeProps.set(key, value)
  }
  ydoc.transact(() => {
    nodesMap.set(id, nodeProps)
  })
}

function updateNode(id, updatedProps = {}) {
  const nodeProps = nodesMap.get(id) || new Y.Map()
  for (const [key, value] of Object.entries(updatedProps)) {
    nodeProps.set(key, value);
  }
}

function deleteNode(id) {
  // no nodeDeletionMap needed, just mark deletion time
  removalsMap.set(id, Date.now()); 
}

function addEdge(id, sourceId, targetId, initialProps = {}) {
  const edgeProps = new Y.Map()
  
  edgeProps.set('source', sourceId)
  edgeProps.set('target', targetId)
  
  for (const [key, value] of Object.entries(initialProps)) {
    edgeProps.set(key, value)
  }

  ydoc.transact(() => {
    edgesMap.set(id, edgeProps)
  })
}

function getVisibleNodes() {
  const visible = [];
  nodesMap.forEach((node, id) => {
    if (!removalsMap.has(id)) {
      visible.push(node.toJSON());
    }
  });
  return visible;
}

// --- Test ---

// Knoten erstellen
addNode('node-1', { label: 'Person', name: 'Alice' })
addNode('node-2', { label: 'Person', name: 'Bob' })

updateNode('node-1', { age: 30 })

// Kante erstellen (Alice KENNT Bob)
addEdge('edge-1', 'node-1', 'node-2', { label: 'KNOWS', since: 2023 })

// Zugriff auf Daten
const alice = nodesMap.get('node-1')

const connection = edgesMap.get('edge-1')