import React, { useEffect, useState, useCallback, useRef } from 'react';
import * as Y from 'yjs';
import { PropertyGraph, VisibleNode, VisibleEdge } from '../../3_PG_CRDT/PropertyGraph';
import { SchemaLensEngine } from '../SchemaLensEngine';
import { Schema_v1 } from '../../1_Schema_CRDT/Schema_v1/schema_v1';
import { VisGraphCanvas } from '../../3_PG_CRDT/0_Vizualization/VisGraphCanvas';
import { seedBon19GraphExtendet } from '../../3_PG_CRDT/0_Vizualization/bon19Graph_extendet';


const DARK   = '#0d1117';
const PANEL  = '#161b22';
const BORDER = '#30363d';
const TEXT   = '#c9d1d9';
const DIM    = '#8b949e';
const BLUE   = '#58a6ff';
const GREEN  = '#3fb950';
const AMBER  = '#d29922';
const PURPLE = '#bc8cff';
const RED    = '#da3633';
const BRIGHT = '#e6edf3';

const mono: React.CSSProperties = { fontFamily: 'monospace', fontSize: 12 };

const pill = (color: string): React.CSSProperties => ({
    display: 'inline-block', padding: '1px 7px', borderRadius: 10,
    background: color + '22', color, border: `1px solid ${color}55`,
    fontFamily: 'monospace', fontSize: 11, fontWeight: 700,
});

function typeColor(t: string) {
    if (t === 'boolean') return AMBER;
    if (t === 'number')  return BLUE;
    if (t === 'date')    return PURPLE;
    return GREEN;
}

function inferType(val: any): string {
    if (val instanceof Date) return 'date';
    return typeof val;
}

function formatDecoded(val: any): string {
    if (val instanceof Date) return val.toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' });
    return String(val);
}


const pg = new PropertyGraph();

interface LensGraphViewProps {
    pgDoc: Y.Doc;
    schemaDoc: Y.Doc;
    engine: SchemaLensEngine;
}

export type LensUINode = VisibleNode & { label: string[], appProps?: Record<string, any> };
export type LensUIEdge = VisibleEdge & { appProps?: Record<string, any> };

