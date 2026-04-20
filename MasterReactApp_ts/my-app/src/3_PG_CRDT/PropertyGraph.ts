import * as Y from 'yjs';
import { ORSetRegistry } from './ORSetRegistry';
import { DualKeyMap } from './DualKeyMap';

// ─── Core Types ─────────────────────────────────────────────────────────────

export type NodeId = string;
export type EdgeId = string;
export type Policy = 'ADD_WINS' | 'OBSERVED_REMOVE';

export type NodeProps = Record<string, any>;
export type EdgeProps = Record<string, any>;

export type VisibleNode = {
    id: NodeId;
    type: string;
    label?: string[];
    policy: Policy;
    color?: string;
    props: NodeProps;
};

export type VisibleEdge = {
    id: EdgeId;
    type: string;
    sourceId: NodeId;
    targetId: NodeId;
    props: EdgeProps;
};

// ─── External Validator Interface ────────────────────────────────────────────

/**
 * Optional validator that can be injected at construction time.
 * If omitted, all operations are schema-free and permissive.
 *
 * Implement this interface to enforce domain-specific invariants (e.g. label
 * allow-lists, property type constraints, or connectivity rules) without
 * baking any of that logic into the graph itself.
 */
export interface GraphValidator {
    /** Called before a node is added. Throw a descriptive Error to reject. */
    validateNodeAdd(label: string, props: NodeProps): void;
    /** Called before a node is updated. Throw a descriptive Error to reject. */
    validateNodeUpdate(label: string, currentProps: NodeProps, incomingProps: NodeProps): void;
    /** Called before an edge is added. Throw a descriptive Error to reject. */
    validateEdgeAdd(sourceLabel: string, targetLabel: string, edgeLabel: string, props: EdgeProps): void;
}

/** A no-op validator used when none is provided. */
const PERMISSIVE_VALIDATOR: GraphValidator = {
    validateNodeAdd: () => {},
    validateNodeUpdate: () => {},
    validateEdgeAdd: () => {},
};

// ─── PropertyGraph ───────────────────────────────────────────────────────────

const DEFAULT_POLICY: Policy = 'OBSERVED_REMOVE';

/**
 * Schema-free collaborative Property Graph backed by Yjs CRDTs.
 *
 * Invariants preserved from SchemaGraphV3:
 *  1. Dual-policy node membership: ADD_WINS (timestamp map) or OBSERVED_REMOVE (OR-Set).
 *  2. Version-bound edges: each edge records a snapshot of the observed tags of its
 *     endpoints at creation time. An edge becomes invisible the moment all of those
 *     tags have been tombstoned.
 *  3. Ghost-node detection & cascading garbage collection (optional).
 *  4. Per-property Dual-Key register: `init_<prop>` (add time) vs `<prop>` (update time),
 *     so concurrent add+update races resolve deterministically.
 *
 * Schema validation is intentionally absent from this class. Pass a `GraphValidator`
 * to the constructor to enforce domain constraints from the outside.
 */
export class PropertyGraph {

    private readonly validator: GraphValidator;
    private _registryCache = new WeakMap<Y.Doc, ORSetRegistry>();

    constructor(validator?: GraphValidator) {
        this.validator = validator ?? PERMISSIVE_VALIDATOR;
    }

    // ── Private Yjs Accessors ──────────────────────────────────────────────

    private getNodeRegistry(doc: Y.Doc): ORSetRegistry {
        let registry = this._registryCache.get(doc);
        if (!registry) {
            registry = new ORSetRegistry(doc, 'pg_nodes');
            this._registryCache.set(doc, registry);
        }
        return registry;
    }

    /** ADD_WINS node map: nodeId → timestamp */
    private getNodesSimple(doc: Y.Doc): Y.Map<number> {
        return doc.getMap<number>('pg_nodes_simple');
    }

    /** Permanent policy map: nodeId → Policy (survives deletion) */
    private getNodesPolicies(doc: Y.Doc): Y.Map<string> {
        return doc.getMap<string>('pg_nodes_policies');
    }

    /** Lookup the stored policy for a node. */
    private getNodePolicy(nodeId: NodeId, doc: Y.Doc): Policy {
        return (this.getNodesPolicies(doc).get(nodeId) as Policy) ?? DEFAULT_POLICY;
    }

