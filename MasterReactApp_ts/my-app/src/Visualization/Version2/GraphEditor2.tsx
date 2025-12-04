import React, { useState, useCallback } from 'react';
import { GraphCanvas, GraphCanvasRef, useSelection } from 'reagraph';
import * as Y from 'yjs';
import { useYjsGraphReagraph, ReagraphNode } from '../../Helper/Hook/YJS_hook_Reagraph';
import { SGraphV4 } from '../../Version1/V4/SimpleGraph';

interface GraphEditorProps {
  ydoc: Y.Doc;
}

const graphInstance = new SGraphV4();

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
      } else {
        if (sourceNodeForEdge === node.id) {
            // Cannot connect to self, just reset source or ignore
            alert('Cannot connect to self');
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
        label: 'Doctor', 
        policy: policy,
        color: color
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
          // @ts-ignore
          edgeInterpolation="curved"
          // @ts-ignore
          linkCurvature={(edge: any) => edge.curvature || 0}
          // @ts-ignore
          edgeCurvature={(edge: any) => edge.curvature || 0}
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
        
        {connectMode && (
            <div style={{ position: 'absolute', top: 50, left: 10, zIndex: 5, background: 'rgba(255, 255, 255, 0.9)', padding: '8px', borderRadius: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                {!sourceNodeForEdge ? (
                    <span><strong>Step 1:</strong> Select Source Node</span>
                ) : (
                    <span><strong>Step 2:</strong> Select Target Node (or click source again to reset)</span>
                )}
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
