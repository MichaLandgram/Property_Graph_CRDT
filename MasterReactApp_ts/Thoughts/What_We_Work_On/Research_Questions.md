# Thesis Title Ideas:

## Michas Favourits:

**Property Graph CRDT: Enforcing Schema and Structural Constraints on replicated Graph Data** -- Main Focus but allows flexibility for secondary options




# Thesis Research Questions (Suggestions)


# Main RQ: 
>How can a property-graph CRDT be designed to preserve key structural and schema constraints (typing, referential integrity, selected cardinality constraints) while retaining coordination-free convergence in a local-first setting?
> *split into subquestions* (see below)

Choose about 3 - 4 of the following subquestions to work on.
My opion on main focused set on **{RQ1, RQ2, RQ3, RQ4}**
Keep as "if time option" {RQ5, RQ7} ... maybe as a small section to not analize but talk about the different architecture options

## RQ1: Property Graph Design with CRDTs -- I think necessary as an basis
**Question:**
> *How can CRDT-based replicated types for property graphs be composed to guarantee convergence while enforcing basic structural and typing constraints (e.g., node/edge labels, property type, referential integrity)?* 
*   **Evaluation:** 
---

## RQ2: Distributed Schema Integration -- Also necessary for arguing about exactly and easy integration of an Schema to enhance simple Property Graph to an Property Graph with CRDTs (could be integrated into RQ1)
**Question:**
> *How can a property-graph schema (e.g.: PG-Schema-style), including property types and allowed connectivity (including certain neighborhood and exclusive cardinality constraints), be integrated into such CRDTs so that all converged states satisfy the schema?*

---

## RQ3: Distributed Schema Evolution / Living Schema -- good for arguing about the usability of the system
**Question:**
> *How can schema evolution operations be performed without breaking offline clients, while preserving eventual convergence to a schema-valid graph?*

## RQ4: Distributed Cardinality Constraints -- enhances the research to a more complex Property Graph with CRDTs
**Question:**
> *What are the trade-offs between conflict-free and reservation-based approaches (e.g., escrow, bounded counters) for enforcing edge/property cardinality constraints in a local-first graph database?*

---


## Evaluation Plan

### RQ1 





| RQ | Evaluation Method | Key Metric |
|----|----|----|
| RQ1 | Property-Based Testing | 100% State(A) == State(B) across random scenarios | 
| RQ1 | Commutativity Verification | All operation pairs commute: op1;op2 ≡ op2;op1 |
| RQ1 | Benchmarks | Ops/sec, Storage bytes (I think storage can be ignored) |
| ---- | ---- | ---- |
| RQ2 | Unit Tests | Invalid ops are rejected |
| RQ2 | Validation | isSchemaCorrect(graph) returns true after sync |
| RQ2 | Feature Matrix | Document what constraints are supported |
| RQ2 | Integration Overhead | Validation time added to operations |
| ---- | ---- | ---- |
| RQ3 | Comparative Analysis | Conflict-free vs. reservation-based: latency, coordination overhead |
| RQ3 | Constraint Violation Test | Pass/Fail + how many violations occur |
| RQ3 | Availability Test | Operations succeeded during partition (conflict-free) vs. blocked (reservation) |
| RQ3 | Benchmarks | Ops/sec, Storage bytes (I think storage can be ignored) |
| ---- | ---- | ---- |
| RQ4 | Offline Client Test | Client offline during evolution: violations after sync? |
| RQ4 | Benchmarks | Ops/sec, Storage bytes (I think storage can be ignored) |


# Alternative Thesis Titles

**A Middleware Architecture for Replicated Property Graphs with Schema Guarantees** -- Includes directly the middleware Architecture Idea

**Enforcing Structural and Semantic Constraints in Local-First Property Graphs** -- Ok 

**Enforcing Graph Constraints in Local-First Property Graphs using CRDTs** -- ok

## Secondary Options:

**The Merge Trap: Managing Schema Evolution and Constraints in Offline-First Graph Systems**

**Schema-Aware CRDTs for Property Graphs: From Structural Invariants to Schema Evolution**

**Beyond Eventually Consistent: Enforcing Strict Graph Semantics on Relaxed CRDT Structures**

# Different RQ Ideas currently not planned to be included

---

## RQ5: Distributed Path Exsistence Constraints -- Most complex constrain when not solved via simple dropping. Interesting if time to be included. 
**Question:**
> *How to design a Property Graph with CRDTs to enforce path existence / non-existence Constraints without compromising conflict-free convergence?*

--- 


## RQ6: The Limit of Local-First Querying (The "Thick Client" RQ) # another Idea than "consumer" hardware -- interesting but too off of the main focus
**Question:**
> *What are the trade-offs of running a Distributed Graph Database (Option 5.2) on consumer hardware compared to a Centralized Cloud architecture?*

---

## RQ7: The "Merge Trap" in Cardinality Constraints [User-Study Idea] -- I would find that very nice to include but should keep it as an optional topic
**Question:**
> *What are the User Experience implications of different automatic repair strategies for "Max N" cardinality violations or Path (e.g., "Deterministic Drop" vs. "Escrow/Reservation").*

*   **Why:**  Concurrent adds can violate `Max 5 edges`.
*   **Scenario:** 5 users each add a friend to a node (limit 5). Total 10 friends.
*   **Study:** Which repair logic feels less "broken" to the end-user? (Randomly deleting 5 friends vs. pausing all adds).

---

# Brainstorming Pool (more detailed ideas)

## RQ: The "Middleware" Architecture Integration
**Option A (Design Focus):** -- current favourite
> *How can an abstraction layer based on Property Graph CRDTs be effectively integrated into a distributed architecture to mediate between local-first application logic and persistent graph storage?*

**Option B (Decoupling Focus):**
> *To what extent can a "Property Graph CRDT Middleware" decouple client-side graph operations from network synchronization constraints, and what are the resulting architectural trade-offs?*

**Option C (The "Thick Client" bridge):**
> *How can a CRDT-based "Data Layer" be architected to enable fully offline-capable graph modifications while ensuring eventual consistency with a centralized Graph Database?*

---

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

