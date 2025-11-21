import * as Y from 'yjs'


// const ydoc = new Y.Doc()

// const ydoc = new Y.Doc() // Represents the collaborative graph
// const nodesMap = ydoc.getMap('nodes') // Map of nodeId to touch timestamps
// const propertiesMap = ydoc.getMap('properties') // Map of nodeId to node properties
// const tombNodes = ydoc.getMap('removedNodes') // Map of removed nodeIds (tombstones)
// const edgesMap = ydoc.getMap('edges') // Map of nodeEdgeConnectId to EdgeYJSMap [target maps to Properties] [not used here]


const minimalInitialProps = {
  policy: 'ADD_WINS',
  label: 'Node',
};

export function addNode({ id, initialProps = minimalInitialProps, graph }) {
  console.log("hi");
  const nodesMap = graph.getMap('nodes');
  const propertiesMap = graph.getMap('properties');
  
  const nodeProps = new Y.Map();

  for (const [key, value] of Object.entries(initialProps)) {
    nodeProps.set(key, value);
  }
  
  graph.transact(() => {
    nodesMap.set(id, Date.now());
    propertiesMap.set(id, nodeProps);
  });
}

export function updateNode({ id, props, graph }) {
  const nodesMap = graph.getMap('nodes');
  const propertiesMap = graph.getMap('properties');
  const nodeProps = propertiesMap.get(id) || new Y.Map();

  graph.transact(() => {
    for (const [k, v] of Object.entries(props)) {
    nodeProps.set(k, v);
    nodesMap.set(id, Date.now());
  }});
}

export function deleteNode({ id, graph }) {
  const nodesMap = graph.getMap('nodes')
  const tombNodes = graph.getMap('removedNodes')
  const propertiesMap = graph.getMap('properties')
  const node = propertiesMap.get(id);

  if (!node) return;

  const policy = node.get('policy');
  
  graph.transact(() => {
    if (policy === 'REMOVE_WINS') {

      tombNodes.set(id, Date.now());
      propertiesMap.delete(id);
      nodesMap.delete(id);
      
    } else if (policy === 'ADD_WINS') {

      nodesMap.delete(id);
      tombNodes.delete(id);
    }
  });
}

export function addEdge({ sourceId, targetId, initialProps = {}, graph }) {
  const edgesMap = graph.getMap('edges')
  let edgeMap = edgesMap.get(sourceId);
  
  graph.transact(() => {
    if (!edgeMap) {
      edgeMap = new Y.Map();
      edgesMap.set(sourceId, edgeMap);
    }
    
    const edgeProps = new Y.Map();
    for (const [key, value] of Object.entries(initialProps)) {
      edgeProps.set(key, value);
    }
    edgeMap.set(targetId, edgeProps);
  });
}

export function updateEdge({ sourceId, targetId, props, graph }) {
  // TODO
}

export function removeEdge({ sourceId, targetId, graph }) {
  const edgesMap = graph.getMap('edges')
  const edgeMap = edgesMap.get(sourceId);
  if (!edgeMap) {
    console.error(`Edge map for sourceId ${sourceId} does not exist.`);
    return;
  }
  edgeMap.delete(targetId);
}

export function getVisibleNodes({ graph }) {
  const nodesMap = graph.getMap('nodes')
  const tombNodes = graph.getMap('removedNodes')
  const propertiesMap = graph.getMap('properties')
  const visible = [];
  
  nodesMap.forEach((node, id) => {
    if (!propertiesMap.has(id) && !tombNodes.has(id)) {
      console.error(`Node properties missing for node id: ${id}`);
      return;
    }
    if (tombNodes.has(id)) {
      return;
    }
    const props = propertiesMap.get(id);
    const policy = props.get('policy');
    if (!node) return; 

    if (policy === 'REMOVE_WINS') {
      if (tombNodes.has(id)) {
        return;
      }
    }
      visible.push({ id, ...props.toJSON(), policy });
  });
  
  return visible;
}

export function getNodeProps(graph, id) {
  const propertiesMap = graph.getMap('properties');
  return propertiesMap.get(id).toJSON();
}

export function getEdges({ graph }) {
  const edgesMap = graph.getMap('edges');
  const nodes = graph.getMap('nodes');
  const edges = [];
  for (let sourceId of nodes.keys()) {
    const edgeMap = edgesMap.get(sourceId);
    if (!edgeMap) {
      console.log("No edge map for sourceId:", sourceId);
      edges.push(...[]);
      continue;
    }
    edgeMap.forEach((props, targetId) => {
      edges.push({ sourceId, targetId, ...props.toJSON() });
    });
  }
  return edges;
}