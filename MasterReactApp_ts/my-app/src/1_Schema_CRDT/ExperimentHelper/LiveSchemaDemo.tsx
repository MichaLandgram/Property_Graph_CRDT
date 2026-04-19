import React, { useEffect, useState, useMemo } from 'react';
import * as Y from 'yjs';
import { Schema_v1, SchemaDefinition } from '../Schema/schema_v1';
import { VisVisualizer } from   '../0_Vizualizer/VisVisualizer';
import { bon19SchemaDef } from '../../1_Schema_CRDT/ExperimentHelper/Bon19_Schema';
import { baseSchema } from './baseSchema';

export const LiveSchemaDemo: React.FC = () => {
    // Initialize CRDT and Schema wrapper instance exactly once
    const { doc, schemaModel } = useMemo(() => {
        const ydoc = new Y.Doc();
        const schema = new Schema_v1(baseSchema, ydoc);
        
        return { doc: ydoc, schemaModel: schema };
    }, []);

    // React State that will hold the visual mapping
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
            const activeLabels = new Set(schemaModel.getAllNodeLabels()); // Referential Integrity Lens

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

        const handler = () => {
            extractSchema(); // extract schema on update
        };

        doc.on('update', handler);
        return () => doc.off('update', handler);
    }, [doc]);

    // Handlers for Live Edits

    const simulateNewType = () => {
        doc.transact(() => {
            schemaModel.SMO_addNodeType("Account", ["System"], { email: "string", verified: "boolean" });
            schemaModel.SMO_addRelationshipType("HAS_ACCOUNT", "Person", "Account", { role: "string" });
        }, "user-click");
    };

    const simulateSelfLoop = () => {
        doc.transact(() => {
            schemaModel.SMO_addRelationshipType("KNOWS", "Person", "Person", { since: "number" });
        }, "user-click");
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
            <div style={{ padding: '10px', background: '#2c3e50', color: 'white', display: 'flex', gap: '10px' }}>
                <button onClick={simulateNewType} style={{ padding: '10px', cursor: 'pointer' }}>
                    + Live Collaborate: Create "Account" Node
                </button>
                <button onClick={simulateSelfLoop} style={{ padding: '10px', cursor: 'pointer' }}>
                    + Live Collaborate: Add Self-Loop (Person KNOWS Person)
                </button>
            </div>
            
            <div style={{ flex: 1, position: 'relative' }}>
                <VisVisualizer schemaDef={renderSchema} schemaModel={schemaModel} />
            </div>
        </div>
    );
};
