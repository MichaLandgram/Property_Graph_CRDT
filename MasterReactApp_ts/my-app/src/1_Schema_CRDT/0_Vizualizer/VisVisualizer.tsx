import React, { useEffect, useRef, useMemo, useState } from 'react';
import { SchemaDefinition, Schema_v1 } from '../Schema/schema_v1';
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


    const [newPropKey, setNewPropKey] = useState('');
    const [newPropType, setNewPropType] = useState('string');

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

    useEffect(() => {
        if (!containerRef.current) return;

        const data = { nodes, edges };
        
        const options = {
            interaction: {
                hover: true,
                selectConnectedEdges: false
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
                } else {
                    setSelectedNodeId(null); 
                }
            });
        }
    }, [nodes, edges]);

    // CRDT Mutation Handlers
    const handleAddProperty = () => {
        if (!activeNodeData || !newPropKey.trim()) return;
        try {
            schemaModel.SMO_AddPropertyType({
                Idenifying: activeNodeData.identifyingType,
                whatToChange: "NodeType",
                newProperty: { key: newPropKey.trim(), value: newPropType as any }
            });
        } catch (error) {
            console.log("HI");
            alert(error);
        }
        setNewPropKey('');
    };

    const handleRemoveProperty = (key: string) => {
        if (!activeNodeData) return;
        try {
            schemaModel.SMO_DropPropertyType({
                Idenifying: activeNodeData.identifyingType,
                whatToChange: "NodeType",
                propertyKey: key
            });
        } catch (error) {
            alert(error);
        }
    };

    const handleRetypeProperty = (key: string, newType: string) => {
        if (!activeNodeData) return;
        try {
            const tags = schemaModel.getPropertyTypeTags(activeNodeData.identifyingType, key, "NodeType");
            schemaModel.SMO_ChangePropertyType({
                Idenifying: activeNodeData.identifyingType,
                whatToChange: "NodeType",
                propertyKey: key,
            oldTags: tags,
            newPropertyType: newType as any,
            defaultVal: {} as any
        });
        } catch (error) {
            alert(error);
        }
    };

    return (
        <div style={{ display: 'flex', width: '100%', height: '800px', background: '#0d1117' }}>
            <div ref={containerRef} style={{ flex: 1, height: '100%' }} />

            {/* Interactive Schema Properties Sidebar */}
            {activeNodeData && (
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
                    <h2 style={{ color: '#58a6ff', marginTop: 0, marginBottom: '5px' }}>{activeNodeData.identifyingType}</h2>
                    
                    <div style={{ color: '#8b949e', marginBottom: '20px', fontSize: '13px' }}>
                        <strong>Labels:</strong> [{activeNodeData.labels.join(', ')}]
                    </div>

                    <h3 style={{ borderBottom: '1px solid #30363d', paddingBottom: '8px', color: '#e6edf3' }}>Properties Schema</h3>
                    
                    {Object.entries(activeNodeData.properties).length === 0 ? (
                        <div style={{ color: '#8b949e', fontStyle: 'italic', marginTop: '10px' }}>No schema properties defined.</div>
                    ) : (
                        <div style={{ marginTop: '10px' }}>
                            {Object.entries(activeNodeData.properties).map(([key, type]) => (
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

                    {/* Add New Property UI */}
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

                </div>
            )}
        </div>
    );
};
