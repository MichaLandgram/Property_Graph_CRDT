import React, { useState, useCallback } from 'react';
import { GraphCanvas, GraphCanvasRef, useSelection } from 'reagraph';
import * as Y from 'yjs';
import { useYjsGraphReagraph, ReagraphNode } from '../../Helper/Hook/YJS_hook_Reagraph';
import { dumpGraphToNeo4j } from '../../Helper/Vizuals/Neo4jConnector';
import { edgeLabelTypes, AlwaysNodeData } from '../../Helper/types_interfaces/types';
import { getGraphInstance, getSchemaInstance } from '../../VersionSelector';
import { useGraphErrorHandler } from '../../Helper/Vizuals/useGraphErrorHandler';
import { allowedNodePropeerties } from '../../Schema/schema_1_old';
import { GrowOnlyCounter } from '../../Helper/YJS_helper/moreComplexTypes';

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
  
  const [liveNodeProps, setLiveNodeProps] = useState<Record<string, any>>({});
  
  const [bufferedProps, setBufferedProps] = useState<Record<string, any>>({});

  const [allProps, setAllProps] = useState<Record<string, any>>({});
  const [connectMode, setConnectMode] = useState(false);
  const [sourceNodeForEdge, setSourceNodeForEdge] = useState<AlwaysNodeData | null>(null);
  
  const [showEdgeDialog, setShowEdgeDialog] = useState(false);
  const [pendingTargetNode, setPendingTargetNode] = useState<AlwaysNodeData | null>(null);
  const [edgeLabel, setEdgeLabel] = useState<edgeLabelTypes>('DEFAULT');
  const [edgePlaceholder, setEdgePlaceholder] = useState('');
  const [showNodeDialog, setShowNodeDialog] = useState(false);
  const [newNodeLabel, setNewNodeLabel] = useState<string>(schemaInstance.labelTypeValues[0] || 'Person');

  const graphRef = React.useRef<GraphCanvasRef | null>(null);

  const fetchLiveProps = useCallback((nodeId: string, label: string) => {
    try {
        const rawProps = graphInstance.getNodeProps({ nodeId, graph: ydoc });
        // console.log('fetchLiveProps rawProps:', rawProps);
        if (!rawProps) return;

        const processedProps: Record<string, any> = {};
        const initialBuffer: Record<string, any> = {};

        const schemaProps = {
            ...(schemaInstance.allowedNodePropeerties[label]?.['notNull'] || {}),
            ...(schemaInstance.allowedNodePropeerties[label]?.['nullable'] || {})
        };

        Object.entries(rawProps).forEach(([key, value]) => {
            const expectedType = schemaProps[key];
            
            if (expectedType && typeof expectedType === 'object' && 'kind' in expectedType) {
                if (expectedType.kind === 'counter') {
                    if (value instanceof Y.Map) {
                        const wrapper = new GrowOnlyCounter(value, ydoc);
                        processedProps[key] = wrapper;
                        initialBuffer[key] = wrapper.getTotal();
                    } else if (value instanceof GrowOnlyCounter) {
                         processedProps[key] = value;
                         initialBuffer[key] = value.getTotal();
                    }
                } else if (expectedType.kind === 'ymap') {
                     if (value instanceof Y.Map) {
                         processedProps[key] = value;
                         initialBuffer[key] = value.toJSON();
                     }
                } else if (expectedType.kind === 'yarray') {
                     if (value instanceof Y.Array) {
                         processedProps[key] = value;
                         initialBuffer[key] = value.toArray();
                     }
                } else {
                    processedProps[key] = value;
                }
            } else {
                processedProps[key] = value;
            }
        });
        
        setLiveNodeProps(processedProps);
        setBufferedProps(initialBuffer);

    } catch (e) {
        console.error("Failed to fetch live props", e);
    }
  }, [ydoc]);


  const handleNodeClick = useCallback((node: any) => {
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
    
    const schemaProps = schemaInstance.allowedNodePropeerties[node.label] 
        ? {...schemaInstance.allowedNodePropeerties[node.label]['notNull'], ...schemaInstance.allowedNodePropeerties[node.label]['nullable']} 
        : {};

    setAllProps(schemaProps);
    setSelectedEdgeId(null);
    setFormData(node.data || {});

    fetchLiveProps(node.id, node.label);

  }, [connectMode, sourceNodeForEdge, ydoc, fetchLiveProps]);

  const handleEdgeClick = useCallback((edge: any) => {
    if (connectMode) return;
    
    console.log('Edge Clicked:', edge);
    setSelectedEdgeId(edge.id);
    setSelectedNodeId(null);
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
        setLiveNodeProps({});
        setBufferedProps({});
    }
  }, [connectMode]);

  const handleAddNodeClick = () => {
    setShowNodeDialog(true);
    setNewNodeLabel(schemaInstance.labelTypeValues[0] || 'Person');
  };

  const handleTestClick = () => {
    try {
        console.log('Test Clicked');
        graphInstance.addNode({
            alwaysProps: {
                id: 'test',
                position : { x: Math.random() * 400, y: Math.random() * 400 },
                label: 'TEST', 
                policy: 'ADD_WINS',
                color: '#a0e7e5',
            },
            initialProps: { 
                testString: 'hello',
                testNumber: 42,
                testBoolean: true,
                testDate: new Date(),
                testCounter: new Y.Map<number>(),
                testArray: new Y.Array<string>(),
                testMap: new Y.Map<any>(),
            },
            graph: ydoc
        });
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

  const handleUpdateFormChange = (key: string, value: string | number | boolean) => {
    console.log('key', key);
    console.log('value', typeof value);
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

  const handleUnifiedUpdate = () => {
    if (!selectedNodeId) return;
    
    const updates: Record<string, any> = {};
    Object.entries(formData).forEach(([key, value]) => {
        if (typeof value === 'object' || Array.isArray(value)) return;
        const liveValue = liveNodeProps[key];
        if (liveValue !== value) {
            updates[key] = value;
        }
    });
    Object.keys(bufferedProps).forEach(key => {
        const live = liveNodeProps[key];
        const buffer = bufferedProps[key];

        if (!live) return;

        if (live instanceof GrowOnlyCounter) {
           if (buffer !== live.getTotal()) {
               updates[key] = buffer;
           }
        } else if (live instanceof Y.Map) {
            const liveJson = live.toJSON();
            if (JSON.stringify(liveJson) !== JSON.stringify(buffer)) {
                updates[key] = buffer;
            }
        } else if (live instanceof Y.Array) {
            const liveJson = live.toArray();
            if (JSON.stringify(liveJson) !== JSON.stringify(buffer)) {
                updates[key] = buffer;
            }
        }
    });
    try {
        if (Object.keys(updates).length > 0) {
            graphInstance.updateNode({
                nodeId: selectedNodeId,
                props: updates,
                graph: ydoc
            });
        } else {
            console.log('No changes detected, skipping update.');
        }
    } catch (e) {
        handleError(e as Error);
    }
    if(formData.label) fetchLiveProps(selectedNodeId, formData.label);
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

  const handleBufferedChange = (key: string, newVal: any) => {
      setBufferedProps(prev => ({
          ...prev,
          [key]: newVal
      }));
  };

//   const handleRollback = () => {
//       if (!selectedNodeId || !formData.label) return;
//       fetchLiveProps(selectedNodeId, formData.label);
//   };




  const visualNodes = nodes.map(n => ({
      ...n,
      fill: n.data.color || '#a0e7e5',
      size: 20
  }));

  const renderComplexType = (key: string, liveProp: any) => {
      const buffer = bufferedProps[key];
      
      if (liveProp instanceof GrowOnlyCounter) {
          return <CounterRenderer key={key} label={key} value={buffer !== undefined ? buffer : liveProp.getTotal()} onChange={(v) => handleBufferedChange(key, v)} />;
      }
      if (liveProp instanceof Y.Map) {
          return <YMapRenderer key={key} label={key} value={buffer !== undefined ? buffer : liveProp.toJSON()} onChange={(v) => handleBufferedChange(key, v)} />;
      }
      if (liveProp instanceof Y.Array) {
          return <YArrayRenderer key={key} label={key} value={buffer !== undefined ? buffer : liveProp.toArray()} onChange={(v) => handleBufferedChange(key, v)} />;
      }
      return null;
  };

  return (
    <>
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
          labelType="all"
        />
        
        <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 5, display: 'flex', gap: '10px' }}>
          <button onClick={handleAddNodeClick}>+ Add Node</button>
          <button onClick={() => dumpGraphToNeo4j(visualNodes, edges)}>Dump to Neo4j</button>
          <button 
            onClick={() => { setConnectMode(!connectMode); setSourceNodeForEdge(null); }} 
            style={{ background: connectMode ? '#ffeb3b' : '#e0e0e0' }}
          >
            {connectMode ? 'Cancel Connection' : 'Connect Nodes'}
          </button>
          <button onClick={handleTestClick}>Test</button>
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
                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 20,
                background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                border: '1px solid #ccc', minWidth: '300px'
            }}>
                <h3>Add Node</h3>
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Node Type:</label>
                    <select value={newNodeLabel} onChange={(e) => setNewNodeLabel(e.target.value)} style={{ width: '100%', padding: '5px' }}>
                        {schemaInstance.labelTypeValues.map((label) => ( <option key={label} value={label}>{label}</option> ))}
                        {testWrongLabel.map((label) => ( <option key={label} value={label}>{label}</option> ))}
                    </select>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button onClick={() => setShowNodeDialog(false)} style={{ background: '#f0f0f0', border: 'none', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                    <button onClick={handleConfirmAddNode} style={{ background: '#4CAF50', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer' }}>Create</button>
                </div>
            </div>
        )}
        {showEdgeDialog && (
            <div style={{
                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 20,
                background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                border: '1px solid #ccc', minWidth: '300px'
            }}>
                <h3>Create Connection</h3>
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Relationship Type:</label>
                    <select value={edgeLabel} onChange={(e) => setEdgeLabel(e.target.value)} style={{ width: '100%', padding: '5px' }}>
                      <option value="">Select Relationship Type</option>
                        {sourceNodeForEdge && pendingTargetNode && Object.values(schemaInstance.edgeLabelTypeValues).map((label) => (
                            <option key={label} value={label}>{label}</option>
                        ))}
                        {sourceNodeForEdge && pendingTargetNode && !schemaInstance.allowedConnectivity[sourceNodeForEdge.label][pendingTargetNode.label] && (
                            <option value="">No allowed connectivity</option>
                        )}
                    </select>
                </div>
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Placeholder Data:</label>
                    <input type="text" value={edgePlaceholder} onChange={(e) => setEdgePlaceholder(e.target.value)} placeholder="Enter details..." style={{ width: '100%', padding: '5px' }} />
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
          Object.entries(allProps).map(([key, value]) => {
                if (key === 'label' || key === 'color' || key === 'policy' || key === 'id' || key === 'position') return null;

                const liveProp = liveNodeProps[key];
                
                if (liveProp && (liveProp instanceof GrowOnlyCounter || liveProp instanceof Y.Map || liveProp instanceof Y.Array)) {
                     return <div key={key} style={{marginBottom: 10}}>{renderComplexType(key, liveProp)}</div>;
                }
                console.log('key', key);
                console.log('value', value);
                if (value === 'number') {
                    return (
                        <div key={key} style={{ marginBottom: '10px' }}>
                            <label style={{ display: 'block', fontSize: '0.8em', color: '#555' }}>{key} ({String(value)}):</label>
                            <input
                                type="number"
                                value={String(formData[key] || 'NOT SET')} 
                                onChange={(e) => handleUpdateFormChange(key, parseInt(e.target.value))}
                                style={{ width: '100%' }}
                            />
                        </div>
                    );
                }
                if (value === 'boolean') {
                    return (
                        <div key={key} style={{ marginBottom: '10px' }}>
                            <label style={{ display: 'block', fontSize: '0.8em', color: '#555' }}>{key} ({String(value)}):</label>
                            <input
                                type="checkbox"
                                checked={Boolean(formData[key])}
                                onChange={(e) => handleUpdateFormChange(key, e.target.checked)}
                                style={{ width: '100%' }}
                            />
                        </div>
                    );
                }
                return (
                    <div key={key} style={{ marginBottom: '10px' }}>
                        <label style={{ display: 'block', fontSize: '0.8em', color: '#555' }}>{key} ({String(value)}):</label>
                        <input
                            type="text"
                            value={String(formData[key] || 'NOT SET')} 
                            onChange={(e) => handleUpdateFormChange(key, e.target.value)}
                            style={{ width: '100%' }}
                        />
                    </div>
            );
          })
        }
        
        <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', fontSize: '0.8em', color: '#555' }}>Label:</label>
            <input type="text" value={formData.label || ''} onChange={(e) => handleUpdateFormChange('label', e.target.value)} style={{ width: '100%' }} />
        </div>

        <div style={{ marginTop: '20px', borderTop: '1px solid #ccc', paddingTop: '10px' }}>
            <button onClick={handleUnifiedUpdate} style={{ width: '100%', background: '#4CAF50', color: 'white', border: 'none', padding: '10px', cursor: 'pointer', marginBottom: '10px' }}>
                Update Node
            </button>
            
             {/* {Object.keys(bufferedProps).length > 0 && (
                 <button onClick={handleRollback} style={{ width: '100%', background: '#f44336', color: 'white', border: 'none', padding: '8px', cursor: 'pointer' }}>
                    Rollback Complex Props
                 </button>
             )} */}
        </div>

          <label style={{marginTop: 10, display: 'block'}}>Color:</label>
          <input type="color" value={formData.color || '#ffffff'} onChange={(e) => handleUpdateFormChange('color', e.target.value)} />

          <hr />
          <button onClick={handleDelete} style={{ background: 'red', color: 'white', border: 'none', padding: '5px 10px' }}>Delete Node</button>
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
                        <input type="text" value={String(value)} onChange={(e) => handleUpdateFormChange(key, e.target.value)} style={{ width: '100%' }} />
                    </div>
                );
            })}
            <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', fontSize: '0.8em', color: '#555' }}>Label:</label>
                <input type="text" value={formData.label || ''} onChange={(e) => handleUpdateFormChange('label', e.target.value)} style={{ width: '100%' }} />
            </div>
            <button onClick={() => handleUpdateEdgeProperty()}>Update All</button>
            <hr />
        </div>
      )}
    </div>
    </>
  );
};

