import React from 'react';
import * as Y from 'yjs';
import { PropertyGraphDemo } from './PropertyGraphDemo';


const PGClient: React.FC<{ doc: Y.Doc; title: string; borderRight?: boolean }> = ({ doc, title, borderRight }) => (
    <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        borderRight: borderRight ? '2px solid #30363d' : undefined,
        minWidth: 0,
        overflow: 'hidden',
    }}>
        <div style={{
            padding: '8px 14px',
            background: '#21262d',
            color: '#c9d1d9',
            fontWeight: 'bold',
            fontSize: '14px',
            borderBottom: '1px solid #30363d',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0,
        }}>
            <span>{title}</span>
            <span style={{ color: '#8b949e', fontSize: '11px', fontFamily: 'monospace' }}>
                clientID: {doc.clientID}
            </span>
        </div>

        <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
            <PropertyGraphDemo doc={doc} />
        </div>
    </div>
);


interface LivePGDemoProps {
    doc1: Y.Doc;
    doc2: Y.Doc;
}

export const LivePGDemo: React.FC<LivePGDemoProps> = ({ doc1, doc2 }) => {

    // ── Sync handlers

    const handleSyncAtoB = () => {
        Y.applyUpdate(doc2, Y.encodeStateAsUpdate(doc1));
    };

    const handleSyncBtoA = () => {
        Y.applyUpdate(doc1, Y.encodeStateAsUpdate(doc2));
    };

    const handleBidirectionalSync = () => {
        const updA = Y.encodeStateAsUpdate(doc1);
        const updB = Y.encodeStateAsUpdate(doc2);
        Y.applyUpdate(doc2, updA);
        Y.applyUpdate(doc1, updB);
    };

    const handleReload = () => window.location.reload();

    return (
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', background: '#0d1117' }}>

            <div style={{
                background: '#161b22',
                padding: '9px 20px',
                borderBottom: '1px solid #30363d',
                display: 'flex',
                gap: '10px',
                alignItems: 'center',
                flexShrink: 0,
            }}>
                <span style={{ color: '#8b949e', fontSize: '13px', marginRight: 6 }}>Network Controls:</span>

                <button
                    onClick={handleSyncAtoB}
                    style={{ background: '#21262d', color: '#c9d1d9', border: '1px solid #30363d', padding: '6px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
                >
                    Sync A → B
                </button>

                <button
                    onClick={handleSyncBtoA}
                    style={{ background: '#21262d', color: '#c9d1d9', border: '1px solid #30363d', padding: '6px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
                >
                    Sync B → A
                </button>

                <button
                    onClick={handleBidirectionalSync}
                    style={{ background: '#238636', color: '#fff', border: '1px solid #2ea043', padding: '6px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
                >
                    Bidirectional A ⇄ B
                </button>

                <button
                    onClick={handleReload}
                    style={{ marginLeft: 'auto', background: 'transparent', color: '#da3633', border: '1px solid #da3633', padding: '6px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
                >
                    ↻ Reload
                </button>
            </div>

            {/* ── Split clients ─────────────────────────────────────────── */}
            <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
                <PGClient doc={doc1} title="🖥️ Client A" borderRight />
                <PGClient doc={doc2} title="💻 Client B" />
            </div>
        </div>
    );
};
