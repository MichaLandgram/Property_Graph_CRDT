import * as Y from 'yjs'


const ydoc = new Y.Doc()


const nodesMap = ydoc.getMap('nodes')
const tombNodes = ydoc.getMap('removedNodes')
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

function updateNode(id, props) {
  // User B macht ein Update (würde bei nativem Yjs ein "Delete" überschreiben)
  const node = nodesMap.get(id) || new Y.Map();
  for (const [k, v] of Object.entries(props)) node.set(k, v);
  nodesMap.set(id, node);
}

function deleteNode(id) {
  // WICHTIG: Wir löschen nicht aus 'nodesMap'!
  // Wir setzen einen Eintrag in die Blacklist.
  tombNodes.set(id, Date.now()); 
}

function getVisibleNodes() {
  const visible = [];
  nodesMap.forEach((node, id) => {
    // REMOVE WINS CHECK:
    // Selbst wenn User B gerade 100 Updates auf 'nodesMap' gemacht hat:
    // Wenn die ID in 'tombNodes' ist, ignorieren wir den Knoten.
    if (!tombNodes.has(id)) {
      visible.push(node.toJSON());
    }
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

  ydoc.transact(() => {
    edgesMap.set(id, edgeProps)
  })
}

export function test () {
  addNode('node-1', { label: 'Person', name: 'Alice' })
  addNode('node-2', { label: 'Person', name: 'Bob' })
  addEdge('edge-1', 'node-1', 'node-2', { label: 'KNOWS', since: 2023 })
  const alice = nodesMap.get('node-1')
  console.log(alice.toJSON()) // { label: 'Person', name: 'Alice' }
  const connection = edgesMap.get('edge-1')
  console.log(connection.toJSON()) // { source: 'node-1', target: 'node-2', label: 'KNOWS', since: 2023 }
}

export function test2 () {
  addNode('node-3', { label: 'City', name: 'Wonderland' })


}