# Thesis Research Questions (Suggestions)

## RQ: Enforcing Graph Constraints on CRDTs (Integrity)
**Question:**
> *How can schema constraints be enforced in a Local-First Property Graph without compromising conflict-free convergence?*


---

## RQ: Distributed Schema Evolution
**Question:**
> *What mechanisms allow for evolving a Property Graph Schema (e.g., adding mandatory properties, adding / removing / renaming properties, adding / removing / renaming node / edge labels, adding / removing / renaming connectivities ) in a distributed system without disrupting offline clients?*


---

## RQ: The Limit of Local-First Querying (The "Thick Client" RQ)
**Question:**
> *What is the performance overhead of running a Distributed Graph Database (Option 5.2) on consumer hardware compared to a Centralized Cloud architecture?*

---

## RQ: Referential Integrity Strategies (The "Dangling Edge" Problem)
**Question:**
> *How do different Referential Integrity strategies (Tombstones/Ghost Nodes vs. Cascading Deletes vs. Tolerating Dangling Edges) impact storage overhead and writing performance in a Local-First Graph?*

---

## RQ: Internal Data Structure & Query Performance
**Question:**
> *What is the performance impact of traversing a graph directly on underlying CRDT structures (e.g., Yjs Maps/Arrays) versus traversing the underlying graphdatabase itself?* *Does a dedicated Graph Traversal Layer in the middleware improve performance?*


---

## RQ: Basic CRDT Graph Modeling (Nodes vs. Edges)
**Question:**
> *What is the impact on convergence reliability, storage and time overhead when modeling Edges as independent CRDT entities (e.g., separate Maps) versus embedding them as logical references within Node CRDTs?*

*   **Why:** Addresses core Data Structure design. You use `edgesTargetsMap` (separate).




---

## RQ: The "Merge Trap" in Cardinality Constraints
**Question:**
> *User Experience implications of different automatic repair strategies for "Max N" cardinality violations (e.g., "Deterministic Drop" vs. "Escrow/Reservation").*

*   **Why:**  Concurrent adds can violate `Max 5 edges`.
*   **Scenario:** 5 users each add a friend to a node (limit 5). Total 10 friends.
*   **Study:** Which repair logic feels less "broken" to the end-user? (Randomly deleting 5 friends vs. pausing all adds).



| Constraint           | Category    | Monotonic? | Local Strategy | Merge Strategy  | Repair Strategy   |
| -------------------- | --------    | ---------- | -------------- | --------------- | ---------------  |
| Node / Edge label    | Node / Edge | Yes        | Type-check     |     Union       |     -            |
| Property existence   | Node / Edge | Partial    | Validate       |     -           |     -            |
| Property type        | Node / Edge | Yes        | Type-check     |     -           |     -            |
| Property uniqueness  | Node / Edge | No         | Validate       |     -           |     Repair       |
| allowed Edges        | Edge        | Yes*       | Validate       |     -           |     -            |
| Cardinality lower    | Edge        | No         | Validate       |     -           |Repair (keep some edges)|
| Cardinality equal    | Edge        | Yes        | Validate       |     -           |     -            |
| Cardinality upper    | Edge        | Partial    | Validate       |     -           |     -            |
| Degree Out           | Edge        | Partial    | Validate       |     -           |     -            |
| Degree In            | Edge        | Partial    | Validate       |     -           |     -            |
| Edge uniqueness between nodes      | Edge       | Partial        |       -        |             Tie-break    |     Repair       |
| Acyclicity           | Graph       | No         |      -         |    -           |     Evelyn - US   |
| Path Exsistence      | Graph       | No         |      -         |    -           |     Restructure   |
| Path Non-Existence   | Graph       | No         |      -         |    -           |     Restructure   |
| Connectivity         | Graph       | No         |      -         |    -           |     Restructure   |
| Bidirectional        | Edge        | Yes*       | Auto-Create / Delete |           |     -            |
| Referential Integrity| Node        | Yes*       | None           |                 |     -            |
| Composite uniqueness | Node        | No         | None           |                 |     -            |

*Cascade the problem