export const LensGraphView: React.FC<LensGraphViewProps> = ({ pgDoc, schemaDoc, engine }) => {

    const [nodes, setNodes] = useState<LensUINode[]>([]);
    const [edges, setEdges] = useState<LensUIEdge[]>([]);
    const [selectedNode, setSelectedNode] = useState<LensUINode | null>(null);
    const [selectedEdge, setSelectedEdge] = useState<LensUIEdge | null>(null);

    const refresh = useCallback(() => {
        const rawNodes = pg.getVisibleNodes(pgDoc);
        const rawEdges = pg.getVisibleEdges(pgDoc);

        const { lensedNodes, lensedEdges } = engine.applyLensToGraph(rawNodes, rawEdges);
        console.log("rawNodes", rawNodes);
        console.log("rawEdges", rawEdges);
        console.log("lensedNodes", lensedNodes);
        console.log("lensedEdges", lensedEdges);

        setNodes(lensedNodes);
        setEdges(lensedEdges);
        setSelectedNode(prev => prev ? lensedNodes.find(n => n.id === prev.id) ?? null : null);
        setSelectedEdge(prev => prev ? lensedEdges.find(e => e.id === prev.id) ?? null : null);
    }, [pgDoc, engine]);

    useEffect(() => {
        seedBon19GraphExtendet(pgDoc, pg);
        refresh();
        pgDoc.on('update', refresh);
        schemaDoc.on('update', refresh);
        return () => {
            pgDoc.off('update', refresh);
            schemaDoc.off('update', refresh);
        };
    }, [pgDoc, schemaDoc, refresh]);

    const visNodes = nodes.map(n => ({
        id: n.id,
        type: n.type,
        label: n.label,
        fill: n.color,
        data: n,
    }));

    const visEdges = edges.map(e => ({
        id: e.id,
        source: e.sourceId,
        target: e.targetId,
        type: e.type,
        data: e,
    }));

    const onNodeClick = useCallback((n: any) => {
        setSelectedNode(n.data as LensUINode);
        setSelectedEdge(null);
    }, []);

    const onEdgeClick = useCallback((e: any) => {
        setSelectedEdge(e.data as LensUIEdge);
        setSelectedNode(null);
    }, []);

    const onCanvasClick = useCallback(() => {
        setSelectedNode(null);
        setSelectedEdge(null);
    }, []);

    function renderPropertyRows(
        identifyingType: string,
        props: Record<string, any>,
        appProps: Record<string, any> = {},
        changeType: 'NodeType' | 'RelationshipType'
    ) {
        const userProps = Object.entries(appProps).filter(([k]) => !k.startsWith('__'));
        if (userProps.length === 0) {
            return <div style={{ color: DIM, fontSize: 12, fontStyle: 'italic' }}>No properties.</div>;
        }

        return userProps.map(([key, rawVal]) => {
            const rawStr  = String(rawVal ?? '');
            
            const decoded  = appProps[key] ?? rawStr;
            const lens     = engine.getPropertyLens(identifyingType, key, changeType);
            const typeName = inferType(decoded);
            const color    = typeColor(typeName);
            const changed  = formatDecoded(decoded) !== rawStr;

            return (
                <div key={key} style={{
                    padding: '9px 0',
                    borderBottom: `1px solid #21262d`,
                }}>

                    <div style={{ color: BRIGHT, fontWeight: 700, fontSize: 12, marginBottom: 6 }}>{key}</div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>

                        <div style={{ background: DARK, borderRadius: 4, padding: '5px 8px', border: `1px solid ${BORDER}` }}>
                            <div style={{ fontSize: 9, color: DIM, marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Raw DB</div>
                            <div style={{ ...mono, color: RED, fontSize: 12, wordBreak: 'break-all' }}>{rawStr || <em style={{ color: DIM }}>empty</em>}</div>
                        </div>

                        <div style={{
                            background: DARK, borderRadius: 4, padding: '5px 8px',
                            border: `1px solid ${changed ? color + '55' : BORDER}`,
                            position: 'relative',
                        }}>
                            {changed && (
                                <div style={{
                                    position: 'absolute', top: -1, right: -1,
                                    background: color, width: 6, height: 6, borderRadius: '50%',
                                }} />
                            )}
                            <div style={{ fontSize: 9, color: DIM, marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>App Value</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                                <span style={{ ...mono, color, fontSize: 12, fontWeight: 700, wordBreak: 'break-all' }}>
                                    {formatDecoded(decoded)}
                                </span>
                                <span style={pill(color)}>{typeName}</span>
                            </div>
                        </div>
                    </div>

                    {lens?.transformerMap && (
                        <div style={{ marginTop: 5, fontSize: 10, color: AMBER, ...mono }}>
                            🔁 map: {Object.entries(lens.transformerMap).map(([k, v]) => `${k}→${v}`).join('  ·  ')}
                        </div>
                    )}
                    {!lens && (
                        <div style={{ marginTop: 4, fontSize: 10, color: DIM }}>no lens — passthrough</div>
                    )}
                </div>
            );
        });
    }

    const hasSelection = selectedNode !== null || selectedEdge !== null;
    return (
        <div style={{ display: 'flex', height: '100%', width: '100%', background: DARK, overflow: 'hidden' }}>


            <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
                <VisGraphCanvas
                    nodes={visNodes}
                    edges={visEdges}
                    onNodeClick={onNodeClick}
                    onEdgeClick={onEdgeClick}
                    onCanvasClick={onCanvasClick}
                />

                <div style={{
                    position: 'absolute', top: 14, left: 14, zIndex: 10,
                    display: 'flex', flexDirection: 'column', gap: 8,
                }}>
                </div>
            </div>

            {hasSelection && (
                <div style={{
                    width: 320, background: PANEL, borderLeft: `1px solid ${BORDER}`,
                    display: 'flex', flexDirection: 'column', overflowY: 'auto', flexShrink: 0,
                }}>

                    <div style={{ padding: '16px 18px 10px', borderBottom: `1px solid ${BORDER}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ margin: 0, fontSize: 15, color: selectedNode ? BLUE : GREEN }}>
                                {selectedNode ? '🔵 Node' : '🔗 Edge'}
                                &nbsp;
                                <span style={{ color: BRIGHT }}>
                                    {selectedNode ? selectedNode.type : selectedEdge?.type}
                                </span>
                            </h2>
                            <button
                                onClick={() => { setSelectedNode(null); setSelectedEdge(null); }}
                                style={{ background: 'transparent', border: 'none', color: DIM, cursor: 'pointer', fontSize: 18, lineHeight: 1 }}
                            >×</button>
                        </div>

                        <div style={{ marginTop: 8, fontSize: 11, color: DIM, ...mono }}>
                            {selectedNode && (
                                <>
                                    <div>ID: <span style={{ color: TEXT }}>{selectedNode.id}</span></div>
                                    
                                    <div>Labels: <span style={{ color: TEXT }}>
                                        {Array.isArray(selectedNode.label) 
                                            ? selectedNode.label.join(', ') 
                                            : (typeof selectedNode.label === 'object' && selectedNode.label !== null)
                                                ? Object.keys(selectedNode.label).join(', ')
                                                : String(selectedNode.label || '')}
                                    </span></div>
                                    <div>Policy: <span style={{ color: selectedNode.policy === 'ADD_WINS' ? AMBER : GREEN }}>{selectedNode.policy}</span></div>
                                </>
                            )}
                            {selectedEdge && (
                                <>
                                    <div>ID: <span style={{ color: TEXT, fontSize: 10 }}>{selectedEdge.id.slice(0, 22)}…</span></div>
                                    <div>
                                        {nodes.find(n => n.id === selectedEdge.sourceId)?.type ?? selectedEdge.sourceId}
                                        &nbsp;<span style={{ color: BLUE }}>→</span>&nbsp;
                                        {nodes.find(n => n.id === selectedEdge.targetId)?.type ?? selectedEdge.targetId}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <div style={{ padding: '8px 18px', borderBottom: `1px solid ${BORDER}`, display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ fontSize: 10, color: DIM }}>DECODED TYPE:</span>
                        {(['string', 'number', 'boolean', 'date'] as const).map(t => (
                            <span key={t} style={{ ...pill(typeColor(t)), fontSize: 10 }}>{t}</span>
                        ))}
                    </div>

                    <div style={{ padding: '4px 18px 18px', flex: 1 }}>
                        <div style={{ fontSize: 11, color: DIM, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '10px 0 4px' }}>
                            Properties
                        </div>
                        {selectedNode && renderPropertyRows(selectedNode.type, selectedNode.props, selectedNode.appProps, 'NodeType')}
                        {selectedEdge && renderPropertyRows(selectedEdge.type, selectedEdge.props, selectedEdge.appProps, 'RelationshipType')}
                    </div>
                </div>
            )}
        </div>
    );
};
