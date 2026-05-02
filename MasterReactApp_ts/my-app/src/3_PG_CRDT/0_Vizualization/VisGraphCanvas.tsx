import React, { useEffect, useRef, useMemo } from 'react';
import { Network } from 'vis-network';

interface VisGraphNode {
  id: string;
  type: string;
  label?: string[];
  fill?: string;
  data?: any;
}

interface VisGraphEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  data?: any;
}

interface VisGraphCanvasProps {
  nodes: VisGraphNode[];
  edges: VisGraphEdge[];
  onNodeClick?: (node: VisGraphNode) => void;
  onEdgeClick?: (edge: VisGraphEdge) => void;
  onCanvasClick?: () => void;
  draggable?: boolean;
  labelType?: string;
}

const generateColor = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 70%, 45%)`;
};

export const VisGraphCanvas: React.FC<VisGraphCanvasProps> = ({
    nodes,
    edges,
    onNodeClick,
    onEdgeClick,
    onCanvasClick
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const networkRef = useRef<any>(null);

    // ── Live refs: always hold the current props so the one-time click
    //    listener never goes stale (fixes the stale-closure bug).
    const nodesRef = useRef(nodes);
    const edgesRef = useRef(edges);
    const onNodeClickRef = useRef(onNodeClick);
    const onEdgeClickRef = useRef(onEdgeClick);
    const onCanvasClickRef = useRef(onCanvasClick);

    // Keep refs in sync with every render
    nodesRef.current = nodes;
    edgesRef.current = edges;
    onNodeClickRef.current = onNodeClick;
    onEdgeClickRef.current = onEdgeClick;
    onCanvasClickRef.current = onCanvasClick;

    const { networkNodes, networkEdges } = useMemo(() => {
        const networkNodes = nodes.map(n => ({
            id: n.id,
            // label in this case is the "naming" of the node in the PG View. It does not resemble the label set a node has.
            label: n.id,
            color: { background: n.fill || generateColor(n.type || n.id), border: '#ffffff' },
            font: { color: '#ffffff', size: 16, face: 'monospace' },
            shape: 'circle',
            borderWidth: 2,
            margin: 15,
        }));

        const networkEdges = edges.map(e => ({
            id: e.id,
            from: e.source,
            to: e.target,
            label: e.type || '',
            arrows: 'to',
            font: {
                color: '#c9d1d9',
                size: 12,
                align: 'middle',
                background: 'rgba(13, 17, 23, 0.8)',
                strokeWidth: 0
            },
            color: { color: '#58a6ff', highlight: '#ffffff' },
        }));

        return { networkNodes, networkEdges };
    }, [nodes, edges]);

    // ── Create network once; update data on subsequent renders ────────────
    useEffect(() => {
        if (!containerRef.current) return;

        const data = { nodes: networkNodes, edges: networkEdges };

        const options = {
            interaction: { hover: true, selectConnectedEdges: false },
            manipulation: { enabled: false },
            edges: { smooth: { type: 'dynamic', forceDirection: 'none' } },
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

            // Register click handler ONCE — reads from live refs so it is never stale
            networkRef.current.on('click', (params: any) => {
                if (params.nodes.length > 0) {
                    const id = params.nodes[0];
                    const found = nodesRef.current.find(n => n.id === id);
                    if (found) onNodeClickRef.current?.(found);
                } else if (params.edges.length > 0) {
                    const id = params.edges[0];
                    const found = edgesRef.current.find(e => e.id === id);
                    if (found) onEdgeClickRef.current?.(found);
                } else {
                    onCanvasClickRef.current?.();
                }
            });
        }
    }, [networkNodes, networkEdges]);

    return (
        <div
            ref={containerRef}
            style={{ width: '100%', height: '100%', background: '#0d1117' }}
        />
    );
};
