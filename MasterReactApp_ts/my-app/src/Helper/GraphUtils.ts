import { ReagraphEdge } from './Hook/YJS_hook_Reagraph';

/**
 * Calculates and assigns curvature to edges sharing the same source and target nodes (multigraphs).
 * It ensures that multiple edges between the same two nodes are visually distinct by curving them.
 * 
 * @param edges List of edges to process
 * @returns New list of edges with curvature properties set
 */
export function processEdgeCurvatures(edges: ReagraphEdge[]): ReagraphEdge[] {
    const edgeGroups: Map<string, ReagraphEdge[]> = new Map();

    // 1. Group edges by canonical pair key (sorted ids)
    for (const edge of edges) {
        const sortedIds = [edge.source, edge.target].sort();
        const key = `${sortedIds[0]}-${sortedIds[1]}`;
        
        if (!edgeGroups.has(key)) {
            edgeGroups.set(key, []);
        }
        edgeGroups.get(key)!.push(edge);
    }

    const processedEdges: ReagraphEdge[] = [];

    // 2. Process each group
    edgeGroups.forEach((groupEdges) => {
        const count = groupEdges.length;
        if (count === 0) return;

        // If only 1 edge, usually no curvature needed unless it's a self-loop (which reagraph handles usually, but we can set 0)
        // However, if we want to support self-loops explicitly we might need logic.
        // Assuming simple multigraph between two distinct nodes for now.
        if (count === 1) {
            const edge = groupEdges[0];
            // If self-loop, might need special handling, but let's leave as default (usually approx 1 or handled by lib)
            // For now, set curvature 0 for straight line if distinct nodes
            if (edge.source !== edge.target) {
                processedEdges.push({ ...edge, curvature: 0 });
            } else {
                 processedEdges.push({ ...edge }); // Let library handle default self-loop if undefined
            }
            return;
        }

        // Multiple edges: Distribute curvatures
        // We want to distribute them symmetrically.
        // e.g. 2 edges: 0.5, -0.5
        // e.g. 3 edges: 0.5, 0, -0.5 ?? Or better: 0.7, 0, -0.7
        
        // Let's sort them to ensure deterministic assignment? 
        // Not strictly necessary but good for stability.
        groupEdges.sort((a, b) => a.id.localeCompare(b.id));

        const baseCurvature = 0.5; // Controls the "width" of the curve separation
        
        groupEdges.forEach((edge, index) => {
            // center index
            // e.g. count 2: indices 0, 1. centered: -0.5, 0.5
            // e.g. count 3: indices 0, 1, 2. centered: -1, 0, 1
            
            // Formula: (index - (count - 1) / 2)
            const deviation = index - (count - 1) / 2;
            
            // If we just use deviation * step, we get linear spacing.
            // step size:
            // if count is large, we might want smaller steps or max out?
            // Let's try simple step = 0.5 * deviation
            // But verify direction!
            // If edge is source->target vs target->source, the calculated curvature applies "to the left" or "right"
            // relative to the vector.
            // If we always process based on the canonical group, we must assume a "canonical direction" (e.g. smaller->larger).
            // If an edge is actually larger->smaller, we must negate the calculated curvature so it curves to the "same" visual side as its peer 
            // OR we want them to separate?
            
            // Wait, if we want them to bundle nicely, we assign curvatures relative to the line connecting them.
            // Edge A->B with curv 0.5 curves "left".
            // Edge B->A with curv 0.5 curves "left" (which is "right" looking from A).
            // So two opposing edges with same positive curvature will form a circle-like shape (good).
            
            // But if we have TWO edges A->B.
            // Edge1: 0.5
            // Edge2: ? If we give 0.5, they overlap.
            // So we need distinct curvatures.
            // So for A->B edges, we want curvatures like 0.2, 0.5.
            
            // Strategy:
            // Simply assign distinct values to the generic "link" and let the library handle directionality?
            // Usually libraries take curvature as "deviation from straight line".
            
            // Let's normalize everything to the reference direction (canonical key source -> target).
            const isCanonicalDirection = edge.source < edge.target; // Since we sorted keys, key is source-target
            // Actually key uses sort().
            const canonicalSource = edge.source < edge.target ? edge.source : edge.target;
            // const canonicalTarget = edge.source < edge.target ? edge.target : edge.source;
            
            let curvature = deviation * 0.5; // step size 0.5.
            // check if too wide?
            if (count > 5) curvature = deviation * 0.2; // tighter for many edges
            
            // If self-loop, logic is different, handled by lib usually.
            if (edge.source === edge.target) {
                 // For self loops, reagraph/cytoscape usually need increasing loop offset/size. 
                 // 'curvature' param might not apply same way.
                 // Let's assume distinct curvature values help separate them or leave them be if lib handles it.
                 // Often libs need `loop-radius` or similar.
                 // Reagraph passes props to ThreeJS/D3.
                 // Let's focus on non-self-loops first as per user request.
            } else {
                 if (!isCanonicalDirection) {
                    // If the edge is actually walking 'backwards' against our canonical sort,
                    // a curvature of +X pushes it 'right' (relative to itself), which 'left' relative to canonical.
                    // We want the group to spread out 'centrally'.
                    // So we must invert curvature so it maintains its position in the 'fan'.
                    curvature = -curvature; 
                 }
            }

            // If curvature is exactly 0 and count is odd, it's a straight line.
            
            processedEdges.push({ 
                ...edge, 
                curvature 
            });
        });
    });

    return processedEdges;
}
