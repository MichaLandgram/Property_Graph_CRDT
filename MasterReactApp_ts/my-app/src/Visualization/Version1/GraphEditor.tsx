import React, { useState, useMemo, useCallback } from 'react';
import ReactFlow, { Background, Controls, Handle, Position, Node, Connection } from 'reactflow';
import 'reactflow/dist/style.css';
import * as Y from 'yjs';
import { useYjsGraph } from '../../Helper/Hook/YJS_hook_V1';
import { SGraphV4 } from '../../Version1/V4/SimpleGraph';

// Suppress ResizeObserver loop error
const originalError = console.error;
console.error = (...args) => {
  if (/ResizeObserver loop/.test(args[0])) {
    return;
  }
  originalError.call(console, ...args);
};

window.addEventListener('error', (e) => {
  if (e.message === 'ResizeObserver loop completed with undelivered notifications.' || 
      e.message === 'ResizeObserver loop limit exceeded') {
    e.stopImmediatePropagation();
  }
}, true);

interface DatabaseNodeProps {
  data: any;
  id: string;
}

const DatabaseNode: React.FC<DatabaseNodeProps> = ({ data, id }) => {
  return (
    <div style={{
      padding: '10px',
      borderRadius: '50%',
      border: '2px solid #555',
      background: data.color || '#fff',
      width: '60px',
      height: '60px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      fontSize: '10px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
    }}>
      <strong>{data.label}</strong>
      {/* Handles für Kanten (Edges) */}
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </div>
  );
};

interface GraphEditorProps {
  ydoc: Y.Doc;
}

const graphInstance = new SGraphV4();

const GraphEditor: React.FC<GraphEditorProps> = ({ ydoc }) => { 
  const { nodes, onNodesChange, edges, onEdgesChange } = useYjsGraph(ydoc);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isLocked, setIsLocked] = useState(false);

  const selectNode = (node: Node | null) => {
    if (!node) {
      setSelectedNode(null);
      setFormData({});
      return;
    } else {
      setSelectedNode(node);
      setFormData(node.data || {});
    }
  }

  const nodeTypes = useMemo(() => ({ databaseNode: DatabaseNode }), []);

  const handleNodeClick = (_: React.MouseEvent, node: Node) => {
    selectNode(node);
  };

  const handlePaneClick = () => {
    selectNode(null);
  };

  const handleAddNode = () => {
    const id = `node-${Date.now()}`;
    const policy = Math.random() > 0.5 ? 'ADD_WINS' : 'REMOVE_WINS';
    const color = policy === 'ADD_WINS' ? '#a0e7e5' : '#ffaeae';
    graphInstance.addNode({
      nodeId: id,
      initialProps: { 
        label: 'Doctor', 
        position : { x: Math.random() * 400, y: Math.random() * 400 },
        policy: policy,
        color: color,
        TESTDATA1: 'Default Data',
        TESTDATA2: 'More Default Data',
        TESTDATA3: 'Even More Default Data'
      },
      graph: ydoc
    });
  };

  const handleUpdateFormChange = (key: string, value: string) => {
      setFormData((prev) => ({
      ...prev,
      [key]: value
    }));
  }
  const handleUpdateProperty = (key?: string, value?: string) => {
    if (!selectedNode) return;
    
    // If key/value provided (like color), update directly
    if (key && value) {
        graphInstance.updateNode({
            nodeId: selectedNode.id,
            props: { [key]: value },
            graph: ydoc
        });
        // Also update local form data if needed
        setFormData(prev => ({ ...prev, [key]: value }));
        return;
    }

    // Otherwise update from formData
    graphInstance.updateNode({
        nodeId: selectedNode.id,
        props: { ...formData },
        graph: ydoc
    });
  };

  const handleDelete = () => {
      if(!selectedNode) return;
      graphInstance.deleteNode({ nodeId: selectedNode.id, graph: ydoc });
      selectNode(null);
  }


const onEdgeAdd = useCallback((params: Connection) => {
    if (!params.source || !params.target) return;

    const newEdge = {
      ...params,
      source: params.source,
      target: params.target,
      id: `rf-${params.source}-${params.target}-${Date.now()}`, 
      animated: true,
      type: 'default',
      data: {
        label: 'New Edge'
      }
    };

    onEdgesChange([{ 
        type: 'add', 
        item: newEdge 
    }]);

  }, [onEdgesChange]);


  return (
    // console.log("Rendering GraphEditor", ydoc.getMap('edges').toJSON()),
    <div style={{ display: 'flex', height: '100vh', width: '100%' }}>
      
      <div style={{ flex: 1 }}>
        <ReactFlow
          nodes={nodes}
          nodeTypes={nodeTypes}
          edges={edges}
          onNodesChange={onNodesChange}
          onNodeClick={handleNodeClick}
          onPaneClick={handlePaneClick}
          onEdgesChange={onEdgesChange}
          onConnect={onEdgeAdd}
          nodesDraggable={!isLocked}
          fitView
        >
          <Background />
          <Controls />
        </ReactFlow>
        
        <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 5, display: 'flex', gap: '10px' }}>
          <button onClick={handleAddNode}>
              + Node hinzufügen
          </button>
          <button onClick={() => setIsLocked(!isLocked)} style={{ background: isLocked ? '#ffcccc' : '#ccffcc' }}>
            {isLocked ? 'Unlock Layout' : 'Lock Layout'}
          </button>
        </div>
      </div>

      {selectedNode && (
        <div style={{ width: '300px', borderLeft: '1px solid #ccc', padding: '20px', background: '#f9f9f9' }}>
          <h3>Eigenschaften</h3>
          <p>ID: {selectedNode.id}</p>
          
          {
          Object.entries(selectedNode.data).map(([key, value]) => {
                if (key === 'label' || key === 'color' || key === 'policy' || key === 'id') return null; // Skip label and color here
                return (
                    <div key={key} style={{ marginBottom: '10px' }}>
                        <label style={{ display: 'block', fontSize: '0.8em', color: '#555' }}>{key}:</label>
                        <input
                            type="text"
                            value={String(formData[key] !== undefined ? formData[key] : value)} 
                            onChange={(e) => { handleUpdateFormChange(key, e.target.value); console.log(formData); }}
                            style={{ width: '100%' }}
                        />
                        </div>
            );
          })
        }
        <button onClick={() => handleUpdateProperty()}>Aktualisieren</button>


          <label style={{marginTop: 10, display: 'block'}}>Farbe:</label>
          <input 
            type="color"
            value={selectedNode.data.color || '#ffffff'} 
            onChange={(e) => handleUpdateProperty('color', e.target.value)}
          />

          <hr />
          <button 
            onClick={handleDelete}
            style={{ background: 'red', color: 'white', border: 'none', padding: '5px 10px' }}
          >
            Knoten löschen
          </button>
        </div>
      )}
    </div>
  );
};

export default GraphEditor;