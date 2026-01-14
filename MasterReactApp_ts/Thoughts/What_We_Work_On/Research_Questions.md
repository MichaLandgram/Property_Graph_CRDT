# Thesis Research Questions (Suggestions)


# Main RQ: 
>How can a property-graph CRDT be designed to preserve key structural and schema constraints (typing, referential integrity, selected cardinality constraints) while retaining coordination-free convergence in a local-first setting?
=> split into subquestions

## RQ: Property Graph Design with CRDTs
**Question:**
> *How can CRDT-based replicated types for property graphs be composed to guarantee convergence while enforcing basic structural and typing constraints (e.g., node/edge labels, property type, referential integrity)?* 

---

## RQ: Distributed Schema Integration
**Question:**
> *How can a property-graph schema (e.g.: PG-Schema-style), including property types and allowed connectivity (including certain neighborhood and exclusive cardinality constraints), be integrated into such CRDTs so that all converged states satisfy the schema?*

---

## RQ: Distributed Cardinality Constraints
**Question:**
> *What are the trade-offs between conflict-free and reservation-based approaches (e.g., escrow, bounded counters) for enforcing edge/property cardinality constraints in a local-first graph database?*

---

## RQ Distributed Path Exsistence Constraints
**Question:**
> *What are the trade-offs of designing a Property Graph with CRDTs to enforce path existence / non-existence Constraints without compromising conflict-free convergence?*

--- 

## RQ: Distributed Schema Evolution
**Question:**
> *How can schema evolution operations be performed without breaking offline clients, while preserving eventual convergence to a schema-valid graph?*

---

## RQ: The Limit of Local-First Querying (The "Thick Client" RQ) # another Idea than "consumer" hardware
**Question:**
> *What are the trade-offs of running a Distributed Graph Database (Option 5.2) on consumer hardware compared to a Centralized Cloud architecture?*

---

## RQ: The "Merge Trap" in Cardinality Constraints [User-Study Idea]
**Question:**
> *What are the User Experience implications of different automatic repair strategies for "Max N" cardinality violations (e.g., "Deterministic Drop" vs. "Escrow/Reservation").*

*   **Why:**  Concurrent adds can violate `Max 5 edges`.
*   **Scenario:** 5 users each add a friend to a node (limit 5). Total 10 friends.
*   **Study:** Which repair logic feels less "broken" to the end-user? (Randomly deleting 5 friends vs. pausing all adds).

---

# Brainstorming Pool (more detailed ideas)


## RQ: Internal Data Structure & Query Performance
**Question:**
> *What is the performance impact of traversing a graph directly on underlying CRDT structures (e.g., Yjs Maps/Arrays) versus traversing the underlying graph database itself?* *Does a dedicated Graph Traversal Layer in the middleware improve performance?*

---

## RQ: Basic CRDT Graph Modeling (Nodes vs. Edges)
**Question:**
> *What is the impact on convergence reliability, storage and time overhead when modeling Edges as independent CRDT entities (e.g., separate Maps) versus embedding them as logical references within Node CRDTs?*

*   **Why:** Addresses core Data Structure design.

---

## RQ: The "Zombie Data" Storage Cost
**Question:**
> *To what extent does the "Tombstone" mechanism of OR-Sets/Yjs impact the long-term storage footprint of a dynamic Property Graph, and can server-side garbage collection mitigate this effectively?*

*   **Context:** Design leaves "Zombie Maps" (`n_ID`) after deletion.

---


