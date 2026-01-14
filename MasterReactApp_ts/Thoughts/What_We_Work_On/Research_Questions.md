# Thesis Research Questions (Suggestions)

## RQ: Property Graph Design with CRDTs
**Question:**
> *Can a simple Property Graph be designed with CRDTs to enforce basic graph constraints (e.g., node/edge labels, property existence, property type, allowed edges, no dangling edges) without compromising conflict-free convergence?* 

---

## RQ: Distributed Schema Integration
**Question:**
> *Can a Schema be integrated into a distributed Property Graph without compromising conflict-free convergence?* 

---
## RQ: Distributed Schema Evolution
**Question:**
> *What mechanisms allow for evolving a Property Graph Schema (e.g., adding mandatory properties, adding / removing / renaming properties, adding / removing / renaming node / edge labels, adding / removing / renaming connectivities ) in a distributed system without disrupting offline clients?*

---

## RQ: Distributed Cardinality Constraints
**Question:**
> *Can a Property Graph be designed with CRDTs to enforce cardinality constraints (e.g., max 5 edges, min 1 edge, exact 5 edges) without compromising conflict-free convergence?*

---

## RQ: Distributed Neighborhood Constraints
**Question:**
> *Can simple neighborhood Constraints be enforced in a distributed Property Graph?*
---

## RQ Distributed Path Exsistence Constraints
**Question:**
> *Can simple path existence / non-existence Constraints be enforced in a distributed Property Graph?*

--- 

## RQ: The Limit of Local-First Querying (The "Thick Client" RQ) # another Idea than "consumer" hardware
**Question:**
> *What is the performance overhead of running a Distributed Graph Database (Option 5.2) on consumer hardware compared to a Centralized Cloud architecture?*

---

## RQ: The "Merge Trap" in Cardinality Constraints [User-Study Idea]
**Question:**
> *User Experience implications of different automatic repair strategies for "Max N" cardinality violations (e.g., "Deterministic Drop" vs. "Escrow/Reservation").*

*   **Why:**  Concurrent adds can violate `Max 5 edges`.
*   **Scenario:** 5 users each add a friend to a node (limit 5). Total 10 friends.
*   **Study:** Which repair logic feels less "broken" to the end-user? (Randomly deleting 5 friends vs. pausing all adds).

---


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