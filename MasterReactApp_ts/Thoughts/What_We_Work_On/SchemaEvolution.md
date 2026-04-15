# Schema Evolution Ideas

Mainly based on [Lens Mechanisms for Schema Evolution](https://dspace.mit.edu/bitstream/handle/1721.1/145983/3447865.3457963.pdf?sequence=1&isAllowed=y)

## What should be evovlable? - open to discussion.
* 1. Add, Remove, Rename Properties
* 2. Change [Optional] to [Required]
* 3. Change Default Value of Property
* 4. Change Type of Property
* 5. Change allowed Labels (Nodes/Edges)
* 6. Change allowed connections
* 7. Change Cardinality (when cardinality supported)

# Questions: 
How should evolable be defined? Restart the property? Base on the old property?

The two Options I think about: 
# 1. Versioning (Idea based on RxDB)
### RxDB (Document-Based)
*   **Model:** Data is a JSON Document.
*   **Migration:** `v1 -> v2`. A function `migrate(doc)` **rewrites** the document.
*    They prioritize **Query Performance**. Indexes require the data on disk to match the schema exactly.
*   **Tradeoff:** Migration often requires re-writing the database. In a P2P system, if I rewrite my DB to V2, I can no longer easily sync with your V1 DB without conflict logic.

# 2. The "No-Version" Concept (Continuous Evolution)
"v1 -> v2" is not a discrete step. It is a continuous stream of updates.
*   **Concurrent Schema Edits:** Schema as a YMap
    *   User A adds `age` (Number).
    *   User B adds `email` (String).
    *   **Result:** The Schema contains *both*. No conflict logic needed (unless they redefine the *same* property name with different types).

**The Concurrent SCHEMA Problem (Your Insight):**
Since the Schema itself is a CRDT (`CollaborativeSchema` = Y.Map), TWO clients can edit the Schema concurrently:
```
Timeline (Schema-Level Conflict):
  Client A:  schema.set('Person.age', 'string')   // changes age to String
  Client B:  schema.set('Person.age', 'boolean')   // changes age to Boolean
  
  After Sync (Yjs LWW on schema Y.Map):
  - ONE of them wins (Last-Write-Wins based on clientID + clock).
  - The "loser's" nodes may now have wrong-typed data for 'age'.
  - If both used Delete-and-Readd on the DATA:
    Both delete('age') + set('age', ...) → Two new items for same key.
    Yjs resolves to ONE item (LWW), the other is garbage.
    Data from BOTH old values is lost.
```


## 2. Lens Write Strategy (Lazy Migration)
The user interaction is the trigger for persistence. We adopt a **"Migrate-on-Write"** (or just-in-time) strategy.

### Concept
*   **No Background Jobs:** We do *not* iterate the graph to "fix" old nodes. This avoids "Update Storms".
*   **User Action Trigger:** When a user *edits* a node (even an unrelated property), the Lens "materializes" the schema changes for that specific node.

### Logic Flow (Put-Lens)
1.  **Read:** User loads `Node A`. Lens computes virtual `middleName: ""` (default).
2.  **Edit:** User changes `age: 25`.
3.  **Write:** The application saves the node. The Lens Middleware intercepts the save:
    *   Detects `middleName` is missing in storage but present in Schema.
    *   Writes **both** `age: 25` AND `middleName: ""` to the YMap.
4.  **Result:** `Node A` is now fully migrated v2. `Node B` (untouched) remains v1.

---

## 3. Renaming Strategy (Aliasing)
How do we rename `addr` -> `address` without losing data or breaking concurrent edits?

### Schema Aliasing (Forever Backward Compatibility)
Active Key in Storage: `addr` (The "Source of Truth" for historical reasons).
Schema Display Name: `address`.

**Lens Read Logic:**
```typescript
{
  name: "address",
  alias: ["addr"] // Look here if 'address' is missing
}
```

**Lens Write Logic (Migrate-on-Write):**
When writing `address`:
1.  Set `address` = `newValue`.
2.  Delete `addr` (Old Alias).
*Result:* The node is naturally migrated to the new key structure over time.

---

## 4. Lifecycle & Namespace Management
A chosen name can not be used again

### The "Burned Key" Rule
Once a key `addr` has been used to mean "Street Address", it is dangerous to reuse it to mean "Addressee Name" **within the same context**.

### Scope of Burning (Label-Scoped)
You are correct! In a Property Graph, schema is usually defined per **Node Label**.
*   `Person.addr` is burned? -> YES.
*   `Order.addr` (never existed)? -> **Safe to use!**

**Why?**
Because the **Lens** selects the schema based on `node.get('label')`.
*   If I read a `Person` node, the Lens checks `Schema['Person']` and sees `addr` is deprecated.
*   If I read an `Order` node, the Lens checks `Schema['Order']` and sees `addr` is a valid new field.
*   *Caveat:* Be careful if you allow changing labels (e.g. `Person` -> `Order`).

### The Safe Lifecycle
1.  **Active:** Key `addr` is used.
2.  **Aliased:** Key `addr` maps to `address`. (Migration Phase).
3.  **Deprecated:** Key `addr` is ignored by Lens, but reserved. (Write Logic deletes it found).
4.  **Burned:** Key `addr` is never used again. 

### If you MUST reuse a key (Advanced):
You need **Schema-Aware Storage** (e.g. `{"v1:addr": ..., "v2:addr": ...}`).
*   In Yjs, this implies encoding version "Epochs" into keys.
*   *Recommendation:* **Don't reuse keys.** Variable names are cheap. Use `addr_name` instead of recycling `addr`.

---

## 5. Eager Migration (The "Hard" Approach)
**Context:** After Schema Update update data immediatly.

### Critical Challenges with Yjs Types
1.  **YArray <-> YMap Conversion:**
    *   *Scenario:* Client A converts `tags` (Array) to `tagMap` (Map). Client B concurrently adds item to `tags` Array.
    *   *Conflict:* Syncing A and B results in a "Zombie Array" (B's edit) and a "New Map" (A's edit).
    *   *Thesis Insight:* **Structural Migrations (Array <-> Map) are essentially incompatible with Coordination-Free Evolution.** They require a hard "Stop-The-World" or a new property name (`tags_v2`).

2.  **The Transaction Loop:**
    ```javascript
    nodes.forEach(n => n.set(prop, coercer(n.get(prop))))
    ```
    *   **Problem:** This "touches" every node. In a P2P sync, this generates a massive "Delta Update" that every other client must download and apply. 
    *   **Thesis Counter-Argument:** Avoid massive updates. Use Lenses.

## Evaluation Conclusion
*   **Safe Migrations (Primitives):** Implement via **Lens (Read-Time)**. cheapest, safest.
*   **Unsafe Migrations (Complex Types):**
    *   *Option A:* Forbidden.
    *   *Option B:* **Copy-on-Write (v2).** Don't convert in-place. Create `address_v2` (Map) and deprecate `address` (Array).
    *   **Reasoning:** In-place Type conversion of a CRDT (e.g. YArray becoming YMap) is technically impossible without deleting the object and creating a new one with the same key (which breaks concurrent merges).

---

## 6. Comparison with Cambria (Ink & Switch)
Ref: [Project Cambria: Translate your data with lenses](https://www.inkandswitch.com/cambria/)

### Shared Foundations
Our approach and Cambria are built on the **same core idea**:
*   **Bidirectional Lenses** to translate data between schema versions on-read and on-write.
*   **No Eager Migration** — data in storage stays in its original format until touched.
*   **CRDT Integration** — Cambria integrates with Automerge; we integrate with Yjs.
*   **Forward + Backward Compatibility** — old clients can read new data and vice versa.

### Key Differences

| Aspect | Cambria | Our Approach (Thesis) |
| :--- | :--- | :--- |
| **CRDT Library** | Automerge | Yjs |
| **Data Model** | Flat JSON Documents | Property Graph (Nodes + Edges + Labels) |
| **Lens Granularity** | Per-document | Per-Label (scoped to Node/Edge type) |
| **Lens Storage** | Lens graph stored in the document itself | Schema stored as CRDT Y.Map (`CollaborativeSchema`) |
| **Version Routing** | Graph of lenses, shortest-path between schemas | Flat: one "current" schema per label, aliases for old keys |
| **Translation Target** | JSON Patch (operation-level) | Direct YMap read/write (value-level) |
| **Type Changes** | `convert` lens (e.g. boolean → string mapping) | Coercion Matrix with 3 safety tiers |
| **Structural Changes** | `wrap`/`head` for scalar ↔ array | Copy-on-Write (new key) for YArray ↔ YMap |
| **Schema Scope** | Generic (any JSON) | Graph-specific (constraints, connectivity, cardinality) |

### What Cambria Solves That We Don't (Yet)
*   **Lens Composition Graph:** Cambria can chain lenses (v1→v2→v3) automatically via shortest-path. We currently only support "current schema + aliases".
*   **Operation-Level Translation:** Cambria translates individual *patches* (ops), not whole values. This preserves intent better for concurrent edits.
*   **Scalar ↔ Array:** Cambria's `wrap`/`head` lens handles this (with documented trade-offs). We mark it as ❌ Forbidden.

### What We Add Beyond Cambria
*   **Graph Constraints:** Cambria doesn't handle connectivity rules, cardinality, or referential integrity — these are Property Graph-specific concerns that our thesis addresses.
*   **Label-Scoped Schemas:** Our "Burned Key" rule is scoped per Node Label, not global. Cambria's lenses are document-wide.
*   **Concurrent Schema Edits:** Cambria assumes lenses are defined by developers. Our `CollaborativeSchema` (Y.Map) allows runtime schema evolution by users — introducing the concurrent schema conflict problem we analyzed.
*   **CRDT Type Changes:** Cambria operates on JSON primitives. We explicitly analyze YArray ↔ YMap ↔ Counter structural changes, which are unique to Yjs's nested CRDT types.

### Thesis Positioning
Cambria is **Related Work**. Our thesis builds on the same Lens foundation but applies it to a **more constrained domain** (Property Graphs with structural/semantic constraints). The contribution is:
1.  Adapting Lens-based evolution to **graph-specific constraints** (connectivity, cardinality).
2.  Handling **CRDT-native types** (YArray, YMap, Counter) that Cambria's JSON model doesn't address.
3.  Analyzing **concurrent schema evolution** in a system where the schema itself is a CRDT.

---

## 7. Schema Y.Map Design & Allowed Operations

### Current Problem with `CollaborativeSchema`
The existing design in `variable_schema_1.tsx` has issues:
*   **Y.Array for labels** — append-only; you can't cleanly "remove" a label type.
*   **Deeply nested Y.Maps** — `Y.Map<Y.Map<Y.Map<dataTypes>>>` is hard to reason about.
*   **No alias/deprecation metadata** — no way to express renames or burned keys.

### Proposed Schema Structure in Y.Map

```
ydoc.getMap('__schema__')  // Root Schema Map
│
├── "labels"  : Y.Map<Y.Map>          // Label definitions
│   ├── "Person"  : Y.Map               // One entry per node label
│   │   ├── "policy"  : "ADD_WINS"       // Default policy for this label
│   │   ├── "deprecated" : false         // Soft-delete for labels
│   │   └── "fields"  : Y.Map            // Property definitions
│   │       ├── "name" : Y.Map
│   │       │   ├── "type"     : "string"
│   │       │   ├── "required" : true
│   │       │   ├── "default"  : ""
│   │       │   └── "aliases"  : []       // Old names (for rename)
│   │       ├── "age" : Y.Map
│   │       │   ├── "type"     : "number"
│   │       │   ├── "required" : false
│   │       │   ├── "default"  : 0
│   │       │   └── "aliases"  : []
│   │       └── "address" : Y.Map
│   │           ├── "type"     : "string"
│   │           ├── "required" : false
│   │           ├── "default"  : ""
│   │           └── "aliases"  : ["addr"]  // Renamed from 'addr'
│   └── "Account" : Y.Map
│       └── ...
│
├── "edgeLabels" : Y.Map<Y.Map>       // Edge label definitions
│   └── "transfer" : Y.Map
│       ├── "deprecated" : false
│       └── "fields"  : Y.Map             // Edge property definitions
│
└── "connectivity" : Y.Map<Y.Map<Y.Map>>  // Allowed connections
    └── "Person" : Y.Map                  // Source label
        └── "Account" : Y.Map             // Target label
            ├── "allowed"    : true        // Is this connection active?
            └── "edgeTypes"  : Y.Map       // Which edge labels are allowed?
                ├── "own"    : true
                └── "apply"  : true
```

**Why nested Y.Maps for connectivity (not composite keys):**
*   `"Person->Account"` as a string key is hard to query ("give me all targets for Person").
*   Nested `connectivity.get('Person').get('Account')` allows natural traversal.
*   Each `edgeType` is a Y.Map key with `true/false` — easy to add/remove with LWW.

### Why Y.Map for Everything (Not Y.Array)
*   **Y.Map.set()** = Last-Write-Wins. Safe for concurrent edits.
*   **Y.Map.delete()** = Clean removal (vs Y.Array where you can't easily remove by value).
*   **Y.Map keys** are natural identifiers (label name, field name).
*   **Y.Array** would be needed only for ordered lists (like `aliases`), but even there we could use a comma-separated string to keep it simple.

### Field Definition Structure
Each property field is a Y.Map with:
```typescript
interface FieldDefinition {
    type: PrimitiveData | 'counter' | 'yarray' | 'ymap';  // What type the field should be
    required: boolean;          // notNull = true, nullable = false
    default: any;               // Default value for Lens read when missing
    aliases: string[];          // Old key names (for rename support)
    deprecated?: boolean;       // Soft-delete: field is ignored but key is burned
    // For complex types:
    element?: string;           // Element type for YArray
    value?: string;             // Value type for YMap
}
```

### Allowed Schema Operations (Restricted Set)
Only these operations are safe in a Local-First CRDT system:

| # | Operation | Y.Map Action | Concurrent-Safe? |
| :--- | :--- | :--- | :--- |
| 1 | **Add Field** | `fields.set('email', {type:'string', required:false, default:''})` | ✅ Yes |
| 2 | **Remove Field** | `fields.get('email').set('deprecated', true)` | ✅ Yes (soft-delete) |
| 3 | **Rename Field** | `fields.set('address', {..., aliases:['addr']})` + deprecate `addr` | ✅ Yes |
| 4 | **Change Default** | `fields.get('age').set('default', 18)` | ✅ Yes (LWW) |
| 5 | **Change Required** | `fields.get('age').set('required', true)` | ✅ Yes (LWW) |
| 6 | **Change Type (Safe)** | `fields.get('age').set('type', 'string')` | ⚠️ LWW (Lens handles coercion) |
| 7 | **Change Type (Structural)** | Create new field `address_v2` with new type | ✅ Yes (Copy-on-Write) |
| 8 | **Add Label** | `labels.set('Vehicle', {...})` | ✅ Yes |
| 9 | **Deprecate Label** | `labels.get('TEST').set('deprecated', true)` | ✅ Yes |
| 10 | **Add Connectivity** | `conn.get('Person').get('Vehicle').get('edgeTypes').set('drives', true)` | ✅ Yes |
| 11 | **Remove Edge Type** | `conn.get('Person').get('Vehicle').get('edgeTypes').set('drives', false)` | ⚠️ See below |
| 12 | **Block Connection** | `conn.get('Person').get('Vehicle').set('allowed', false)` | ⚠️ See below |

### Forbidden Operations
These are **NOT** exposed as schema operations:
*   ❌ **Hard Delete Field** — Use soft-delete (`deprecated: true`). Hard delete loses the "burned key" metadata.
*   ❌ **Reuse Deprecated Field Name** — The name is burned (per label scope).
*   ❌ **Delete-and-Readd for Type Change** — Use Copy-on-Write (new field name) instead.
*   ❌ **Change Label of Existing Nodes** — Too dangerous (schema context changes).

### Connectivity Evolution (Detail)

#### Adding a new connection
Simplest case — always safe:
```typescript
// Allow Person -> Vehicle with edge type 'drives'
schema.transact(() => {
    const personConn = connectivity.get('Person') || new Y.Map();
    const vehicleTarget = new Y.Map();
    vehicleTarget.set('allowed', true);
    const edgeTypes = new Y.Map();
    edgeTypes.set('drives', true);
    vehicleTarget.set('edgeTypes', edgeTypes);
    personConn.set('Vehicle', vehicleTarget);
    connectivity.set('Person', personConn);
});
```

#### Removing an edge type
**Problem:** What about existing edges of that type?
```
Scenario: Remove 'apply' from Person -> Account
But 100 existing edges have label 'apply'.
```

**Two strategies (same pattern as field deprecation):**

| Strategy | Action | Existing Edges | Concurrent Safety |
| :--- | :--- | :--- | :--- |
| **Soft-Block** | `edgeTypes.set('apply', false)` | Stay visible, but new ones are rejected | ✅ Safe |
| **Hard-Block + GC** | Same + garbage collect old edges | Old edges removed in background | ⚠️ Loses data |

**Recommendation: Soft-Block (Lens-Consistent)**
*   `edgeTypes.set('apply', false)` — the edge type is "deprecated".
*   **New edges:** Rejected at write time (`testConnectivity` throws).
*   **Existing edges:** Still visible and readable. Treated as "legacy" data.
*   **Optional cleanup:** A GC pass can later remove them if desired (same as ghost node cleanup).

#### Concurrent Connectivity Conflicts
```
Client A: edgeTypes.set('transfer', false)   // Removes 'transfer'
Client B: addEdge(Person -> Account, 'transfer')  // Creates a 'transfer' edge
```
**Result (after sync):**
*   Schema says `transfer = false`.
*   But the edge exists in the graph.
*   **Resolution:** The edge becomes a "Schema Violation" — visible but flagged.
*   This is consistent with the Lens philosophy: **Availability > Strict Consistency.**
*   The edge is not deleted automatically. The user/admin decides what to do.

#### Adding a new edge type to existing connection
```typescript
// Add 'borrow' to Person -> Account
conn.get('Person').get('Account').get('edgeTypes').set('borrow', true);
```
This is always safe — it's purely additive. Existing edges are unaffected.

---

## 8. Garbage Collection (GC)

GC in a Local-First CRDT is fundamentally different from centralized DB GC.  
**Core tension:** You want to clean up dead data, but an offline client might still reference it.

### What Needs GC?

| Dead Data | Source | Example |
| :--- | :--- | :--- |
| Deprecated fields | Schema evolution | `addr` renamed to `address`, old `addr` values still on nodes |
| Deprecated edge types | Connectivity evolution | `apply` edges still exist after `edgeTypes.set('apply', false)` |
| Ghost nodes/edges | OR-Set tombstoning | Node deleted but tombstone + data remain in Y.Map |
| Burned key metadata | Namespace management | `deprecated: true` flags in schema |
| Old alias entries | Rename lifecycle | `aliases: ["addr"]` after all nodes migrated |

### GC Strategy: Lazy Sweep (Migrate-on-Write)
Already built into the Lens Write Strategy:
```
User edits Person node "Alice":
1. Lens reads: finds 'addr' (old key), returns it as 'address'
2. User saves:
   - Lens writes 'address' = value  (new key)
   - Lens deletes 'addr'            (GC of old key)
```
*   **No background jobs.** Each user interaction cleans up one node.
*   **Gradual:** Untouched nodes keep their old keys forever (acceptable).
*   **Safe:** Only the writing client GCs, and only the node it's editing.

### GC Strategy: Schema Field Metadata (Never GC)
The `deprecated: true` flag and `aliases` array in the **schema** should **never** be garbage collected.
*   They are tiny (bytes, not kilobytes).
*   They prevent namespace reuse violations.
*   Removing them creates the "Zombie Data" problem if an offline client syncs old data.

**Rule: Schema metadata is permanent. Data is GC'd lazily.**

### GC Strategy: Edge Cleanup (3 Automatic Options + Manual)

#### Option 1: Lazy Edge Sweep (on Traversal) — Recommended
Same pattern as field migration. When `getEdges()` reads edges, it also cleans deprecated ones:
```typescript
function getEdges(graph, sourceId, schema) {
    const allEdges = graph.get('edges');
    const result = [];
    const sourceLabel = getNodeLabel(graph, sourceId);
    
    allEdges.forEach((edgeMap, edgeId) => {
        const edgeLabel = edgeMap.get('label');
        const targetLabel = getNodeLabel(graph, edgeMap.get('target'));
        const conn = schema.connectivity
            .get(sourceLabel)?.get(targetLabel)?.get('edgeTypes');
        
        if (conn?.get(edgeLabel) === false) {
            // Deprecated edge type — auto-delete on read
            graph.transact(() => deleteEdge(graph, edgeId));
            return;  // Skip, don't include in result
        }
        result.push(edgeMap);
    });
    return result;
}
```
*   **Pro:** Zero coordination, gradual, user-driven.
*   **Con:** Only GCs edges that are actually traversed/queried.
*   **Safe:** Same safety as field lazy sweep — worst case, offline client re-creates the edge, and it gets cleaned again next traversal.

#### Option 2: Schema Observer (on Schema Change)
When the schema changes (edge type set to `false`), trigger a one-time sweep:
```typescript
schema.connectivity.observeDeep((events) => {
    events.forEach(event => {
        // Detect when an edgeType was set to false
        event.changes.keys.forEach((change, key) => {
            if (change.action === 'update' && event.target.get(key) === false) {
                // Trigger cleanup for this edge type
                gcEdgesOfType(graph, sourceLabel, targetLabel, key);
            }
        });
    });
});
```
*   **Pro:** Immediate — cleans as soon as the schema changes.
*   **Con:** Generates a big transaction if many edges exist. "Update Storm" problem.
*   **Caution:** All online clients would fire this observer simultaneously → duplicate deletes (harmless but wasteful).

#### Option 3: Reactive Cleanup (on Node Interaction)
When a user interacts with a node (edit, view details), clean up its deprecated edges:
```typescript
function onNodeInteraction(graph, nodeId, schema) {
    const nodeLabel = getNodeLabel(graph, nodeId);
    const edges = getEdgesForNode(graph, nodeId);
    
    graph.transact(() => {
        edges.forEach(edge => {
            const targetLabel = getNodeLabel(graph, edge.target);
            const allowed = schema.connectivity
                .get(nodeLabel)?.get(targetLabel)
                ?.get('edgeTypes')?.get(edge.label);
            if (allowed === false) {
                deleteEdge(graph, edge.id);
            }
        });
    });
}
```
*   **Pro:** Scoped to one node — small transactions, natural user flow.
*   **Con:** Nodes never interacted with keep their dead edges.
*   **This mirrors the Lens field migration perfectly.**

#### Option 4: Admin Manual (Bulk Sweep)
```typescript
function gcEdgeType(graph, sourceLabel, targetLabel, edgeType) {
    const edges = getEdges(graph);
    graph.transact(() => {
        edges.forEach(edge => {
            if (edge.label === edgeType 
                && edge.source.label === sourceLabel 
                && edge.target.label === targetLabel) {
                deleteEdge(graph, edge.id);
            }
        });
    });
}
```
*   **When:** Admin explicitly triggers via UI.
*   **Risk:** Update Storm (same as Schema Observer).

#### Comparison

| | Lazy Sweep | Schema Observer | Reactive (Node) | Admin Manual |
| :--- | :--- | :--- | :--- | :--- |
| **Trigger** | Edge query | Schema change | Node interaction | Explicit |
| **Transaction Size** | 1 edge | All edges | Edges of 1 node | All edges |
| **Update Storm Risk** | None | High | None | High |
| **Coverage** | Partial | Full | Partial | Full |
| **Thesis Recommendation** | **✅ Best** | ⚠️ Optional | ✅ Good | ⚠️ Fallback |


### GC Strategy: Ghost Node/Edge Cleanup
Already handled by the OR-Set architecture:
*   Tombstoned items are invisible to `getVisibleNodes()`.
*   The tombstone data stays in the Y.Map (Yjs never truly deletes).
*   Yjs's internal GC (`gc: true` option) can reclaim tombstoned item *content* but keeps the tombstone marker.

### What Yjs GC Does vs What We Do

| Layer | Who GCs | What Gets Cleaned |
| :--- | :--- | :--- |
| **Yjs Internal** (`gc: true`) | Yjs automatically | Tombstoned item *content* (saves memory) |
| **Lens Write** (Lazy Sweep) | Our code, on user edit | Old field keys, deprecated values |
| **Admin GC** (Manual) | Explicit trigger | Deprecated edges, orphaned data |
| **Schema Metadata** | Never | Aliases, deprecated flags (permanent) |

### The Offline Client Problem
```
Timeline:
  Epoch 1: Schema has 'addr' (active)
  Epoch 2: Schema renames to 'address' (addr deprecated)
  Epoch 3: GC runs, deletes all 'addr' values from nodes
  Epoch 4: Offline client syncs, writes addr = "123 Main St" (old schema)
  
  Result: 'addr' reappears on the node. Lens handles it via aliases.
          No corruption, just a re-migration on next edit.
```
**Conclusion:** GC is safe because the Lens always handles stale data gracefully. The worst case is  re-migration, never corruption.

---

## 9. Type Lattice (Deterministic Type Conflict Resolution)

### The Problem with Yjs LWW
Yjs resolves concurrent writes to the same Y.Map key via **Last-Write-Wins** (clientID + lamport clock). You **cannot** modify this:
```
Client A: schema.fields.get('age').set('type', 'number')
Client B: schema.fields.get('age').set('type', 'string')

After sync: ONE wins (arbitrary — based on clientID).
You wanted: 'string' always wins (it's wider).
```
Yjs provides no API to customize merge resolution. It's baked into the CRDT.

### Solution: Don't Use LWW — Use Add-Wins + Lattice
Instead of storing the type as a **single value** (which triggers LWW), store it as a **Y.Map of type votes** where both concurrent edits survive:

```
Before (LWW — broken):
  fields.get('age').set('type', 'string')   // One value, LWW picks winner

After (Add-Wins — deterministic):
  fields.get('age').get('typeVotes')  // Y.Map
    .set('string', true)              // Client A's vote
    .set('number', true)              // Client B's vote
    // Both survive! Y.Map add-wins keeps both keys.
```

### The Type Lattice (Ordering)
Define a **total order** on types. The "widest" (most general) type always wins:

```
boolean < number < date < string
   1        2       3       4     (rank)
```

**Why this ordering?**
*   `boolean` → can be represented as `number` (0/1) → can be a `string` ("true")
*   `number` → can be a `string` ("42") but not vice versa
*   `date` → can be a `string` (ISO format) or `number` (epoch)
*   `string` → **absorbs everything** (universal representation)

### The Resolve Function
```typescript
const TYPE_RANK: Record<string, number> = {
    'boolean': 1,
    'number':  2,
    'date':    3,
    'string':  4,
};

function resolveType(typeVotes: Y.Map<boolean>): string {
    let maxRank = 0;
    let winner = 'string'; // Default fallback: widest type
    
    typeVotes.forEach((active, typeName) => {
        if (active && (TYPE_RANK[typeName] ?? 0) > maxRank) {
            maxRank = TYPE_RANK[typeName];
            winner = typeName;
        }
    });
    return winner;
}
```

### How It Works Concurrently
```
Timeline:
  Client A (offline): typeVotes.set('number', true)
  Client B (offline): typeVotes.set('string', true)
  
  After Sync:
  typeVotes = { 'number': true, 'string': true }  // Both survive (add-wins!)
  resolveType(typeVotes) → 'string'                // Deterministic: string > number
  
  EVERY client computes the same winner. No coordination needed.
```

### Updated Schema Field Structure
```
fields:
  "age" : Y.Map
    ├── "typeVotes"  : Y.Map       // ← Replaces single 'type' value
    │   └── "number" : true        // Each vote is a key
    ├── "required"   : true
    ├── "default"    : 0
    └── "aliases"    : []
```

### Changing a Type (User Action)
When a user changes `age` from `number` to `string`:
```typescript
function changeFieldType(field: Y.Map, newType: string) {
    const votes = field.get('typeVotes') as Y.Map<boolean>;
    votes.set(newType, true);  // Add vote for new type
    // Don't delete old votes — they're harmless, and the lattice resolves.
}
```
*   **No delete needed.** Old votes stay but are dominated by the wider type.
*   **Concurrent safety:** Both votes survive, lattice resolves deterministically.

### What About Complex Types?
The lattice only works for **primitives** (they have a natural widening order).  
For structural types (YArray, YMap, Counter), there is **no lattice** — they are incomparable:
```
boolean < number < date < string    ← Lattice (ordered)

YArray ≠ YMap ≠ Counter             ← No ordering (incomparable)
```
For structural type changes, **Copy-on-Write remains the only option** (Section 1, Tier 3).

### Lattice Properties (Why This Is Formally Correct)
This forms a **join-semilattice**, which is the mathematical foundation of CRDTs:
*   **Commutative:** `A ∨ B = B ∨ A` (order of votes doesn't matter)
*   **Associative:** `(A ∨ B) ∨ C = A ∨ (B ∨ C)` (grouping doesn't matter)
*   **Idempotent:** `A ∨ A = A` (duplicate votes are harmless)
*   **Monotonic:** Once `string` is voted, it can never be "un-voted" → type never narrows

This means the resolved type **converges** on every client, regardless of message ordering. It is a proper CRDT.

---

## 10. Lens Layer in the Full Architecture

Ref: [Architecture_Decisions.md](file:///c:/Programmieren/MasterThesis/SideDev/Master_Thesis/MasterReactApp_ts/Thoughts/Architecture/Architecture_Decisions.md)

### Where Does the Lens Fit?

The overall system has:
```
  Client UI  →  Y-PGS  →  DB Gateway  →  Graph Database (Neo4j-like)
                  ↕
              P2P / WS Sync
```

The Lens Layer sits **inside** Y-PGS, between the PG-CRDT API and the raw Y.Doc:

```
┌───────────────────────────────────────────────────────────┐
│  Client                                                   │
│                                                           │
│  ┌──────────┐                                             │
│  │   UI     │ "Show Person Alice"                         │
│  └────┬─────┘                                             │
│       │ Read / Write                                      │
│  ┌────▼──────────────────────────┐                        │
│  │  Y-PGS  (PG-CRDT)            │                        │
│  │  ┌──────────────────────────┐ │                        │
│  │  │ PG API (SchemaGraph V3)  │ │  addNode(), getEdges() │
│  │  │ • OR-Set, DualKeyMap     │ │  setProperty()         │
│  │  │ • Topology Index         │ │                        │
│  │  ├──────────────────────────┤ │                        │
│  │  │ ★ LENS LAYER ★          │ │  coerce, alias, lattice│
│  │  ├──────────────────────────┤ │                        │
│  │  │ Raw Y.Doc                │ │  Y.Maps, Y.Arrays      │
│  │  └────────┬─────────────────┘ │                        │
│  └───────────┼───────────────────┘                        │
│              │                                             │
│  ┌───────────▼───────────────────┐                        │
│  │  DB Gateway                   │                        │
│  │  Y.Doc.observe() → translate  │                        │
│  │  to Cypher / DB writes        │                        │
│  └───────────┬───────────────────┘                        │
│              │                                             │
│  ┌───────────▼───────────────────┐                        │
│  │  Local Graph Database         │  Cypher queries         │
│  │  (Neo4j / ArangoDB / ...)     │  ← UI reads from here   │
│  └───────────────────────────────┘                        │
│                                                           │
└───────────────────────────────────────────────────────────┘
         ↕  P2P / WebSocket Sync (raw Y.Doc updates)
┌───────────────────────────────────────────────────────────┐
│  Other Clients (same stack)                               │
└───────────────────────────────────────────────────────────┘
```

### Data Flow (Write Path)
```
1. User sets Person.address = "Berlin"     (UI)
2. PG API calls lens.write(props, 'address', 'Berlin', schema)
3. Lens:
   a. Writes props.set('address', 'Berlin')    → new key
   b. Deletes props.delete('addr')             → GC old alias
   c. Checks typeVotes, coerces if needed
4. Raw Y.Doc now has address='Berlin'          → Y.Map updated
5. Y.Doc sync propagates to other clients      → P2P/WS
6. DB Gateway observes Y.Doc change:
   a. Reads the ALREADY LENSED data (post-migration)
   b. Translates to Cypher: MATCH (p:Person {id:...}) SET p.address = 'Berlin'
   c. Writes to Neo4j
```

### Data Flow (Read Path)
```
Option A: Read from Graph DB (online, fast queries)
  UI → Cypher query → Neo4j → returns 'address'='Berlin'
  (DB already has migrated data because Gateway wrote post-Lens)

Option B: Read from Y.Doc (offline)
  UI → PG API → Lens → Y.Doc
  Lens checks 'address' → found → return 'Berlin'
  (If not found, checks aliases → finds 'addr' → coerces → returns)
```

### Key Insight: DB Gateway Writes Post-Lens Data
The **DB Gateway** observes the Y.Doc AFTER the Lens has migrated it.
This means the Graph Database (Neo4j) **always has clean, current-schema data**:
*   No old keys (`addr`) — the Lens already deleted them.
*   No mixed types — the Lens already coerced them.
*   No aliases — the DB only sees the resolved key name.

The Graph Database is essentially a **materialized view** of the lensed Y.Doc.

### What If the DB Gateway Reads Pre-Lens Data?
If the Gateway reads raw Y.Doc (before Lens):
*   It would see `addr` and `address` mixed across nodes.
*   It would need to run its OWN lens logic → **duplication of concern**.
*   Bad design. The Gateway should observe post-Lens data.

**Two options for the Gateway to see post-Lens data:**
1.  **Gateway uses PG API** (not raw Y.Doc) → reads through the Lens automatically.
2.  **Gateway observes Y.Doc** but runs Lens on each change event → more complex but decoupled.

Option 1 is simpler and recommended.

### Schema Sync to Graph DB
The `__schema__` Y.Map also syncs to all clients.
The DB Gateway can observe schema changes and update the Graph DB's schema constraints:
```typescript
schema.observe(event => {
    // Schema changed → update Neo4j constraints
    // e.g.: CREATE CONSTRAINT FOR (p:Person) REQUIRE p.address IS NOT NULL
});
```
This keeps the Graph DB schema in sync with the collaborative schema.
