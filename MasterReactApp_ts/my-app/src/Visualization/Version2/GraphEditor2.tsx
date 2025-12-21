import React, { useState, useCallback } from 'react';
import { GraphCanvas, GraphCanvasRef, useSelection } from 'reagraph';
import * as Y from 'yjs';
import { useYjsGraphReagraph, ReagraphNode } from '../../Helper/Hook/YJS_hook_Reagraph';
import { dumpGraphToNeo4j } from '../../Helper/Vizuals/Neo4jConnector';
import { edgeLabelTypes, AlwaysNodeData } from '../../Helper/types_interfaces/types';
import { getGraphInstance, getSchemaInstance } from '../../VersionSelector';
import { useGraphErrorHandler } from '../../Helper/useGraphErrorHandler';


interface GraphEditorProps {
  ydoc: Y.Doc;
}

const testWrongLabel = ['Gnom', 'Wizard', 'Orc', 'Elf', 'Dwarf', 'Halfling', 'Dragon', 'Giant', 'Goblin', 'Golem'];

const graphInstance = getGraphInstance();
const schemaInstance = getSchemaInstance();

const GraphEditor2: React.FC<GraphEditorProps> = ({ ydoc }) => {
  const { nodes, edges } = useYjsGraphReagraph(ydoc);
  const handleError = useGraphErrorHandler();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [selectedEdgeData, setSelectedEdgeData] = useState<any>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [connectMode, setConnectMode] = useState(false);
  const [sourceNodeForEdge, setSourceNodeForEdge] = useState<AlwaysNodeData | null>(null);
  
  // Edge Dialog
  const [showEdgeDialog, setShowEdgeDialog] = useState(false);
  const [pendingTargetNode, setPendingTargetNode] = useState<AlwaysNodeData | null>(null);
  const [edgeLabel, setEdgeLabel] = useState<edgeLabelTypes>('DEFAULT');
  const [edgePlaceholder, setEdgePlaceholder] = useState('');

  //Node Dialog
  const [showNodeDialog, setShowNodeDialog] = useState(false);
  const [newNodeLabel, setNewNodeLabel] = useState<string>(schemaInstance.labelTypeValues[0] || 'Person');

  // Ref for the graph canvas to access internal methods if needed
  const graphRef = React.useRef<GraphCanvasRef | null>(null);

  const handleNodeClick = useCallback((node: any) => {
    // node is the Reagraph node object
    if (connectMode) {
      if (!sourceNodeForEdge) {
        setSourceNodeForEdge(node);
      } else {
        setPendingTargetNode(node);
        setShowEdgeDialog(true);
        setEdgeLabel('');
        setEdgePlaceholder('');
      }
      return;
    }

    setSelectedNodeId(node.id);
    setSelectedEdgeId(null); // Clear edge selection
    setFormData(node.data || {});
  }, [connectMode, sourceNodeForEdge, ydoc]);

  const handleEdgeClick = useCallback((edge: any) => {
    if (connectMode) return;
    
    console.log('Edge Clicked:', edge);
    setSelectedEdgeId(edge.id);
    setSelectedNodeId(null); // Clear node selection
    setSelectedEdgeData({
        source: edge.source,
        target: edge.target,
        id: edge.id
    });
    setFormData(edge.data || {});
  }, [connectMode]);

  const handleCanvasClick = useCallback(() => {
    if (!connectMode) {
        setSelectedNodeId(null);
        setSelectedEdgeId(null);
        setFormData({});
    }
  }, [connectMode]);



  const handleAddNodeClick = () => {
    setShowNodeDialog(true);
    setNewNodeLabel(schemaInstance.labelTypeValues[0] || 'Person');
  };

  const handleTestClick = () => {
    try {
        console.log('Test Clicked');
        graphInstance.testProps("s", 'Person', 'notNull', 'Node');
    } catch (e) {
        handleError(e as Error);
    }
  };

  const handleConfirmAddNode = () => {
    try {
        const id = `node-${Date.now()}`;
        const policy = Math.random() > 0.5 ? 'ADD_WINS' : 'REMOVE_WINS';
        const color = policy === 'ADD_WINS' ? '#a0e7e5' : '#ffaeae';
        
        graphInstance.addNode({
        alwaysProps: {
            id: id,
            position : { x: Math.random() * 400, y: Math.random() * 400 },
            label: newNodeLabel, 
            policy: policy,
            color: color,
        },
        initialProps: { 
            test: 'test'
        },
        graph: ydoc
        });
        setShowNodeDialog(false);
    } catch (e) {
        handleError(e as Error);
    }
  };

  const handleUpdateFormChange = (key: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  const handleCreateEdge = () => {
    if (!sourceNodeForEdge || !pendingTargetNode) return;
     console.log('Creating edge from', sourceNodeForEdge.id, 'to', pendingTargetNode.id); 
     console.log('Edge label:', edgeLabel);
     try {
      graphInstance.addEdge({
          sourceId: sourceNodeForEdge.id,
          targetId: pendingTargetNode.id,
          label: edgeLabel,
          initialProps: { label: edgeLabel, placeholder: edgePlaceholder || 'No Data' },
          graph: ydoc
      });
      } catch (error) {
       handleError(error as Error);
      }

      setSourceNodeForEdge(null);
      setPendingTargetNode(null);
      setConnectMode(false);
      setShowEdgeDialog(false);
  };

  const cancelEdgeCreation = () => {
      setPendingTargetNode(null);
      setShowEdgeDialog(false);
  };

  const handleUpdateProperty = (key?: string, value?: string) => {
    if (!selectedNodeId) return;
    
    try {
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
    } catch (e) {
        handleError(e as Error);
    }
  };

  const handleUpdateEdgeProperty = (key?: string, value?: string) => {
      if (!selectedEdgeId || !selectedEdgeData) return;
      
      const { source, target } = selectedEdgeData;

      if (key && value) {
          graphInstance.updateEdge({
              sourceId: source,
              targetId: target,
              props: { [key]: value },
              graph: ydoc
          });
          setFormData(prev => ({ ...prev, [key]: value }));
          return;
      }

      graphInstance.updateEdge({
          sourceId: source,
          targetId: target,
          props: { ...formData },
          graph: ydoc
      });
  };

  const handleDelete = () => {
      if(!selectedNodeId) return;
      try {
        graphInstance.deleteNode({ nodeId: selectedNodeId, graph: ydoc });
        setSelectedNodeId(null);
        setFormData({});
      } catch (e) {
        handleError(e as Error);
      }
  };

  const visualNodes = nodes.map(n => ({
      ...n,
      fill: n.data.color || '#a0e7e5',
      size: 20
  }));

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100%', position: 'relative' }}>
      
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <GraphCanvas
          // ref={graphRef}
          nodes={visualNodes}
          edges={edges}
          onNodeClick={handleNodeClick}
          onEdgeClick={handleEdgeClick}
          onCanvasClick={handleCanvasClick}
          draggable={true}
          // layoutType="" .. playing around to see whats best
          labelType="all"
          // aggregateEdges={true} using this crashed currently not know why .. but not that important
        />
        
        <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 5, display: 'flex', gap: '10px' }}>
          <button onClick={handleAddNodeClick}>
              + Add Node
          </button>
          <button onClick={() => dumpGraphToNeo4j(visualNodes, edges)}>
              Dump to Neo4j
          </button>
          <button 
            onClick={() => { setConnectMode(!connectMode); setSourceNodeForEdge(null); }} 
            style={{ background: connectMode ? '#ffeb3b' : '#e0e0e0' }}
          >
            {connectMode ? 'Cancel Connection' : 'Connect Nodes'}
          </button>
          <button onClick={handleTestClick}>
              Test
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
        {showNodeDialog && (
            <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 20,
                background: 'white',
                padding: '20px',
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                border: '1px solid #ccc',
                minWidth: '300px'
            }}>
                <h3>Add Node</h3>
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Node Type:</label>
                    <select 
                        value={newNodeLabel} 
                        onChange={(e) => setNewNodeLabel(e.target.value)}
                        style={{ width: '100%', padding: '5px' }}
                    >
                        {schemaInstance.labelTypeValues.map((label) => (
                            <option key={label} value={label}>
                                {label}
                            </option>
                        ))}
                        { // to simulte the trying of non allowed labels :)
                        testWrongLabel.map((label) => (
                            <option key={label} value={label}>
                                {label}
                            </option>
                        ))}
                    </select>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button onClick={() => setShowNodeDialog(false)} style={{ background: '#f0f0f0', border: 'none', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                    <button onClick={handleConfirmAddNode} style={{ background: '#4CAF50', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer' }}>Create</button>
                </div>
            </div>
        )}
        {showEdgeDialog && (
          console.log('showEdgeDialog', edgeLabel),
            <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 20,
                background: 'white',
                padding: '20px',
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                border: '1px solid #ccc',
                minWidth: '300px'
            }}>
                <h3>Create Connection</h3>
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Relationship Type:</label>
                    <select 
                        value={edgeLabel} 
                        onChange={(e) => setEdgeLabel(e.target.value)}
                        style={{ width: '100%', padding: '5px' }}
                    >
                      <option value="">Select Relationship Type</option>
                        {sourceNodeForEdge && pendingTargetNode && Object.values(schemaInstance.edgeLabelTypeValues).map((label) => (
                            <option key={label} value={label}>
                                {label}
                            </option>
                        ))}
                        {sourceNodeForEdge && pendingTargetNode && !schemaInstance.allowedConnectivity[sourceNodeForEdge.label][pendingTargetNode.label] && (
                            <option value="">No allowed connectivity</option>
                        )}
                    </select>
                </div>
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Placeholder Data:</label>
                    <input 
                        type="text" 
                        value={edgePlaceholder}
                        onChange={(e) => setEdgePlaceholder(e.target.value)}
                        placeholder="Enter details..."
                        style={{ width: '100%', padding: '5px' }}
                    />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button onClick={cancelEdgeCreation} style={{ background: '#f0f0f0', border: 'none', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                    <button onClick={handleCreateEdge} style={{ background: '#4CAF50', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer' }}>Create</button>
                </div>
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
      
      {selectedEdgeId && (
        <div style={{ width: '300px', borderLeft: '1px solid #ccc', padding: '20px', background: '#f9f9f9', overflowY: 'auto' }}>
            <h3>Edge Properties</h3>
            <p>ID: {selectedEdgeId}</p>
            
            {Object.entries(formData).map(([key, value]) => {
                if (key === 'id') return null;
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
            })}

            <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', fontSize: '0.8em', color: '#555' }}>Label:</label>
                <input
                    type="text"
                    value={formData.label || ''} 
                    onChange={(e) => handleUpdateFormChange('label', e.target.value)}
                    style={{ width: '100%' }}
                />
            </div>

            <button onClick={() => handleUpdateEdgeProperty()}>Update All</button>
            <hr />
            {/* Edge deletion not requested but good to have eventually */}
        </div>
      )}
    </div>
  );

};

export default GraphEditor2;