export default GraphEditor2;


const CounterRenderer: React.FC<{ label: string, value: number, onChange: (v: number) => void }> = ({ label, value, onChange }) => {
    return (
        <div style={{ border: '1px dashed #aaa', padding: '5px', marginBottom: '10px', background: '#ffe0b2' }}>
            <label style={{ fontSize: '0.8em', fontWeight: 'bold' }}>{label} (Counter)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span>Val (Buffered): {value}</span>
                <button onClick={() => onChange(value + 1)} style={{ padding: '2px 5px', cursor: 'pointer' }}>+</button>
            </div>
        </div>
    );
};

const YMapRenderer: React.FC<{ label: string, value: Record<string, any>, onChange: (v: Record<string, any>) => void }> = ({ label, value, onChange }) => {
    const [newKey, setNewKey] = useState('');
    const [newValue, setNewValue] = useState('');

    const handleAdd = () => {
        if(newKey && newValue) {
            onChange({ ...value, [newKey]: newValue });
            setNewKey('');
            setNewValue('');
        }
    };

    const handleDelete = (key: string) => {
        const next = { ...value };
        delete next[key];
        onChange(next);
    };

    return (
        <div style={{ border: '1px dashed #aaa', padding: '5px', marginBottom: '10px', background: '#ffe0b2' }}>
            <label style={{ fontSize: '0.8em', fontWeight: 'bold' }}>{label} (Map)</label>
            <ul style={{ paddingLeft: '20px', margin: '5px 0' }}>
                {Object.entries(value).map(([k, v]) => (
                    <li key={k} style={{ fontSize: '0.8em' }}>
                        {k}: {String(v)} 
                        <span onClick={() => handleDelete(k)} style={{ color: 'red', cursor: 'pointer', marginLeft: '5px' }}>x</span>
                    </li>
                ))}
            </ul>
            <div style={{ display: 'flex', gap: '5px' }}>
                <input placeholder="Key" value={newKey} onChange={e => setNewKey(e.target.value)} style={{ width: '60px' }} />
                <input placeholder="Val" value={newValue} onChange={e => setNewValue(e.target.value)} style={{ width: '60px' }} />
                <button onClick={handleAdd}>Add</button>
            </div>
        </div>
    );
};

