import React, { useMemo } from 'react';
import * as Y from 'yjs';
import { Schema_v1 } from '../../1_Schema_CRDT/Schema/schema_v1';
import { SchemaLensEngine } from '../SchemaLensEngine';
import { LensGraphView } from './LensDemo';

interface LiveLensDemoProps {
    pgDoc: Y.Doc;        // Shared with Raw Property Graph tab — Client A's graph doc
    schemaDoc: Y.Doc;    // Shared with Schema Editor tab — Client A's schema doc
    schema: Schema_v1;   // Same Schema_v1 instance bound to schemaDoc
}

export const LiveLensDemo: React.FC<LiveLensDemoProps> = ({ pgDoc, schemaDoc, schema }) => {


    const engine = useMemo(() => new SchemaLensEngine(schema), [schema]);

    const handleReload = () => window.location.reload();

    return (
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', background: '#0d1117' }}>

            <div style={{
                background: '#161b22',
                padding: '9px 20px',
                borderBottom: '1px solid #30363d',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                flexShrink: 0,
            }}>
                {/* Source badges */}
                <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{
                        background: '#21262d', border: '1px solid #30363d',
                        borderRadius: 6, padding: '4px 12px',
                        display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                        <span style={{ fontSize: 14 }}>🗂️</span>
                        <span style={{ color: '#58a6ff', fontWeight: 700, fontSize: 12 }}>Schema Editor</span>
                        <span style={{ color: '#8b949e', fontSize: 11, fontFamily: 'monospace' }}>Client A · doc {schemaDoc.clientID}</span>
                    </div>
                    <div style={{ color: '#8b949e', fontSize: 18, alignSelf: 'center' }}>+</div>
                    <div style={{
                        background: '#21262d', border: '1px solid #30363d',
                        borderRadius: 6, padding: '4px 12px',
                        display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                        <span style={{ fontSize: 14 }}>🕸️</span>
                        <span style={{ color: '#3fb950', fontWeight: 700, fontSize: 12 }}>Property Graph</span>
                        <span style={{ color: '#8b949e', fontSize: 11, fontFamily: 'monospace' }}>Client A · doc {pgDoc.clientID}</span>
                    </div>
                    <div style={{ color: '#8b949e', fontSize: 18, alignSelf: 'center' }}>→</div>
                    <div style={{
                        background: '#21262d', border: '1px solid #bc8cff44',
                        borderRadius: 6, padding: '4px 12px',
                        display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                        <span style={{ fontSize: 14 }}>🔍</span>
                        <span style={{ color: '#bc8cff', fontWeight: 700, fontSize: 12 }}>Lens Layer</span>
                        <span style={{ color: '#8b949e', fontSize: 11, fontFamily: 'monospace' }}>SchemaLensEngine</span>
                    </div>
                </div>

                <button
                    onClick={handleReload}
                    style={{
                        marginLeft: 'auto', background: 'transparent', color: '#da3633',
                        border: '1px solid #da3633', padding: '5px 14px',
                        borderRadius: 6, cursor: 'pointer', fontWeight: 700, fontSize: 13,
                    }}
                >
                    ↻ Reload
                </button>
            </div>

            <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
                <LensGraphView pgDoc={pgDoc} schemaDoc={schemaDoc} engine={engine} />
            </div>
        </div>
    );
};