    /** Policy-aware liveness check. */
    private isNodeAlive(nodeId: NodeId, doc: Y.Doc): boolean {
        const policy = this.getNodePolicy(nodeId, doc);
        return policy === 'ADD_WINS'
            ? this.getNodesSimple(doc).has(nodeId)
            : this.getNodeRegistry(doc).isAlive(nodeId);
    }

    // ── Nodes ──────────────────────────────────────────────────────────────

    /**
     * Add a node.
     *
     * @param doc    - The shared Yjs document.
     * @param nodeId - Stable identifier (must be unique within the doc).
     * @param label  - Human-readable type label (e.g. "Person", "Movie").
     * @param props  - Initial property values.
     * @param policy - Conflict resolution policy (default: OBSERVED_REMOVE).
     * @param color  - Optional display colour for UI renderers.
     */
    addNode({
        doc,
        nodeId,
        label,
        props = {},
        policy = DEFAULT_POLICY,
        color,
    }: {
        doc: Y.Doc;
        nodeId: NodeId;
        label: string;
        props?: NodeProps;
        policy?: Policy;
        color?: string;
    }): void {
        this.validator.validateNodeAdd(label, props);

        doc.transact(() => {
            // Persist policy permanently (must survive node deletion)
            this.getNodesPolicies(doc).set(nodeId, policy);

            if (policy === 'ADD_WINS') {
                this.getNodesSimple(doc).set(nodeId, Date.now());
            } else {
                this.getNodeRegistry(doc).add(nodeId);
            }

            const nodeMap = doc.getMap(`pg_n_${nodeId}`);
            // Structural metadata
            nodeMap.set('__label', label);
            nodeMap.set('__policy', policy);
            if (color) nodeMap.set('__color', color);

            // User-defined properties via Dual-Key register
            const dkm = new DualKeyMap(nodeMap);
            for (const [key, value] of Object.entries(props)) {
                dkm.setInitial(key, value);
            }
        });
    }

    /**
     * Update properties of an existing node.
     * Only the supplied keys are touched; others are left unchanged.
     */
    updateNode({
        doc,
        nodeId,
        props,
    }: {
        doc: Y.Doc;
        nodeId: NodeId;
        props: NodeProps;
    }): void {
        if (!this.isNodeAlive(nodeId, doc)) {
            throw new Error(`PropertyGraph: Node "${nodeId}" not found or already removed.`);
        }

        const nodeMap = doc.getMap(`pg_n_${nodeId}`);
        const dkm = new DualKeyMap(nodeMap);
        const label = (nodeMap.get('__label') as string) ?? '';
        const currentProps = dkm.getAll();

        this.validator.validateNodeUpdate(label, currentProps, props);

        doc.transact(() => {
            for (const [key, value] of Object.entries(props)) {
                dkm.setUpdate(key, value, undefined, doc);
            }
        });
    }

    /**
     * Delete a node (policy-aware).
     */
    deleteNode({
        doc,
        nodeId,
    }: {
        doc: Y.Doc;
        nodeId: NodeId;
    }): void {
        if (!this.isNodeAlive(nodeId, doc)) {
            throw new Error(`PropertyGraph: Node "${nodeId}" not found or already removed.`);
        }

        const policy = this.getNodePolicy(nodeId, doc);

        doc.transact(() => {
            if (policy === 'ADD_WINS') {
                this.getNodesSimple(doc).delete(nodeId);
            } else {
                this.getNodeRegistry(doc).remove(nodeId);
                doc.getMap(`pg_n_${nodeId}`).clear();
            }
        });
    }

