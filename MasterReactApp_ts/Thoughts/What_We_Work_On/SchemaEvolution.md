<!-- # Schema Evolution Ideas

Mainly based on [Lens Mechanisms for Schema Evolution](https://dspace.mit.edu/bitstream/handle/1721.1/145983/3447865.3457963.pdf?sequence=1&isAllowed=y)

## What should be evovlable? - open to discussion.
* 1. Add, Remove, Rename Properties
* 2. Change [Optional] to [Required]
* 3. Change Type of Property
* 4. Change Default Value of Property
* 5. Change allowed Labels (Nodes/Edges)
* 6. Change allowed connections
* 7. Change Cardinality

How should evolable be defined? Restart the property? Base on the old property?

The two Options I think about: 
# 1. Versioning (Idea based on RxDB)
### RxDB (Document-Based)
*   **Model:** Data is a JSON Document.
*   **Migration:** `v1 -> v2`. A function `migrate(doc)` **rewrites** the document.
*    They prioritize **Query Performance**. Indexes require the data on disk to match the schema exactly.
*   **Tradeoff:** Migration often requires re-writing the database. In a P2P system, if I rewrite my DB to V2, I can no longer easily sync with your V1 DB without complex conflict logic.

# 2. The "No-Version" Concept (Continuous Evolution)
"v1 -> v2" is not a discrete step. It is a continuous stream of updates.
*   **Concurrent Schema Edits:** Schema as a YMap
    *   User A adds `age` (Number).
    *   User B adds `email` (String).
    *   **Result:** The Schema contains *both*. No conflict logic needed (unless they redefine the *same* property name with different types).

 ### Mixed-Version Clients (The "Forward Compatibility" Rule)
What happens if Client V1 (Old Code) and Client V2 (New Code) collaborate?
1.  **V2 writes `email`:** The Node CRDT now has an `email` field.
2.  **V1 reads the Node:**
    *   V1's code doesn't know about `email`.
    *   **CRITICAL:** V1 must **ignore** unknown properties but **preserve** them when saving.
    *   *Yjs Default:* Yjs Maps preserve unknown keys automatically. If V1 modifies `name`, `email` stays in the map untouched.
3.  V1 clients can safely participate in V2 graphs without corruption, provided they don't *delete* unknown keys.

### Backward Compatibility (V2 reads V1 Data)
This is the **Main Purpose of the Lens**.

## 1. Lens Schema Evolution (The "Lazy" Approach)
Instead of rewriting data , using **Lenses** to transform data *on read* and *on write*.

### A. The Coercion Matrix (Lens Definition - Read)
The Schema defines allowed "Safe" transformations. The **Read Layer** applies `coerceValue(storedVal, validSchemaType)` on the fly.

| From (Storage) | To (Schema) | Lens Logic (On-Read) | Safety |
| :--- | :--- | :--- | :--- |
| `Number` | `String` | `val.toString()` | ✅ Safe |
| `Boolean` | `Number` | `val ? 1 : 0` | ✅ Safe |
| `String` | `Number` | `props.get('val') ?? default` (if NaN) | ⚠️ Unsafe (Data Hiding) |
| `YArray` | `YMap` | **Unsupported in Lens** (Too complex to map indices to keys deterministically) | ❌ Forbidden |

### B. Handling "Add Property" (The Default Value Problem)
*   **Lens:**
    ```typescript
    // Read-Time Logic
    function getProperty(node: YMap, key: string) {
       const schema = getSchema(node.get('label'));
       if (!node.has(key)) {
           return schema.fields[key].default; // Virtual Return
       }
       return node.get(key);
    }
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

### The Problem with Eager Rename
If Client A does `delete('addr'); set('address', val)`, and Client B concurrently does `set('addr', newVal)`:
*   Client B's edit might be lost (if delete wins).
*   Or we end up with both `addr` and `address` (Ghost Data).

### The Solution: Schema Aliasing (Forever Backward Compatibility)
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

## 6. Comparison: Why RxDB/CouchDB use "Versions" vs CRDTs

 -->
