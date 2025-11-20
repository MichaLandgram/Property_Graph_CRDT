import React, { useState, useMemo } from 'react';
import ReactFlow, { Background, Controls, Handle, Position } from 'reactflow';
import 'reactflow/dist/style.css';
import * as Y from 'yjs';
import { useYjsGraph } from '../../Helper/Hook/YJS_hook_V1';
import { addNode, updateNode, deleteNode } from '../../Version1/V2_idea/SimpleGraph';

const DatabaseNode = ({ data, id, color }) => {
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


const GraphEditor = ({ ydoc }) => { 
  const { nodes, onNodesChange } = useYjsGraph(ydoc);
  const [selectedNode, setSelectedNode] = useState(null);
  const [formData, setFormData] = useState({});

  const selectNode = (node) => {
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

  const handleNodeClick = (_, node) => {
    selectNode(node);
  };

  const handlePaneClick = () => {
    selectNode(null);
  };

  const handleAddNode = () => {
    const id = `node-${Date.now()}`;
    const policy = Math.random() > 0.5 ? 'ADD_WINS' : 'REMOVE_WINS';
    const color = policy === 'ADD_WINS' ? '#a0e7e5' : '#ffaeae';
    addNode({
      id,
      initialProps: { 
        label: 'New', 
        x: Math.random() * 400, 
        y: Math.random() * 400,
        policy: policy,
        color: color,
          data1: 'Default Data',
          data2: 'More Default Data',
          data3: 'Even More Default Data'
      },
      graph: ydoc
    });
  };
  const handleUpdateFormChange = (key, value) => {
      setFormData((prev) => ({
      ...prev,
      [key]: value
    }));
  }
  const handleUpdateProperty = () => {
    if (!selectedNode) return;
    updateNode({
        id: selectedNode.id,
        props: { ...formData },
        graph: ydoc
    });
  };

  const handleDelete = () => {
      if(!selectedNode) return;
      deleteNode({ id: selectedNode.id, graph: ydoc });
      selectNode(null);
  }

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100%' }}>
      
      {/* Der Graph Bereich */}
      <div style={{ flex: 1 }}>
        <ReactFlow
          nodes={nodes}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onNodeClick={handleNodeClick}
          onPaneClick={handlePaneClick}
          fitView
        >
          <Background />
          <Controls />
        </ReactFlow>
        
        <button 
            onClick={handleAddNode} 
            style={{ position: 'absolute', top: 10, left: 10, zIndex: 5 }}
        >
            + Node hinzufügen
        </button>
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
        <button onClick={handleUpdateProperty}>Aktualisieren</button>


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