import React, { useMemo } from 'react';
import ReactFlow, { Background, Controls, Node, Edge, EdgeLabelRenderer, MarkerType, Handle, Position } from 'reactflow';
import 'reactflow/dist/style.css';
import { SchemaDefinition } from '../Schema/schema_v1';

// Custom Arc Edge for Bi-directional / Overlapping lines
const ArcEdge = ({ id, sourceX, sourceY, targetX, targetY, label, markerEnd, style, source, target, data }: any) => {
    const isSelfLoop = source === target;
    const offsetIndex = data?.offsetIndex || 0;
    
    let edgePath = '';
    let labelX = 0;
    let labelY = 0;

    if (isSelfLoop) {
        // Draw a loop EXACTLY above the handle (which is on top of circle)
        // Offset multiple loops so they grow outwards like ripples
        const growY = offsetIndex * 35;
        const growX = offsetIndex * 20;

        labelX = sourceX;
        labelY = sourceY - 60 - growY * 0.8;
        
        // Perfect bezier loop starting and ending slightly offset around the center top
        edgePath = `M ${sourceX - 10} ${sourceY} C ${sourceX - 60 - growX} ${sourceY - 100 - growY}, ${sourceX + 60 + growX} ${sourceY - 100 - growY}, ${sourceX + 10} ${sourceY}`;
    } else {
        // Draw an arc between node handles natively computed by react flow
        const dx = targetX - sourceX;
        const dy = targetY - sourceY;
        
        const midX = (sourceX + targetX) / 2;
        const midY = (sourceY + targetY) / 2;
        
        // Compute offset direction to alternate arcs for multi-edges (e.g., A->B, B->A, A->B)
        const curveOffsetBase = 0.25 + Math.floor(offsetIndex / 2) * 0.2;
        const curveDirection = offsetIndex % 2 === 0 ? 1 : -1;
        const finalFactor = curveOffsetBase * curveDirection;

        const offsetX = -dy * finalFactor; 
        const offsetY = dx * finalFactor;
        
        labelX = midX + offsetX * 0.5;
        labelY = midY + offsetY * 0.5;

        edgePath = `M ${sourceX} ${sourceY} Q ${midX + offsetX} ${midY + offsetY} ${targetX} ${targetY}`;
    }

    return (
        <>
            <path id={id} style={{ ...style, fill: 'none' }} className="react-flow__edge-path" d={edgePath} markerEnd={markerEnd} />
            {label && (
                <EdgeLabelRenderer>
                    <div
                        style={{
                            position: 'absolute',
                            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                            background: '#1A1A1A',
                            padding: '2px 6px',
                            borderRadius: '3px',
                            border: '1px solid #444',
                            fontSize: '11px',
                            color: '#e0e0e0',
                            fontFamily: '"Courier New", Courier, monospace',
                            pointerEvents: 'all'
                        }}
                        className="nodrag nopan"
                    >
                        {label}
                    </div>
                </EdgeLabelRenderer>
            )}
        </>
    );
};

const edgeTypes = {
    arc: ArcEdge,
};

