import React, { useEffect, useState, useCallback } from 'react';
import * as Y from 'yjs';
import { PropertyGraph, VisibleNode, VisibleEdge } from '../PropertyGraph';
import { VisGraphCanvas } from './VisGraphCanvas';
import { seedBon19Graph } from './bon19Graph';

const pg = new PropertyGraph();

const DARK = '#0d1117';
const PANEL = '#161b22';
const BORDER = '#30363d';
const TEXT = '#c9d1d9';
const DIM = '#8b949e';
const BLUE = '#58a6ff';
const GREEN = '#3fb950';
const RED = '#da3633';
const BRIGHT = '#e6edf3';

const inputStyle: React.CSSProperties = {
    width: '100%', padding: '6px 8px', background: DARK, border: `1px solid ${BORDER}`,
    borderRadius: '4px', color: TEXT, boxSizing: 'border-box', fontFamily: 'monospace', fontSize: '13px'
};

const btnStyle = (bg: string, fg = '#fff'): React.CSSProperties => ({
    background: bg, color: fg, border: 'none', borderRadius: '6px',
    padding: '7px 14px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px',
});

const POLICY_COLORS: Record<string, string> = {
    ADD_WINS: BLUE,
    OBSERVED_REMOVE: GREEN,
};

type PropRow = { key: string; value: string };