    /** Return all currently visible nodes. */
    getVisibleNodes(doc: Y.Doc): VisibleNode[] {
        const visible: VisibleNode[] = [];
        const seen = new Set<NodeId>();

        // 1. ADD_WINS bucket
        this.getNodesSimple(doc).forEach((_ts, id) => {
            if (this.getNodePolicy(id, doc) !== 'ADD_WINS') return;
            seen.add(id);
            const nodeMap = doc.getMap(`pg_n_${id}`);
            if (nodeMap.size === 0) return;
            const dkm = new DualKeyMap(nodeMap);
            visible.push({
                id,
                type: nodeMap.get('__label') as string ?? id,
                policy: 'ADD_WINS',
                color: nodeMap.get('__color') as string | undefined,
                props: dkm.getAll(),
            });
        });

        for (const id of this.getNodeRegistry(doc).getAllAlive()) {
            if (seen.has(id)) continue;
            const nodeMap = doc.getMap(`pg_n_${id}`);
            if (nodeMap.size === 0) continue;
            const dkm = new DualKeyMap(nodeMap);
            visible.push({
                id,
                type: nodeMap.get('__label') as string ?? id,
                policy: 'OBSERVED_REMOVE',
                color: nodeMap.get('__color') as string | undefined,
                props: dkm.getAll(),
            });
        }

        return visible;
    }

    getNodeProps(doc: Y.Doc, nodeId: NodeId): NodeProps | undefined {
        if (!this.isNodeAlive(nodeId, doc)) return undefined;
        const nodeMap = doc.getMap(`pg_n_${nodeId}`);
        return new DualKeyMap(nodeMap).getAll();
    }

    // ── Edges ──────────────────────────────────────────────────────────────

    /**
     * Add a directed edge between two existing (alive) nodes.
     *
     * The edge records a version-bound snapshot of the OR-Set tags of its
     * endpoints: if all those tags are later tombstoned, the edge becomes
     * invisible automatically — no explicit edge deletion required for
     * Observed-Remove nodes.
     *
     * @param edgeId - Optional stable ID (useful for tests / idempotency). A UUID is generated if omitted.
     */
    addEdge({
        doc,
        sourceId,
        targetId,
        type,
        props = {},
        edgeId,
    }: {
        doc: Y.Doc;
        sourceId: NodeId;
        targetId: NodeId;
        type: string;
        props?: EdgeProps;
        edgeId?: EdgeId;
    }): EdgeId {
        if (!this.isNodeAlive(sourceId, doc)) {
            throw new Error(`PropertyGraph: Source node "${sourceId}" does not exist or is removed.`);
        }
        if (!this.isNodeAlive(targetId, doc)) {
            throw new Error(`PropertyGraph: Target node "${targetId}" does not exist or is removed.`);
        }

        const sourceLabel = (doc.getMap(`pg_n_${sourceId}`).get('__label') as string) ?? sourceId;
        const targetLabel = (doc.getMap(`pg_n_${targetId}`).get('__label') as string) ?? targetId;
        this.validator.validateEdgeAdd(sourceLabel, targetLabel, type, props);
        const sourcePolicy = this.getNodePolicy(sourceId, doc);
        const targetPolicy = this.getNodePolicy(targetId, doc);
        const sourceTags = sourcePolicy === 'OBSERVED_REMOVE'
            ? this.getNodeRegistry(doc).getAliveTags(sourceId)
            : [];
        const targetTags = targetPolicy === 'OBSERVED_REMOVE'
            ? this.getNodeRegistry(doc).getAliveTags(targetId)
            : [];

        const uuid: EdgeId = edgeId ?? crypto.randomUUID();

        doc.transact(() => {
            const edgeMap = doc.getMap(`pg_e_${uuid}`);
            const dkm = new DualKeyMap(edgeMap);

            edgeMap.set('__sourceId', sourceId);
            edgeMap.set('__targetId', targetId);
            edgeMap.set('__type', type);
            edgeMap.set('__sourceTags', sourceTags);
            edgeMap.set('__targetTags', targetTags);

            for (const [key, value] of Object.entries(props)) {
                dkm.setInitial(key, value);
            }

            const edgesTargets = doc.getMap<Y.Map<Y.Array<string>>>('pg_edgesTargets');
            let targetMap = edgesTargets.get(sourceId);
            if (!targetMap) {
                targetMap = new Y.Map<Y.Array<string>>();
                edgesTargets.set(sourceId, targetMap);
            }
            let edgeList = targetMap.get(targetId);
            if (!edgeList) {
                edgeList = new Y.Array<string>();
                targetMap.set(targetId, edgeList);
            }
            edgeList.push([uuid]);
        });

        return uuid;
    }