// Procedural Dark Mode Colors for Generic Nodes
const generateColorFromText = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 60%, 25%)`; // Dark, saturated vibrant colors
};

interface SchemaVisualizerProps {
  schemaDef: SchemaDefinition;
}

export const SchemaVisualizer: React.FC<SchemaVisualizerProps> = ({ schemaDef }) => {
  const { nodes, edges } = useMemo(() => {
    
    const nodePositions = new Map<string, { x: number, y: number }>();
    const totalNodes = schemaDef.nodes.length;
    
    // Abstracting to a wide circular layout to accommodate any number of nodes dynamically
    const radius = Math.max(300, totalNodes * 60); 
    const centerX = 500;
    const centerY = 400;

    const reactNodes: Node[] = schemaDef.nodes.map((node, index) => {
        
        const angle = totalNodes === 1 ? 0 : (index / totalNodes) * 2 * Math.PI;
        // Two central nodes optimization (fallback manually if it's the 2-node demo case, else circle)
        let xPos, yPos;
        if (totalNodes === 2) {
            xPos = index === 0 ? 300 : 700;
            yPos = centerY;
        } else {
            xPos = centerX + radius * Math.cos(angle);
            yPos = centerY + radius * Math.sin(angle);
        }
        
        nodePositions.set(node.identifyingType, { x: xPos, y: yPos });

        const circleColor = generateColorFromText(node.identifyingType);
        
        // Push the properties box outwards away from the center of the diagram
        const isRightSideOfCenter = xPos >= centerX;
        const pushDirection = isRightSideOfCenter ? 'left' : 'right';

        const boxStyle: React.CSSProperties = {
            position: 'absolute',
            top: '50%',
            transform: 'translateY(-50%)',
            [pushDirection]: '140px', 
            border: '1px solid #888',
            padding: '10px',
            color: '#e0e0e0',
            fontFamily: '"Courier New", Courier, monospace',
            fontSize: '12px',
            textAlign: 'left',
            background: 'transparent',
            minWidth: '220px',
            whiteSpace: 'pre-wrap'
        };

        return {
            id: node.identifyingType,
            position: { x: xPos, y: yPos },
            data: {
                label: (
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        
                        {/* Hidden Handles for Edge Attachment calculations */}
                        <Handle type="source" position={Position.Top} id="top-s" style={{ opacity: 0 }} />
                        <Handle type="target" position={Position.Top} id="top-t" style={{ opacity: 0 }} />
                        
                        <Handle type="source" position={Position.Right} id="right-s" style={{ opacity: 0 }} />
                        <Handle type="target" position={Position.Right} id="right-t" style={{ opacity: 0 }} />
                        
                        <Handle type="source" position={Position.Left} id="left-s" style={{ opacity: 0 }} />
                        <Handle type="target" position={Position.Left} id="left-t" style={{ opacity: 0 }} />
                        
                        <Handle type="source" position={Position.Bottom} id="bottom-s" style={{ opacity: 0 }} />
                        <Handle type="target" position={Position.Bottom} id="bottom-t" style={{ opacity: 0 }} />

                        {/* The Circular Node */}
                        <div style={{ 
                            width: '120px', 
                            height: '120px', 
                            borderRadius: '50%', 
                            background: circleColor, 
                            border: '1px solid #aaa', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center' 
                        }}>
                            <span style={{ color: '#fff', fontSize: '20px', fontFamily: '"Times New Roman", Times, serif' }}>
                                {node.identifyingType}
                            </span>
                        </div>

                        {/* The Floating Properties Box */}
                        <div style={boxStyle}>
                            <div style={{ marginBottom: '4px' }}>
                                LABELS: {node.labels.join(', ')}
                            </div>
                            {Object.entries(node.properties).map(([key, type]) => (
                                <div key={key}>
                                    {key}: {String(type).toUpperCase()}
                                </div>
                            ))}
                        </div>

                    </div>
                )
            },
            style: { 
                background: 'transparent', 
                border: 'none', 
                padding: 0,
                width: '120px',
                height: '120px'
            }
        };
    });
    
    // Mathematically choose the best connection ports
    const getSmartHandle = (dx: number, dy: number, base: string) => {
        if (Math.abs(dx) > Math.abs(dy)) {
            return dx > 0 ? `right-${base}` : `left-${base}`;
        } else {
            return dy > 0 ? `bottom-${base}` : `top-${base}`;
        }
    };

    // Tracking pairs to separate overlapping multi-edges (e.g. Person <-> Account twice)
    const edgePairCounts = new Map<string, number>();

    const reactEdges: Edge[] = schemaDef.relationships.map((rel, index) => {
        const isSelfLoop = rel.sourceNodeLabel === rel.targetNodeLabel;
        
        let sourceHandle = 'right-s';
        let targetHandle = 'left-t';

        if (isSelfLoop) {
            sourceHandle = 'top-s';
            targetHandle = 'top-t';
        } else {
            // Dynamic routing using node center differences
            const sourcePos = nodePositions.get(rel.sourceNodeLabel);
            const targetPos = nodePositions.get(rel.targetNodeLabel);
            
            if (sourcePos && targetPos) {
                const dx = targetPos.x - sourcePos.x;
                const dy = targetPos.y - sourcePos.y;
                
                sourceHandle = getSmartHandle(dx, dy, 's');
                targetHandle = getSmartHandle(-dx, -dy, 't'); // Opposite perspective for target
            }
        }
        
        const undirectedKey = [rel.sourceNodeLabel, rel.targetNodeLabel].sort().join('-');
        const currentOffset = edgePairCounts.get(undirectedKey) || 0;
        edgePairCounts.set(undirectedKey, currentOffset + 1);

        return {
            id: `rel-${rel.identifyingEdge}-${index}`,
            source: rel.sourceNodeLabel,
            target: rel.targetNodeLabel,
            label: rel.identifyingEdge,
            type: 'arc',
            animated: false,
            style: { stroke: '#e0e0e0', strokeWidth: 1.5 },
            markerEnd: {
                type: MarkerType.ArrowClosed,
                color: '#e0e0e0',
            },
            sourceHandle,
            targetHandle,
            data: {
                offsetIndex: currentOffset
            }
        };
    });

    return { nodes: reactNodes, edges: reactEdges };
  }, [schemaDef]);

  return (
    <div style={{ width: '100%', height: '800px', background: '#1A1A1A', overflow: 'hidden' }}>
      <ReactFlow 
        nodes={nodes} 
        edges={edges} 
        edgeTypes={edgeTypes}
        fitView
      >
        <Background color="#333" gap={20} />
        <Controls style={{ background: '#333', fill: '#fff' }} />
      </ReactFlow>
    </div>
  );
};
