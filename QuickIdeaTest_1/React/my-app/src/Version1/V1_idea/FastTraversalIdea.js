
const outgoingIndex = new Map()


edgesMap.observe(event => {
  event.changes.keys.forEach((change, key) => {
    if (change.action === 'add') {
      const edge = edgesMap.get(key)
      const source = edge.get('source')
      
      if (!outgoingIndex.has(source)) {
        outgoingIndex.set(source, new Set())
      }
      outgoingIndex.get(source).add(key) // Edge ID speichern
    }
    
    if (change.action === 'delete') {

    }
  })
})

function getOutgoingEdges(nodeId) {
  const edgeIds = outgoingIndex.get(nodeId) || new Set()
  const edges = []
  edgeIds.forEach(edgeId => {
    if (edgesMap.has(edgeId)) {
      edges.push(edgesMap.get(edgeId).toJSON())
    }
  })
  return edges
}