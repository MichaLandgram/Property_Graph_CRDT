# Cardinality Constraint Solutions for CRDT Property Graphs

Distinct approaches to enforcing **cardinality constraints** in a CRDT-based property graph:

- **Max N (`≤ N`):** "At most N edges"
- **Min N (`≥ N`):** "At least N edges"
- **Exact N (`= N`):** "Exactly N edges" - maybe just use property to solve this => Only Change possible if replace operation therefore.

Each trades off differently against three key dimensions:

1. **Safety**: Does the constraint ever get violated post-merge?
2. **Coordination**: How often must replicas communicate to enforce the constraint?
3. **Availability**: Can offline clients continue operating?

## The Fundamental Asymmetry

| Operation | Max N | Min N | Exact N |
|-----------|-------|-------|---------|
| **Add edge** |  Problem (exceeds limit) |  Always safe |  Problem (if at limit) |
| **Remove edge** |  Always safe |  Problem (drops below limit) |  Problem (if at minimum) |
| **Repair strategy** | Drop oldest/excess edges | Add default edge or readd edge | Drop + add (contradictory) |

## Option A: Pure CRDT with Soft Constraints & Deterministic Repair

### Core Idea
- Accept that concurrent adds can exceed the limit.
- Use a **deterministic repair function** applied at read-time or post-merge to enforce the invariant on a derived view.
- All writes are coordination-free; constraint is enforced "eventually" by recomputing the valid subset

**Key Property (I-confluence perspective):**
- The invariant defined on the *derived* view (after repair) is I-confluent: once all replicas merge and apply the same deterministic function, they converge to the same set of N edges.
- The original invariant on the raw EdgeSet is **not** I-confluent (two replicas can independently add edges, merge to > N).

### Repair Strategies

1. **Keep-Earliest**: Retain the N edges with lowest timestamps.
   - Pro: Intuitive; old edges survive.
   - Con: New additions may be silently dropped.

2. **Keep-By-Policy**: Application-specific rule (e.g., "keep friends added by friends of the owner").
   - Pro: Can be domain-specific and fair.
   - Con: Requires custom logic; harder to reason about globally.

3. **Keep-Highest-ID**: Deterministic based on replica ID and clock.
   - Pro: Simple to implement, reproducible.
   - Con: Biased toward certain replicas or times.

   ## Option B: Escrow / Bounded Counters with Quota Management

### Core Idea
- Treat "Max N" as a **scarce resource** that must be budgeted across replicas.
- Each replica gets a **quota** (how many edges it's allowed to add before coordination).
- Summing all quotas ≤ N guarantees that total committed edges never exceed N.
- When a replica exhausts its quota, it must coordinate (rebalance, request more quota, or block).

### Quota Strategies

1. **Static Equal Split** (simplest)
   - Divide capacity equally: `quota[r] = N / numReplicas` for each replica r.
   - Pros: Simple, predictable.
   - Cons: Doesn't adapt; unfair if replicas join/leave dynamically.

2. **Dynamic Rebalancing** (adaptive)
   - Periodically (or on-demand) reallocate quota based on usage patterns.
   - E.g., if replica A has used 90% of its quota and B has used 10%, transfer unused quota from B to A.
   - Pros: Better utilization; responsive to client behavior.
   - Cons: Requires coordination; more complex; possible thrashing.

3. **Lazy / On-Demand Rebalancing**
   - Only request more quota when local quota is exhausted.
   - A background process or on-write check sends quota requests.
   - Pros: Minimizes coordination; simple.
   - Cons: Users may see "quota exceeded" errors; latency between request and grant.

   ## Option C: Hybrid Approach (Escrow + Repair Fallback)

### Core Idea
- Use **escrow as the primary mechanism** (fast, coordination-free path when quota available).
- When quota is exhausted and coordination fails (or is too slow), **fall back to repair** (deterministic drop).
- Combines safety benefits of escrow with availability benefits of pure CRDT.