    updateEdge({
        doc,
        edgeId,
        props,
    }: {
        doc: Y.Doc;
        edgeId: EdgeId;
        props: EdgeProps;
    }): void {
        const edgeMap = doc.getMap(`pg_e_${edgeId}`);
        if (edgeMap.size === 0) {
            throw new Error(`PropertyGraph: Edge "${edgeId}" does not exist.`);
        }
        const dkm = new DualKeyMap(edgeMap);
        doc.transact(() => {
            for (const [key, value] of Object.entries(props)) {
                dkm.setUpdate(key, value, undefined, doc);
            }
        });
    }

    deleteEdge({ doc, edgeId }: { doc: Y.Doc; edgeId: EdgeId }): void {
        doc.transact(() => {
            doc.getMap(`pg_e_${edgeId}`).clear();
        });
    }

    getVisibleEdges(doc: Y.Doc): VisibleEdge[] {
        const nodeRegistry = this.getNodeRegistry(doc);
        const edgesTargets = doc.getMap<Y.Map<Y.Array<string>>>('pg_edgesTargets');
        const edges: VisibleEdge[] = [];

        edgesTargets.forEach((sourceMap, _sourceId) => {
            if (!sourceMap) return;

            sourceMap.forEach((edgeList, _targetId) => {
                if (!edgeList) return;

                edgeList.forEach((uuid: string) => {
                    const edgeMap = doc.getMap(`pg_e_${uuid}`);
                    if (edgeMap.size === 0) return; // deleted

                    const storedSourceId = edgeMap.get('__sourceId') as NodeId;
                    const storedTargetId = edgeMap.get('__targetId') as NodeId;
                    const sourcePolicy = this.getNodePolicy(storedSourceId, doc);
                    const targetPolicy = this.getNodePolicy(storedTargetId, doc);


                    if (sourcePolicy === 'ADD_WINS') {
                        if (!this.getNodesSimple(doc).has(storedSourceId)) return;
                    } else {
                        const tags: string[] = (edgeMap.get('__sourceTags') as string[]) ?? [];
                        if (!tags.some(tag => nodeRegistry.isTagAlive(tag))) return;
                    }

                    if (targetPolicy === 'ADD_WINS') {
                        if (!this.getNodesSimple(doc).has(storedTargetId)) return;
                    } else {
                        const tags: string[] = (edgeMap.get('__targetTags') as string[]) ?? [];
                        if (!tags.some(tag => nodeRegistry.isTagAlive(tag))) return;
                    }

                    const dkm = new DualKeyMap(edgeMap);
                    edges.push({
                        id: uuid,
                        sourceId: storedSourceId,
                        targetId: storedTargetId,
                        type: (edgeMap.get('__type') as string) ?? '',
                        props: dkm.getAll(),
                    });
                });
            });
        });

        return edges;
    }

    getGhostNodes(doc: Y.Doc): Set<NodeId> {
        const ghosts = new Set<NodeId>();
        const edgesTargets = doc.getMap<Y.Map<Y.Array<string>>>('pg_edgesTargets');

        edgesTargets.forEach((sourceMap, sourceId) => {
            if (!this.isNodeAlive(sourceId, doc)) ghosts.add(sourceId);
            if (!sourceMap) return;
            sourceMap.forEach((_, targetId) => {
                if (!this.isNodeAlive(targetId, doc)) ghosts.add(targetId);
            });
        });

        return ghosts;
    }

    /**
     * Remove all edges that touch ghost nodes.
     * Safe to call at any time; idempotent.
     */
    garbageCollectGhosts(doc: Y.Doc): void {
        const ghosts = this.getGhostNodes(doc);
        if (ghosts.size === 0) return;

        const edgesTargets = doc.getMap<Y.Map<Y.Array<string>>>('pg_edgesTargets');

        doc.transact(() => {
            edgesTargets.forEach((sourceMap, sourceId) => {
                if (!sourceMap) return;
                sourceMap.forEach((edgeList, targetId) => {
                    if (!edgeList) return;
                    if (ghosts.has(sourceId) || ghosts.has(targetId)) {
                        edgeList.forEach((uuid: string) => {
                            this.deleteEdge({ doc, edgeId: uuid });
                        });
                    }
                });
            });
        });
    }
}
