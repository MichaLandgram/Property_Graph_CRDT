import React, { useState, useCallback } from 'react';
import { GraphCanvas, GraphCanvasRef, useSelection } from 'reagraph';
import * as Y from 'yjs';
import { useYjsGraphReagraph, ReagraphNode } from '../../Helper/Hook/YJS_hook_Reagraph';
import { SGraphV3 } from '../../Version1/V3_idea/SimpleGraph';

interface GraphEditorProps {
  ydoc: Y.Doc;
}

const graphInstance = new SGraphV3();

const GraphEditor2: React.FC<GraphEditorProps> = ({ ydoc }) => {
  const { nodes, edges } = useYjsGraphReagraph(ydoc);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [connectMode, setConnectMode] = useState(false);
  const [sourceNodeForEdge, setSourceNodeForEdge] = useState<string | null>(null);

  // Ref for the graph canvas to access internal methods if needed
  const graphRef = React.useRef<GraphCanvasRef | null>(null);

  const handleNodeClick = useCallback((node: any) => {
    // node is the Reagraph node object
    if (connectMode) {
      if (!sourceNodeForEdge) {
        setSourceNodeForEdge(node.id);
        alert(`Source selected: ${node.label || node.id}. Now select target.`);
      } else {
        if (sourceNodeForEdge === node.id) {
            alert("Cannot connect node to itself.");
            setSourceNodeForEdge(null);
            return;
        }
        // Create Edge
        const newEdgeId = `edge-${sourceNodeForEdge}-${node.id}-${Date.now()}`;
        graphInstance.addEdge({
            sourceId: sourceNodeForEdge,
            targetId: node.id,
            initialProps: { label: 'New Edge' },
            graph: ydoc
        });
        setSourceNodeForEdge(null);
        setConnectMode(false);
      }
      return;
    }

    setSelectedNodeId(node.id);
    setFormData(node.data || {});
  }, [connectMode, sourceNodeForEdge, ydoc]);

  const handleCanvasClick = useCallback(() => {
    if (!connectMode) {
        setSelectedNodeId(null);
        setFormData({});
    }
  }, [connectMode]);

  const handleAddNode = () => {
    const id = `node-${Date.now()}`;
    const policy = Math.random() > 0.5 ? 'ADD_WINS' : 'REMOVE_WINS';
    const color = policy === 'ADD_WINS' ? '#a0e7e5' : '#ffaeae';
    
    graphInstance.addNode({
      nodeId: id,
      initialProps: { 
        label: 'New Node', 
        policy: policy,
        color: color,
        // Reagraph might use 'size' or 'val'
      },
      graph: ydoc
    });
  };

  const handleUpdateFormChange = (key: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  const handleUpdateProperty = (key?: string, value?: string) => {
    if (!selectedNodeId) return;
    
    if (key && value) {
        graphInstance.updateNode({
            nodeId: selectedNodeId,
            props: { [key]: value },
            graph: ydoc
        });
        setFormData(prev => ({ ...prev, [key]: value }));
        return;
    }

    graphInstance.updateNode({
        nodeId: selectedNodeId,
        props: { ...formData },
        graph: ydoc
    });
  };

  const handleDelete = () => {
      if(!selectedNodeId) return;
      graphInstance.deleteNode({ nodeId: selectedNodeId, graph: ydoc });
      setSelectedNodeId(null);
      setFormData({});
  };

  // Map nodes to include visual properties expected by Reagraph if needed
  // Reagraph uses 'id', 'label'. 'fill' can be used for color.
  const visualNodes = nodes.map(n => ({
      ...n,
      fill: n.data.color || '#a0e7e5',
      // If reagraph supports size:
      size: 20
  }));

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100%', position: 'relative' }}>
      
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <GraphCanvas
          ref={graphRef}
          nodes={visualNodes}
          edges={edges}
          onNodeClick={handleNodeClick}
          onCanvasClick={handleCanvasClick}
          draggable={true}
          layoutType="forceDirected2d"
          labelType="all"
          sizingType="centrality"
        />
        
        <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 5, display: 'flex', gap: '10px' }}>
          <button onClick={handleAddNode}>
              + Add Node
          </button>
          <button 
            onClick={() => { setConnectMode(!connectMode); setSourceNodeForEdge(null); }} 
            style={{ background: connectMode ? '#ffeb3b' : '#e0e0e0' }}
          >
            {connectMode ? 'Cancel Connection' : 'Connect Nodes'}
          </button>
        </div>
        
        {connectMode && sourceNodeForEdge && (
            <div style={{ position: 'absolute', top: 50, left: 10, zIndex: 5, background: 'rgba(255, 255, 255, 0.8)', padding: '5px' }}>
                Select target node...
            </div>
        )}
      </div>

      {selectedNodeId && (
        <div style={{ width: '300px', borderLeft: '1px solid #ccc', padding: '20px', background: '#f9f9f9', overflowY: 'auto' }}>
          <h3>Properties</h3>
          <p>ID: {selectedNodeId}</p>
          
          {
          Object.entries(formData).map(([key, value]) => {
                if (key === 'label' || key === 'color' || key === 'policy' || key === 'id') return null;
                if (key === 'position') {
                Object.entries(value).map(([key2, value2]) => {
                    return (
                        <div key={key2} style={{ marginBottom: '10px' }}>
                            <label style={{ display: 'block', fontSize: '0.8em', color: '#555' }}>{key}:</label>
                            <input
                                type="text"
                                value={String(value2)} 
                                onChange={(e) => handleUpdateFormChange(key, e.target.value)}
                                style={{ width: '100%' }}
                            />
                        </div>
                    )
                });
                }
                return (
                    <div key={key} style={{ marginBottom: '10px' }}>
                        <label style={{ display: 'block', fontSize: '0.8em', color: '#555' }}>{key}:</label>
                        <input
                            type="text"
                            value={String(value)} 
                            onChange={(e) => handleUpdateFormChange(key, e.target.value)}
                            style={{ width: '100%' }}
                        />
                    </div>
            );
          })
        }
        
        <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', fontSize: '0.8em', color: '#555' }}>Label:</label>
            <input
                type="text"
                value={formData.label || ''} 
                onChange={(e) => handleUpdateFormChange('label', e.target.value)}
                style={{ width: '100%' }}
            />
        </div>

        <button onClick={() => handleUpdateProperty()}>Update All</button>

          <label style={{marginTop: 10, display: 'block'}}>Color:</label>
          <input 
            type="color"
            value={formData.color || '#ffffff'} 
            onChange={(e) => handleUpdateProperty('color', e.target.value)}
          />

          <hr />
          <button 
            onClick={handleDelete}
            style={{ background: 'red', color: 'white', border: 'none', padding: '5px 10px' }}
          >
            Delete Node
          </button>
        </div>
      )}
    </div>
  );
};

export default GraphEditor2;
