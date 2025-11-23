import * as Y from 'yjs'


// const ydoc = new Y.Doc()

// const ydoc = new Y.Doc() // Represents the collaborative graph
// const nodesMap = ydoc.getMap('nodes') // Map of nodeId to touch timestamps
// const propertiesMap = ydoc.getMap('properties') // Map of nodeId to node properties
// const tombNodes = ydoc.getMap('removedNodes') // Map of removed nodeIds (tombstones)
// const edgesMap = ydoc.getMap('edges') // Map of nodeId to EdgeYJSMap [target maps to Properties] [not used here]


const minimalInitialProps: Record<string, any> = {
  policy: 'ADD_WINS',
  label: 'Node',
};

interface AddNodeArgs {
  id: string;
  initialProps?: Record<string, any>;
  graph: Y.Doc;
}

export function addNode({ id, initialProps = minimalInitialProps, graph }: AddNodeArgs) {
  const nodesMap = graph.getMap<number>('nodes');
  const propertiesMap = graph.getMap<Y.Map<any>>('properties');
  
  const nodeProps = new Y.Map();

  for (const [key, value] of Object.entries(initialProps)) {
    nodeProps.set(key, value);
  }
  
  graph.transact(() => {
    nodesMap.set(id, Date.now());
    propertiesMap.set(id, nodeProps);
  });
}

interface UpdateNodeArgs {
  id: string;
  props: Record<string, any>;
  graph: Y.Doc;
}

export function updateNode({ id, props, graph }: UpdateNodeArgs) {
  const nodesMap = graph.getMap<number>('nodes');
  const propertiesMap = graph.getMap<Y.Map<any>>('properties');
  const nodeProps = propertiesMap.get(id) || new Y.Map();

  graph.transact(() => {
    for (const [k, v] of Object.entries(props)) {
    nodeProps.set(k, v);
    nodesMap.set(id, Date.now());
  }});
}

interface DeleteNodeArgs {
  id: string;
  graph: Y.Doc;
}

export function deleteNode({ id, graph }: DeleteNodeArgs) {
  const nodesMap = graph.getMap<number>('nodes')
  const tombNodes = graph.getMap<number>('removedNodes')
  const propertiesMap = graph.getMap<Y.Map<any>>('properties')
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

interface AddEdgeArgs {
  sourceId: string;
  targetId: string;
  initialProps?: Record<string, any>;
  graph: Y.Doc;
}

export function addEdge({ sourceId, targetId, initialProps = {}, graph }: AddEdgeArgs) {
  const edgesMap = graph.getMap<Y.Map<Y.Map<any>>>('edges');
  const nodesMap = graph.getMap<number>('nodes');
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
    nodesMap.set(sourceId, Date.now());
    nodesMap.set(targetId, Date.now());
  });
}

interface UpdateEdgeArgs {
  sourceId: string;
  targetId: string;
  props: Record<string, any>;
  graph: Y.Doc;
}

export function updateEdge({ sourceId, targetId, props, graph }: UpdateEdgeArgs) {
  // TODO
}

interface RemoveEdgeArgs {
  sourceId: string;
  targetId: string;
  graph: Y.Doc;
}

export function removeEdge({ sourceId, targetId, graph }: RemoveEdgeArgs) {
  const edgesMap = graph.getMap<Y.Map<Y.Map<any>>>('edges')
  const edgeMap = edgesMap.get(sourceId);
  if (!edgeMap) {
    console.error(`Edge map for sourceId ${sourceId} does not exist.`);
    return;
  }
  edgeMap.delete(targetId);
}

interface GetVisibleNodesArgs {
  graph: Y.Doc;
}

export function getVisibleNodes({ graph }: GetVisibleNodesArgs) {
  const nodesMap = graph.getMap<number>('nodes')
  const tombNodes = graph.getMap<number>('removedNodes')
  const propertiesMap = graph.getMap<Y.Map<any>>('properties')
  const visible: any[] = [];
  
  nodesMap.forEach((node, id) => {
    if (!propertiesMap.has(id) && !tombNodes.has(id)) {
      console.error(`Node properties missing for node id: ${id}`);
      return;
    }
    if (tombNodes.has(id)) {
      return;
    }
    const props = propertiesMap.get(id);
    if (!props) return;
    const policy = props.get('policy');
    // if (!node) return; // node is timestamp number, always truthy if exists

    if (policy === 'REMOVE_WINS') {
      if (tombNodes.has(id)) {
        return;
      }
    }
      visible.push({ id, ...props.toJSON(), policy });
  });
  
  return visible;
}

export function getNodeProps(graph: Y.Doc, id: string) {
  const propertiesMap = graph.getMap<Y.Map<any>>('properties');
  const props = propertiesMap.get(id);
  return props ? props.toJSON() : null;
}

interface GetEdgesArgs {
  graph: Y.Doc;
}

export function getEdges({ graph }: GetEdgesArgs) {
  const edgesMap = graph.getMap<Y.Map<Y.Map<any>>>('edges');
  const nodes = graph.getMap<number>('nodes');
  const edges: any[] = [];
  for (let sourceId of Array.from(nodes.keys())) {
    const edgeMap = edgesMap.get(sourceId);
    if (!edgeMap) {
      // console.log("No edge map for sourceId:", sourceId);
      // edges.push(...[]);
      continue;
    }
    edgeMap.forEach((props, targetId) => {
      edges.push({ sourceId, targetId, ...props.toJSON() });
    });
  }
  return edges;
}