import { ReagraphEdge } from './Hook/YJS_hook_Reagraph';

// experiments with basic edge curvature

export function processEdgeCurvatures(edges: ReagraphEdge[]): ReagraphEdge[] {
    const edgeGroups: Map<string, ReagraphEdge[]> = new Map();

    for (const edge of edges) {
        const sortedIds = [edge.source, edge.target].sort();
        const key = `${sortedIds[0]}-${sortedIds[1]}`;
        
        if (!edgeGroups.has(key)) {
            edgeGroups.set(key, []);
        }
        edgeGroups.get(key)!.push(edge);
    }

    const processedEdges: ReagraphEdge[] = [];

    edgeGroups.forEach((groupEdges) => {
        const count = groupEdges.length;
        if (count === 0) return;

        if (count === 1) {
            const edge = groupEdges[0];

            if (edge.source !== edge.target) {
                processedEdges.push({ ...edge, curvature: 0 });
            } else {
                 processedEdges.push({ ...edge });
            }
            return;
        }

        groupEdges.sort((a, b) => a.id.localeCompare(b.id));

        const baseCurvature = 0.5;
        
        groupEdges.forEach((edge, index) => {

            const deviation = index - (count - 1) / 2;

            const isCanonicalDirection = edge.source < edge.target; 
            const canonicalSource = edge.source < edge.target ? edge.source : edge.target;

            
            let curvature = deviation * 0.5;
            if (count > 5) curvature = deviation * 0.2;

            if (edge.source === edge.target) {

            } else {
                 if (!isCanonicalDirection) {

                    curvature = -curvature; 
                 }
            }
            
            processedEdges.push({ 
                ...edge, 
                curvature 
            });
        });
    });

    return processedEdges;
}
