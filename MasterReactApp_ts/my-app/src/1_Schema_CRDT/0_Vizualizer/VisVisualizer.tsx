import React, { useEffect, useRef, useMemo, useState } from 'react';
import { SchemaDefinition, Schema_v1 } from '../Schema_v1/schema_v1';
import { Network } from 'vis-network';

const generateColor = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 70%, 45%)`; 
};

export const VisVisualizer: React.FC<{ schemaDef: SchemaDefinition, schemaModel: Schema_v1 }> = ({ schemaDef, schemaModel }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const networkRef = useRef<any>(null);
    

    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);


    const [newPropKey, setNewPropKey] = useState('');
    const [newPropType, setNewPropType] = useState('string');

    // Form states for Add Node
    const [isAddingNode, setIsAddingNode] = useState(false);
    const [newNodeId, setNewNodeId] = useState('');
    const [newNodeLabels, setNewNodeLabels] = useState('');
    const [newNodeProperties, setNewNodeProperties] = useState<{key: string, type: string}[]>([]);

    // Form states for Add Edge
    const [isAddingEdge, setIsAddingEdge] = useState(false);
    const [newEdgeId, setNewEdgeId] = useState('');
    const [newEdgeSource, setNewEdgeSource] = useState('');
    const [newEdgeTarget, setNewEdgeTarget] = useState('');
    const [newEdgeProperties, setNewEdgeProperties] = useState<{key: string, type: string}[]>([]);

    const { nodes, edges } = useMemo(() => {
        const visualNodes = schemaDef.nodes.map(n => ({
            id: n.identifyingType,
            label: n.identifyingType,
            color: { background: generateColor(n.identifyingType), border: '#ffffff' },
            font: { color: '#ffffff', size: 16, face: 'monospace' },
            shape: 'circle',
            borderWidth: 2,
            margin: 15,
            data: n
        }));

        const visualEdges = schemaDef.relationships.map((rel, index) => ({
            id: `edge-${rel.identifyingEdge}-${index}`,
            from: rel.sourceNodeLabel,
            to: rel.targetNodeLabel,
            label: rel.identifyingEdge,
            arrows: 'to',
            font: { 
                color: '#c9d1d9', 
                size: 12, 
                align: 'middle', 
                background: 'rgba(13, 17, 23, 0.8)',
                strokeWidth: 0 
            }, 
            color: { color: '#58a6ff', highlight: '#ffffff' }
        }));

        return { nodes: visualNodes, edges: visualEdges };
    }, [schemaDef]);

    const activeNodeData = useMemo(() => {
        if (!selectedNodeId) return null;
        return nodes.find(n => n.id === selectedNodeId)?.data || null;
    }, [selectedNodeId, nodes]);

    const activeEdgeData = useMemo(() => {
        if (!selectedEdgeId) return null;
        const mappedEdge = edges.find(e => e.id === selectedEdgeId);
        if (!mappedEdge) return null;
        // Search original schemaDef to get full properties
        return schemaDef.relationships.find(r => r.identifyingEdge === mappedEdge.label 
            && r.sourceNodeLabel === mappedEdge.from 
            && r.targetNodeLabel === mappedEdge.to) || null;
    }, [selectedEdgeId, edges, schemaDef]);

    // Consolidate Active Item for Sidebar
    const activeItem = activeNodeData || activeEdgeData;
    const activeItemType = activeNodeData ? "NodeType" : "RelationshipType";
    const activeIdentifyingName = activeNodeData ? activeNodeData.identifyingType : activeEdgeData?.identifyingEdge;

    useEffect(() => {
        if (!containerRef.current) return;

        const data = { nodes, edges };
        
        const options = {
            interaction: {
                hover: true,
                selectConnectedEdges: false
            },
            manipulation: {
                enabled: true,
                addNode: false,
                editEdge: false,
                deleteNode: false,
                deleteEdge: false,
                addEdge: (edgeData: any, callback: any) => {
                    const fromNode = nodes.find(n => n.id === edgeData.from);
                    const toNode = nodes.find(n => n.id === edgeData.to);
                    if (!fromNode || !toNode) {
                        callback(null);
                        return;
                    }
                    // Delay slightly so prompt doesn't freeze the drag-drop execution
                    setTimeout(() => {
                        const name = window.prompt(`Relationship name from ${fromNode.id} to ${toNode.id}:`);
                        if (name && name.trim() !== '') {
                            try {
                                schemaModel.SMO_addRelationshipType(name.trim(), fromNode.id, toNode.id, {});
                                // Pass null because CRDT Yjs update will automatically re-render the mapped edge
                                callback(null); 
                            } catch (e: any) {
                                alert(e.message || e);
                                callback(null);
                            }
                        } else {
                            callback(null); // Cancel
                        }
                    }, 10);
                }
            },
            edges: {
                smooth: {
                    type: 'dynamic', 
                    forceDirection: 'none'
                }
            },
            physics: {
                barnesHut: {
                    gravitationalConstant: -2000,
                    centralGravity: 0.3,
                    springLength: 250,
                    springConstant: 0.04,
                    damping: 0.09,
                    avoidOverlap: 0.1
                },
                solver: 'barnesHut',
                minVelocity: 0.75,
                maxVelocity: 50
            }
        };

        if (networkRef.current) {
            networkRef.current.setData(data);
        } else {
            networkRef.current = new Network(containerRef.current, data as any, options as any);
            
            // Add native Vis.js event listeners!
            networkRef.current.on('click', (params: any) => {
                if (params.nodes.length > 0) {
                    setSelectedNodeId(params.nodes[0]); 
                    setSelectedEdgeId(null);
                } else if (params.edges.length > 0) {
                    setSelectedNodeId(null);
                    setSelectedEdgeId(params.edges[0]); 
                } else {
                    setSelectedNodeId(null); 
                    setSelectedEdgeId(null);
                }
            });
        }
    }, [nodes, edges]);

    // CRDT Mutation Handlers
    const handleAddProperty = () => {
        if (!activeItem || !activeIdentifyingName || !newPropKey.trim()) return;
        try {
            schemaModel.SMO_AddPropertyType({
                Idenifying: activeIdentifyingName,
                whatType: activeItemType as any,
                newProperty: { key: newPropKey.trim(), value: newPropType as any }
            });
        } catch (error) {
            alert(error);
        }
        setNewPropKey('');
    };

    const handleRemoveProperty = (key: string) => {
        if (!activeItem || !activeIdentifyingName) return;
        try {
            schemaModel.SMO_DropPropertyType({
                Idenifying: activeIdentifyingName,
                whatType: activeItemType as any,
                propertyKey: key
            });
        } catch (error) {
            alert(error);
        }
    };

    const handleRetypeProperty = (key: string, newType: string) => {
        if (!activeItem || !activeIdentifyingName) return;
        try {
            const tags = schemaModel.getPropertyTypeTags(activeIdentifyingName, key, activeItemType as any);
            schemaModel.SMO_ChangePropertyType({
                Idenifying: activeIdentifyingName,
                whatType: activeItemType as any,
                propertyKey: key,
                oldTags: tags,
                newPropertyType: newType as any,
                defaultVal: {} as any
            });
        } catch (error) {
            alert(error);
        }
    };

    const handleCreateNode = () => {
        if (!newNodeId.trim()) return;
        try {
            const labelsArray = newNodeLabels.split(',').map(s => s.trim()).filter(Boolean);
            if (labelsArray.length === 0) {
                labelsArray.push(newNodeId.trim()); // Fallback label
            }
            
            const propsObj: any = {};
            newNodeProperties.forEach(p => {
                if (p.key.trim()) propsObj[p.key.trim()] = p.type;
            });

            schemaModel.SMO_addNodeType(newNodeId.trim(), labelsArray, propsObj);
            
            setIsAddingNode(false);
            setNewNodeId('');
            setNewNodeLabels('');
            setNewNodeProperties([]);
        } catch (error: any) {
            alert(error.message || error);
        }
    };

    const handleCreateEdge = () => {
        if (!newEdgeId.trim() || !newEdgeSource || !newEdgeTarget) return;
        try {
            const propsObj: any = {};
            newEdgeProperties.forEach(p => {
                if (p.key.trim()) propsObj[p.key.trim()] = p.type;
            });

            schemaModel.SMO_addRelationshipType(newEdgeId.trim(), newEdgeSource, newEdgeTarget, propsObj);
            
            setIsAddingEdge(false);
            setNewEdgeId('');
            setNewEdgeSource('');
            setNewEdgeTarget('');
            setNewEdgeProperties([]);
        } catch (error: any) {
            alert(error.message || error);
        }
    };

    const handleDeleteActiveItem = () => {
        if (!activeItem || !activeItemType || !activeIdentifyingName) return;
        
        try {
            if (activeItemType === 'NodeType') {
                schemaModel.SMO_dropNodeType(activeIdentifyingName);
            } else {
                schemaModel.SMO_dropRelationshipType(activeIdentifyingName);
            }
            setSelectedNodeId(null);
            setSelectedEdgeId(null);
        } catch (error: any) {
            alert(error.message || error);
        }
    };

    return (
        <div style={{ position: 'relative', display: 'flex', width: '100%', height: '800px', background: '#0d1117' }}>
            

            <div ref={containerRef} style={{ flex: 1, height: '100%' }} />

            <div style={{ position: 'absolute', top: 15, left: 15, zIndex: 10, display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                {isAddingNode ? (
                    <div style={{ background: '#161b22', padding: '15px', borderRadius: '8px', border: '1px solid #30363d', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', width: '280px' }}>
                        <h4 style={{ margin: '0 0 10px 0', color: '#58a6ff' }}>Create New Node</h4>
                        <input 
                            value={newNodeId}
                            onChange={e => setNewNodeId(e.target.value)}
                            placeholder="Identifying Type (e.g. Person)"
                            style={{ width: '100%', marginBottom: '8px', padding: '6px', background: '#0d1117', border: '1px solid #30363d', color: '#c9d1d9', boxSizing: 'border-box' }}
                        />
                        <input 
                            value={newNodeLabels}
                            onChange={e => setNewNodeLabels(e.target.value)}
                            placeholder="Labels (comma separated)"
                            style={{ width: '100%', marginBottom: '12px', padding: '6px', background: '#0d1117', border: '1px solid #30363d', color: '#c9d1d9', boxSizing: 'border-box' }}
                        />
                        
                        <div style={{ marginBottom: '12px', borderTop: '1px solid #30363d', paddingTop: '10px' }}>
                            <div style={{ fontSize: '12px', color: '#8b949e', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>INITIAL PROPERTIES</span>
                                <button 
                                    onClick={() => setNewNodeProperties([...newNodeProperties, { key: '', type: 'string' }])}
                                    style={{ background: 'transparent', color: '#58a6ff', border: 'none', cursor: 'pointer', padding: 0 }}
                                >+ Add</button>
                            </div>
                            {newNodeProperties.map((prop, idx) => (
                                <div key={idx} style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
                                    <input 
                                        value={prop.key}
                                        onChange={e => {
                                            const newProps = [...newNodeProperties];
                                            newProps[idx].key = e.target.value;
                                            setNewNodeProperties(newProps);
                                        }}
                                        placeholder="Key"
                                        style={{ flex: 1, padding: '4px', background: '#0d1117', border: '1px solid #30363d', color: '#c9d1d9', boxSizing: 'border-box', minWidth: 0 }}
                                    />
                                    <select 
                                        value={prop.type}
                                        onChange={e => {
                                            const newProps = [...newNodeProperties];
                                            newProps[idx].type = e.target.value;
                                            setNewNodeProperties(newProps);
                                        }}
                                        style={{ width: '80px', padding: '4px', background: '#0d1117', border: '1px solid #30363d', color: '#c9d1d9', boxSizing: 'border-box' }}
                                    >
                                        <option value="string">STR</option>
                                        <option value="number">NUM</option>
                                        <option value="boolean">BOOL</option>
                                        <option value="date">DATE</option>
                                    </select>
                                    <button 
                                        onClick={() => setNewNodeProperties(newNodeProperties.filter((_, i) => i !== idx))}
                                        style={{ background: 'transparent', color: '#ff7b72', border: 'none', cursor: 'pointer' }}
                                    >×</button>
                                </div>
                            ))}
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={handleCreateNode} style={{ flex: 1, background: '#238636', color: 'white', border: 'none', padding: '6px', cursor: 'pointer', borderRadius: '4px' }}>Submit</button>
                            <button onClick={() => { setIsAddingNode(false); setNewNodeProperties([]); }} style={{ flex: 1, background: 'transparent', color: '#8b949e', border: '1px solid #30363d', padding: '6px', cursor: 'pointer', borderRadius: '4px' }}>Cancel</button>
                        </div>
                    </div>
                ) : (
                    <button 
                        onClick={() => { setIsAddingNode(true); setIsAddingEdge(false); }}
                        style={{ background: '#238636', color: 'white', border: '1px solid #2ea043', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}
                    >
                        ➕ Node
                    </button>
                )}

                {isAddingEdge ? (
                    <div style={{ background: '#161b22', padding: '15px', borderRadius: '8px', border: '1px solid #30363d', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', width: '280px' }}>
                        <h4 style={{ margin: '0 0 10px 0', color: '#3fb950' }}>Create New Edge</h4>
                        <input 
                            value={newEdgeId}
                            onChange={e => setNewEdgeId(e.target.value)}
                            placeholder="Relationship Name (e.g. WROTE)"
                            style={{ width: '100%', marginBottom: '8px', padding: '6px', background: '#0d1117', border: '1px solid #30363d', color: '#c9d1d9', boxSizing: 'border-box' }}
                        />
                        <select 
                            value={newEdgeSource}
                            onChange={e => setNewEdgeSource(e.target.value)}
                            style={{ width: '100%', marginBottom: '8px', padding: '6px', background: '#0d1117', border: '1px solid #30363d', color: '#c9d1d9', boxSizing: 'border-box' }}
                        >
                           <option value="" disabled>Select Source</option>
                           {nodes.map((n: any) => <option key={n.id} value={n.id}>{n.id}</option>)}
                        </select>
                        <select 
                            value={newEdgeTarget}
                            onChange={e => setNewEdgeTarget(e.target.value)}
                            style={{ width: '100%', marginBottom: '12px', padding: '6px', background: '#0d1117', border: '1px solid #30363d', color: '#c9d1d9', boxSizing: 'border-box' }}
                        >
                           <option value="" disabled>Select Target</option>
                           {nodes.map((n: any) => <option key={n.id} value={n.id}>{n.id}</option>)}
                        </select>
                        
                        {/* Inline Initial Properties Form */}
                        <div style={{ marginBottom: '12px', borderTop: '1px solid #30363d', paddingTop: '10px' }}>
                            <div style={{ fontSize: '12px', color: '#8b949e', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>INITIAL PROPERTIES</span>
                                <button 
                                    onClick={() => setNewEdgeProperties([...newEdgeProperties, { key: '', type: 'string' }])}
                                    style={{ background: 'transparent', color: '#3fb950', border: 'none', cursor: 'pointer', padding: 0 }}
                                >+ Add</button>
                            </div>
                            {newEdgeProperties.map((prop, idx) => (
                                <div key={idx} style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
                                    <input 
                                        value={prop.key}
                                        onChange={e => {
                                            const newProps = [...newEdgeProperties];
                                            newProps[idx].key = e.target.value;
                                            setNewEdgeProperties(newProps);
                                        }}
                                        placeholder="Key"
                                        style={{ flex: 1, padding: '4px', background: '#0d1117', border: '1px solid #30363d', color: '#c9d1d9', boxSizing: 'border-box', minWidth: 0 }}
                                    />
                                    <select 
                                        value={prop.type}
                                        onChange={e => {
                                            const newProps = [...newEdgeProperties];
                                            newProps[idx].type = e.target.value;
                                            setNewEdgeProperties(newProps);
                                        }}
                                        style={{ width: '80px', padding: '4px', background: '#0d1117', border: '1px solid #30363d', color: '#c9d1d9', boxSizing: 'border-box' }}
                                    >
                                        <option value="string">STR</option>
                                        <option value="number">NUM</option>
                                        <option value="boolean">BOOL</option>
                                        <option value="date">DATE</option>
                                    </select>
                                    <button 
                                        onClick={() => setNewEdgeProperties(newEdgeProperties.filter((_, i) => i !== idx))}
                                        style={{ background: 'transparent', color: '#ff7b72', border: 'none', cursor: 'pointer' }}
                                    >×</button>
                                </div>
                            ))}
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={handleCreateEdge} style={{ flex: 1, background: '#238636', color: 'white', border: 'none', padding: '6px', cursor: 'pointer', borderRadius: '4px' }}>Submit</button>
                            <button onClick={() => { setIsAddingEdge(false); setNewEdgeProperties([]); }} style={{ flex: 1, background: 'transparent', color: '#8b949e', border: '1px solid #30363d', padding: '6px', cursor: 'pointer', borderRadius: '4px' }}>Cancel</button>
                        </div>
                    </div>
                ) : (
                    <button 
                        onClick={() => { setIsAddingEdge(true); setIsAddingNode(false); }}
                        style={{ background: '#238636', color: 'white', border: '1px solid #2ea043', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}
                    >
                        ➕ Edge
                    </button>
                )}
            </div>

            {activeItem && (
                <div style={{
                    width: '320px', 
                    background: '#161b22', 
                    color: '#c9d1d9', 
                    borderLeft: '1px solid #30363d',
                    padding: '20px',
                    fontFamily: 'monospace',
                    overflowY: 'auto',
                    boxSizing: 'border-box'
                }}>
                    <h2 style={{ color: activeItemType === 'NodeType' ? '#58a6ff' : '#3fb950', marginTop: 0, marginBottom: '5px' }}>
                        {activeItemType === 'NodeType' ? 'Node: ' : 'Edge: '}
                        {activeIdentifyingName}
                    </h2>
                    
                    {activeItemType === 'NodeType' ? (
                        <div style={{ color: '#8b949e', marginBottom: '20px', fontSize: '13px' }}>
                            <strong>Labels:</strong> [{(activeItem as any).labels?.join(', ')}]
                        </div>
                    ) : (
                        <div style={{ color: '#8b949e', marginBottom: '20px', fontSize: '13px' }}>
                            <strong>Path:</strong> ({(activeItem as any).sourceNodeLabel}) &rarr; ({(activeItem as any).targetNodeLabel})
                        </div>
                    )}

                    <h3 style={{ borderBottom: '1px solid #30363d', paddingBottom: '8px', color: '#e6edf3' }}>Properties Schema</h3>
                    
                    {Object.entries(activeItem.properties).length === 0 ? (
                        <div style={{ color: '#8b949e', fontStyle: 'italic', marginTop: '10px' }}>No schema properties defined.</div>
                    ) : (
                        <div style={{ marginTop: '10px' }}>
                            {Object.entries(activeItem.properties).map(([key, type]) => (
                                <div key={key} style={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    padding: '10px 0', 
                                    borderBottom: '1px solid #21262d',
                                    alignItems: 'center'
                                }}>
                                    <span style={{ color: '#e6edf3', fontWeight: 'bold' }}>{key}</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <select 
                                            value={String(type)}
                                            onChange={(e) => handleRetypeProperty(key, e.target.value)}
                                            style={{
                                                background: '#0d1117',
                                                color: '#ff7b72',
                                                border: '1px solid #30363d',
                                                padding: '4px',
                                                borderRadius: '4px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <option value="string">STRING</option>
                                            <option value="number">NUMBER</option>
                                            <option value="boolean">BOOLEAN</option>
                                            <option value="date">DATE</option>
                                        </select>
                                        
                                        <button 
                                            onClick={() => handleRemoveProperty(key)}
                                            style={{
                                                background: 'transparent', color: '#ff7b72', border: 'none', 
                                                cursor: 'pointer', padding: '0 5px', fontSize: '16px'
                                            }}
                                            title="Delete Property"
                                        >×</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div style={{ marginTop: '30px', background: '#0d1117', padding: '15px', borderRadius: '6px', border: '1px solid #30363d' }}>
                        <div style={{ fontSize: '12px', color: '#8b949e', marginBottom: '8px', textTransform: 'uppercase' }}>Add Property</div>
                        <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                            <input 
                                value={newPropKey}
                                onChange={(e) => setNewPropKey(e.target.value)}
                                placeholder="Property key..."
                                style={{
                                    width: '100%', padding: '6px', background: '#161b22', 
                                    border: '1px solid #30363d', color: '#c9d1d9', borderRadius: '4px'
                                }}
                            />
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <select 
                                    value={newPropType}
                                    onChange={(e) => setNewPropType(e.target.value)}
                                    style={{
                                        flex: 1, padding: '6px', background: '#161b22', 
                                        border: '1px solid #30363d', color: '#c9d1d9', borderRadius: '4px'
                                    }}
                                >
                                    <option value="string">STRING</option>
                                    <option value="number">NUMBER</option>
                                    <option value="boolean">BOOLEAN</option>
                                    <option value="date">DATE</option>
                                </select>
                                <button 
                                    onClick={handleAddProperty}
                                    style={{
                                        background: '#238636', color: '#fff', border: 'none', 
                                        padding: '6px 12px', borderRadius: '4px', cursor: 'pointer',
                                        fontWeight: 'bold'
                                    }}
                                >+</button>
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={handleDeleteActiveItem}
                        style={{
                            marginTop: '20px',
                            background: '#da3633', color: 'white', border: 'none',
                            padding: '10px', borderRadius: '6px', cursor: 'pointer',
                            fontWeight: 'bold', width: '100%'
                        }}
                    >
                        Delete {activeItemType === 'NodeType' ? 'Node' : 'Edge'} ({activeIdentifyingName})
                    </button>
                </div>
            )}
        </div>
    );
};