const YArrayRenderer: React.FC<{ label: string, value: any[], onChange: (v: any[]) => void }> = ({ label, value, onChange }) => {
    const [newItem, setNewItem] = useState('');

    const handleAdd = () => {
        if (newItem) {
            onChange([...value, newItem]);
            setNewItem('');
        }
    };

    const handleDelete = (index: number) => {
        const next = [...value];
        next.splice(index, 1);
        onChange(next);
    };

    return (
        <div style={{ border: '1px dashed #aaa', padding: '5px', marginBottom: '10px', background: '#ffe0b2' }}>
             <label style={{ fontSize: '0.8em', fontWeight: 'bold' }}>{label} (Array)</label>
             <ul style={{ paddingLeft: '20px', margin: '5px 0' }}>
                {value.map((item, i) => (
                    <li key={i} style={{ fontSize: '0.8em' }}>
                        {String(item)}
                        <span onClick={() => handleDelete(i)} style={{ color: 'red', cursor: 'pointer', marginLeft: '5px' }}>x</span>
                    </li>
                ))}
             </ul>
             <div style={{ display: 'flex', gap: '5px' }}>
                <input placeholder="Val" value={newItem} onChange={e => setNewItem(e.target.value)} style={{ width: '100px' }} />
                <button onClick={handleAdd}>Add</button>
            </div>
        </div>
    );
};
