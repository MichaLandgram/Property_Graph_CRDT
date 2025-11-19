// Lokaler Index (Adjazenzliste)
// Map<NodeID, Set<EdgeID>>
const outgoingIndex = new Map()

/**
 * Aktualisiert den Index basierend auf Yjs Events
 */
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
      // Logik zum Entfernen aus dem Index hier implementieren
      // (Hinweis: Man muss die alte sourceId kennen, ggf. aus change.oldValue)
    }
  })
})

// Schnelle Abfrage: "Gib mir alle Kanten von Node-1"
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