import React, { useEffect, useState } from 'react';
import * as Y from 'yjs';
import { Schema_v1, SchemaDefinition } from '../Schema_v1/schema_v1';
import { VisVisualizer } from '../0_Vizualizer/VisVisualizer';

const ConnectedClient: React.FC<{ doc: Y.Doc, title: string, schemaModel: Schema_v1 }> = ({ doc, title, schemaModel }) => {
    const [renderSchema, setRenderSchema] = useState<SchemaDefinition>({ nodes: [], relationships: [] });

    // The Lens mapping function!
    const extractSchema = () => {
        const fullJSON = schemaModel.transformToJSONFullSchema();
        const nodes: SchemaDefinition['nodes'] = [];
        const relationships: SchemaDefinition['relationships'] = [];

        // Map NodeTypes
        if (fullJSON.nodeTypes) {
            for (const [typeId, _data] of Object.entries(fullJSON.nodeTypes)) {
                const data: any = _data;
                const resolvedProps: Record<string, string> = {};
                if (data.properties) {
                    Object.keys(data.properties).forEach(propId => {
                        resolvedProps[propId] = schemaModel.getResolvedPropertyType(typeId, propId, "NodeType");
                    });
                }
                nodes.push({
                    identifyingType: typeId,
                    labels: data.labels ? Object.keys(data.labels) : [],
                    properties: resolvedProps
                });
            }
        }

        // Map RelationshipTypes
        if (fullJSON.relationshipTypes) {
            for (const [edgeId, _data] of Object.entries(fullJSON.relationshipTypes)) {
                const data: any = _data;
                const resolvedProps: Record<string, string> = {};
                if (data.properties) {
                    Object.keys(data.properties).forEach(propId => {
                        resolvedProps[propId] = schemaModel.getResolvedPropertyType(edgeId, propId, "RelationshipType");
                    });
                }
                relationships.push({
                    identifyingEdge: edgeId,
                    sourceNodeLabel: data.sourceNodeLabel,
                    targetNodeLabel: data.targetNodeLabel,
                    properties: resolvedProps
                });
            }
        }

        setRenderSchema({ nodes, relationships });
    };

    // observer
    useEffect(() => {
        extractSchema(); // initial extraction
        const handler = () => extractSchema();
        doc.on('update', handler);
        return () => doc.off('update', handler);
    }, [doc]);

    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '2px solid #30363d' }}>
            <div style={{ padding: '10px 15px', background: '#21262d', color: '#c9d1d9', fontWeight: 'bold', borderBottom: '1px solid #30363d', display: 'flex', justifyContent: 'space-between' }}>
                <span>{title}</span>
                <span style={{ color: '#8b949e', fontSize: '12px' }}>[ClientID: {doc.clientID}]</span>
            </div>
            <div style={{ flex: 1, position: 'relative' }}>
                <VisVisualizer schemaDef={renderSchema} schemaModel={schemaModel} />
            </div>
        </div>
    );
};

interface LiveSchemaDemoProps {
    doc1: Y.Doc;
    doc2: Y.Doc;
    schema1: Schema_v1;
    schema2: Schema_v1;
}

export const LiveSchemaDemo: React.FC<LiveSchemaDemoProps> = ({ doc1, doc2, schema1, schema2 }) => {

    const handleSyncAtoB = () => {
        const update = Y.encodeStateAsUpdate(doc1);
        Y.applyUpdate(doc2, update);
    };

    const handleBidirectionalSync = () => {
        const updateA = Y.encodeStateAsUpdate(doc1);
        const updateB = Y.encodeStateAsUpdate(doc2);
        Y.applyUpdate(doc2, updateA);
        Y.applyUpdate(doc1, updateB);
    };

    const handleReload = () => {
        window.location.reload();
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100vh', background: '#0d1117' }}>
            
            {/* Sync Toolbar */}
            <div style={{ background: '#161b22', padding: '10px 20px', borderBottom: '1px solid #30363d', display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#8b949e', fontSize: '13px', marginRight: '10px' }}>Network Controls:</span>
                <button 
                    onClick={handleSyncAtoB}
                    style={{ background: '#21262d', color: '#c9d1d9', border: '1px solid #30363d', padding: '6px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                    Sync A &rarr; B
                </button>
                <button 
                    onClick={handleBidirectionalSync}
                    style={{ background: '#238636', color: '#ffffff', border: '1px solid #2ea043', padding: '6px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                    Bidirectional Sync A &harr; B
                </button>
                <button 
                    onClick={handleReload}
                    style={{ background: 'transparent', color: '#da3633', border: '1px solid #da3633', padding: '6px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', marginLeft: 'auto' }}
                >
                    &#x21bb; Reload
                </button>
            </div>

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                <ConnectedClient doc={doc1} title="🖥️ Client A" schemaModel={schema1} />
                <ConnectedClient doc={doc2} title="💻 Client B" schemaModel={schema2} />
            </div>
        </div>
    );
};