interface PropertyGraphDemoProps { doc: Y.Doc; }
export const PropertyGraphDemo: React.FC<PropertyGraphDemoProps> = ({ doc }) => {

    // Graph state
    const [nodes, setNodes] = useState<VisibleNode[]>([]);
    const [edges, setEdges] = useState<VisibleEdge[]>([]);

    // Selection
    const [selectedNode, setSelectedNode] = useState<VisibleNode | null>(null);
    const [selectedEdge, setSelectedEdge] = useState<VisibleEdge | null>(null);

    // Sidebar – add property
    const [newPropKey, setNewPropKey] = useState('');
    const [newPropValue, setNewPropValue] = useState('');

    // Floating panels
    const [isAddingNode, setIsAddingNode] = useState(false);
    const [isAddingEdge, setIsAddingEdge] = useState(false);

    // Add-Node form
    const [newNodeLabel, setNewNodeLabel] = useState('');
    const [newNodePolicy, setNewNodePolicy] = useState<'ADD_WINS' | 'OBSERVED_REMOVE'>('OBSERVED_REMOVE');
    const [newNodeProps, setNewNodeProps] = useState<PropRow[]>([]);

    // Add-Edge form
    const [newEdgeSource, setNewEdgeSource] = useState('');
    const [newEdgeTarget, setNewEdgeTarget] = useState('');
    const [newEdgeLabel, setNewEdgeLabel] = useState('');
    const [newEdgeProps, setNewEdgeProps] = useState<PropRow[]>([]);

    const refresh = useCallback(() => {
        const freshNodes = pg.getVisibleNodes(doc);
        const freshEdges = pg.getVisibleEdges(doc);
        setNodes(freshNodes);
        setEdges(freshEdges);

        setSelectedNode(prev => prev ? freshNodes.find(n => n.id === prev.id) ?? null : null);
        setSelectedEdge(prev => prev ? freshEdges.find(e => e.id === prev.id) ?? null : null);
    }, [doc]);

    useEffect(() => {
        seedBon19Graph(doc, pg);
        refresh();
        doc.on('update', refresh);
        return () => doc.off('update', refresh);
    }, [doc, refresh]);

    const visNodes = nodes.map(n => ({
        id: n.id, label: n.label,
        fill: n.color ?? POLICY_COLORS[n.policy] ?? BLUE,
        data: n,
    }));
    const visEdges = edges.map(e => ({
        id: e.id, source: e.sourceId, target: e.targetId, label: e.label, data: e,
    }));

    const onNodeClick = useCallback((n: any) => {
        setSelectedNode(n.data as VisibleNode);
        setSelectedEdge(null);
    }, []);
    const onEdgeClick = useCallback((e: any) => {
        setSelectedEdge(e.data as VisibleEdge);
        setSelectedNode(null);
    }, []);
    const onCanvasClick = useCallback(() => {
        setSelectedNode(null); setSelectedEdge(null);
    }, []);

    const handleCreateNode = () => {
        if (!newNodeLabel.trim()) return;
        const props: Record<string, any> = {};
        newNodeProps.forEach(({ key, value }) => { if (key.trim()) props[key.trim()] = value; });
        pg.addNode({
            doc, nodeId: `${newNodeLabel.toLowerCase().replace(/\s+/g, '_')}-${Date.now()}`,
            label: newNodeLabel.trim(), props, policy: newNodePolicy,
        });
        setIsAddingNode(false); setNewNodeLabel(''); setNewNodeProps([]);
    };

    const handleCreateEdge = () => {
        if (!newEdgeSource || !newEdgeTarget || !newEdgeLabel.trim()) return;
        const props: Record<string, any> = {};
        newEdgeProps.forEach(({ key, value }) => { if (key.trim()) props[key.trim()] = value; });
        try {
            pg.addEdge({ doc, sourceId: newEdgeSource, targetId: newEdgeTarget, type: newEdgeLabel.trim(), props });
        } catch (e: any) { alert(e.message); return; }
        setIsAddingEdge(false); setNewEdgeSource(''); setNewEdgeTarget(''); setNewEdgeLabel(''); setNewEdgeProps([]);
    };

    const handleAddProperty = () => {
        if (!selectedNode || !newPropKey.trim()) return;
        pg.updateNode({ doc, nodeId: selectedNode.id, props: { [newPropKey.trim()]: newPropValue } });
        setNewPropKey(''); setNewPropValue('');
    };

    const handleUpdateProp = (key: string, value: string) => {
        if (!selectedNode) return;
        pg.updateNode({ doc, nodeId: selectedNode.id, props: { [key]: value } });
    };

    const handleDelete = () => {
        if (selectedNode) {
            try { pg.deleteNode({ doc, nodeId: selectedNode.id }); } catch (e: any) { alert(e.message); }
            setSelectedNode(null);
        } else if (selectedEdge) {
            pg.deleteEdge({ doc, edgeId: selectedEdge.id });
            setSelectedEdge(null);
        }
    };

    const hasSelection = selectedNode !== null || selectedEdge !== null;

    return (
        <div style={{ display: 'flex', height: '100%', width: '100%', background: DARK, overflow: 'hidden' }}>

            <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
                <VisGraphCanvas
                    nodes={visNodes} edges={visEdges}
                    onNodeClick={onNodeClick} onEdgeClick={onEdgeClick} onCanvasClick={onCanvasClick}
                />

                <div style={{ position: 'absolute', top: 14, left: 14, zIndex: 10, display: 'flex', gap: 10 }}>
                    {isAddingNode ? (
                        <div style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 8, padding: 16, width: 290, boxShadow: '0 4px 16px rgba(0,0,0,0.6)' }}>
                            <h4 style={{ margin: '0 0 12px 0', color: BLUE }}>➕ Create Node</h4>
                            <label style={{ color: DIM, fontSize: 12 }}>Label</label>
                            <input style={{ ...inputStyle, marginBottom: 8 }} value={newNodeLabel} onChange={e => setNewNodeLabel(e.target.value)} placeholder="e.g. Person" />
                            <label style={{ color: DIM, fontSize: 12 }}>Policy</label>
                            <select style={{ ...inputStyle, marginBottom: 12 }} value={newNodePolicy} onChange={e => setNewNodePolicy(e.target.value as any)}>
                                <option value="OBSERVED_REMOVE">OBSERVED_REMOVE</option>
                                <option value="ADD_WINS">ADD_WINS</option>
                            </select>

                            <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 10, marginBottom: 10 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: DIM, marginBottom: 8 }}>
                                    <span>INITIAL PROPERTIES</span>
                                    <button onClick={() => setNewNodeProps([...newNodeProps, { key: '', value: '' }])}
                                        style={{ background: 'transparent', color: BLUE, border: 'none', cursor: 'pointer', padding: 0 }}>+ Add</button>
                                </div>
                                {newNodeProps.map((row, i) => (
                                    <div key={i} style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
                                        <input value={row.key} onChange={e => { const p = [...newNodeProps]; p[i].key = e.target.value; setNewNodeProps(p); }}
                                            placeholder="Key" style={{ ...inputStyle, flex: 1 }} />
                                        <input value={row.value} onChange={e => { const p = [...newNodeProps]; p[i].value = e.target.value; setNewNodeProps(p); }}
                                            placeholder="Value" style={{ ...inputStyle, flex: 1 }} />
                                        <button onClick={() => setNewNodeProps(newNodeProps.filter((_, j) => j !== i))}
                                            style={{ background: 'transparent', color: RED, border: 'none', cursor: 'pointer', fontSize: 16 }}>×</button>
                                    </div>
                                ))}
                            </div>

                            <div style={{ display: 'flex', gap: 8 }}>
                                <button style={{ ...btnStyle('#238636'), flex: 1 }} onClick={handleCreateNode}>Submit</button>
                                <button style={{ ...btnStyle('transparent', DIM), flex: 1, border: `1px solid ${BORDER}` }} onClick={() => { setIsAddingNode(false); setNewNodeProps([]); }}>Cancel</button>
                            </div>
                        </div>
                    ) : (
                        <button style={{ ...btnStyle('#238636'), boxShadow: '0 2px 6px rgba(0,0,0,0.3)' }}
                            onClick={() => { setIsAddingNode(true); setIsAddingEdge(false); }}>➕ Node</button>
                    )}

                    {isAddingEdge ? (
                        /* ── Add-Edge panel ── */
                        <div style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 8, padding: 16, width: 290, boxShadow: '0 4px 16px rgba(0,0,0,0.6)' }}>
                            <h4 style={{ margin: '0 0 12px 0', color: GREEN }}>➕ Create Edge</h4>
                            <label style={{ color: DIM, fontSize: 12 }}>Relationship Type</label>
                            <input style={{ ...inputStyle, marginBottom: 8 }} value={newEdgeLabel} onChange={e => setNewEdgeLabel(e.target.value)} placeholder="e.g. KNOWS" />
                            <label style={{ color: DIM, fontSize: 12 }}>Source</label>
                            <select style={{ ...inputStyle, marginBottom: 8 }} value={newEdgeSource} onChange={e => setNewEdgeSource(e.target.value)}>
                                <option value="">— select —</option>
                                {nodes.map(n => <option key={n.id} value={n.id}>{n.label}</option>)}
                            </select>
                            <label style={{ color: DIM, fontSize: 12 }}>Target</label>
                            <select style={{ ...inputStyle, marginBottom: 12 }} value={newEdgeTarget} onChange={e => setNewEdgeTarget(e.target.value)}>
                                <option value="">— select —</option>
                                {nodes.map(n => <option key={n.id} value={n.id}>{n.label}</option>)}
                            </select>

                            <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 10, marginBottom: 10 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: DIM, marginBottom: 8 }}>
                                    <span>INITIAL PROPERTIES</span>
                                    <button onClick={() => setNewEdgeProps([...newEdgeProps, { key: '', value: '' }])}
                                        style={{ background: 'transparent', color: GREEN, border: 'none', cursor: 'pointer', padding: 0 }}>+ Add</button>
                                </div>
                                {newEdgeProps.map((row, i) => (
                                    <div key={i} style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
                                        <input value={row.key} onChange={e => { const p = [...newEdgeProps]; p[i].key = e.target.value; setNewEdgeProps(p); }}
                                            placeholder="Key" style={{ ...inputStyle, flex: 1 }} />
                                        <input value={row.value} onChange={e => { const p = [...newEdgeProps]; p[i].value = e.target.value; setNewEdgeProps(p); }}
                                            placeholder="Value" style={{ ...inputStyle, flex: 1 }} />
                                        <button onClick={() => setNewEdgeProps(newEdgeProps.filter((_, j) => j !== i))}
                                            style={{ background: 'transparent', color: RED, border: 'none', cursor: 'pointer', fontSize: 16 }}>×</button>
                                    </div>
                                ))}
                            </div>

                            <div style={{ display: 'flex', gap: 8 }}>
                                <button style={{ ...btnStyle('#238636'), flex: 1 }} onClick={handleCreateEdge}>Submit</button>
                                <button style={{ ...btnStyle('transparent', DIM), flex: 1, border: `1px solid ${BORDER}` }} onClick={() => { setIsAddingEdge(false); setNewEdgeProps([]); }}>Cancel</button>
                            </div>
                        </div>
                    ) : (
                        <button style={{ ...btnStyle('#1f6feb'), boxShadow: '0 2px 6px rgba(0,0,0,0.3)' }}
                            onClick={() => { setIsAddingEdge(true); setIsAddingNode(false); }}>➕ Edge</button>
                    )}
                </div>
            </div>

            {/* ── Sidebar ───────────────────────────────────────────────── */}
            {hasSelection && (
                <div style={{
                    width: 320, background: PANEL, borderLeft: `1px solid ${BORDER}`,
                    display: 'flex', flexDirection: 'column', fontFamily: 'monospace', overflowY: 'auto',
                }}>

                    <div style={{ padding: '18px 20px 10px', borderBottom: `1px solid ${BORDER}` }}>
                        <h2 style={{ margin: 0, color: selectedNode ? BLUE : GREEN, fontSize: 16 }}>
                            {selectedNode ? '🔵 Node' : '🔗 Edge'}:&nbsp;
                            <span style={{ color: BRIGHT }}>{selectedNode ? selectedNode.label : selectedEdge?.label}</span>
                        </h2>
                        {selectedNode && (
                            <div style={{ marginTop: 8, fontSize: 12, color: DIM }}>
                                <span>Policy: </span>
                                <span style={{ color: POLICY_COLORS[selectedNode.policy] }}>{selectedNode.policy}</span>
                                <br />
                                <span style={{ wordBreak: 'break-all' }}>ID: {selectedNode.id}</span>
                            </div>
                        )}
                        {selectedEdge && (
                            <div style={{ marginTop: 8, fontSize: 12, color: DIM }}>
                                <span>
                                    ({nodes.find(n => n.id === selectedEdge.sourceId)?.label ?? selectedEdge.sourceId})
                                    &nbsp;→&nbsp;
                                    ({nodes.find(n => n.id === selectedEdge.targetId)?.label ?? selectedEdge.targetId})
                                </span>
                                <br />
                                <span style={{ wordBreak: 'break-all', fontSize: 11 }}>ID: {selectedEdge.id.slice(0, 20)}…</span>
                            </div>
                        )}
                    </div>

                    <div style={{ padding: '16px 20px', flex: 1 }}>
                        <h3 style={{ margin: '0 0 12px 0', color: BRIGHT, borderBottom: `1px solid ${BORDER}`, paddingBottom: 8, fontSize: 14 }}>
                            Properties
                        </h3>

                        {(() => {
                            const props = selectedNode ? selectedNode.props : selectedEdge?.props ?? {};
                            const userProps = Object.entries(props).filter(([k]) => !k.startsWith('__'));
                            if (userProps.length === 0) {
                                return <div style={{ color: DIM, fontStyle: 'italic', fontSize: 13 }}>No properties defined.</div>;
                            }
                            return userProps.map(([key, value]) => (
                                <div key={key} style={{ padding: '10px 0', borderBottom: `1px solid #21262d`, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                    <span style={{ color: BRIGHT, fontWeight: 'bold', fontSize: 13 }}>{key}</span>
                                    {selectedNode ? (
                                        <input
                                            defaultValue={String(value)}
                                            onBlur={e => handleUpdateProp(key, e.target.value)}
                                            style={{ ...inputStyle, fontSize: 12 }}
                                        />
                                    ) : (
                                        <span style={{ color: '#ff7b72', fontSize: 12 }}>{String(value)}</span>
                                    )}
                                </div>
                            ));
                        })()}

                        {selectedNode && (
                            <div style={{ marginTop: 24, background: DARK, borderRadius: 6, padding: 14, border: `1px solid ${BORDER}` }}>
                                <div style={{ fontSize: 12, color: DIM, marginBottom: 8, textTransform: 'uppercase' }}>Add Property</div>
                                <input
                                    value={newPropKey} onChange={e => setNewPropKey(e.target.value)}
                                    placeholder="Key" style={{ ...inputStyle, marginBottom: 6 }}
                                />
                                <input
                                    value={newPropValue} onChange={e => setNewPropValue(e.target.value)}
                                    placeholder="Value" style={{ ...inputStyle, marginBottom: 10 }}
                                />
                                <button style={{ ...btnStyle('#238636'), width: '100%' }} onClick={handleAddProperty}>
                                    + Add
                                </button>
                            </div>
                        )}
                    </div>

                    <div style={{ padding: '14px 20px', borderTop: `1px solid ${BORDER}` }}>
                        <button style={{ ...btnStyle(RED), width: '100%' }} onClick={handleDelete}>
                            Delete {selectedNode ? `Node "${selectedNode.label}"` : `Edge "${selectedEdge?.label}"`}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
