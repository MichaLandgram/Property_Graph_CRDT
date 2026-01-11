# Thesis Research Questions (Suggestions)

---

## RQ: The Architectural Trade-off (Availability vs. Consistency)
**Question:**
> *To what extent can our architecture improve data consistency compared to client-side direct writes in a distributed graph application, and what is the latency cost?*

*   **Why:** Addresses the core decision ofLocal-First.

---

## RQ: Enforcing Graph Constraints on CRDTs (Integrity)
**Question:**
> *How can schema constraints be enforced in a Local-First Property Graph without compromising conflict-free convergence?*

*   **Why:** Addresses your specific concern about "Path / Cardinality". CRDTs naturally allow *anything*. You are adding rules.
*   **How to Evaluate:**
    *   **Setup:** Define a rule: *"A Project Node MUST have exactly 1 Owner."*
    *   **Attack:** Have Client A delete the Owner while Client B edits the Owner's name (concurrently).
    *   **Measure:** Does the system end up with 0 Owners (Constraint Violation) or does it converge to a safe state?
    *   **Deliverable:** A proposed algorithm or "Repair Strategy" in your Gateway.

---

## RQ: Distributed Schema Evolution
**Question:**
> *What mechanisms allow for evolving a Property Graph Schema (e.g., adding mandatory properties, adding / removing / renaming properties, adding / removing / renaming node / edge labels, adding / removing / renaming connectivities ) in a distributed system without disrupting offline clients?*

*   **Why:** Addresses "Schema Evolution".
*   **How to Evaluate:**
    *   **Scenario:**
        1.  Client A goes Offline with Schema V1.
        2.  Server upgrades to Schema V2 (e.g., "User" node now requires "Age").
        3.  Client A creates a "User" (without Age) and reconnects.
    *   **Measure:** Does the system crash? Does it reject the data? Or does it apply a "Migration Strategy"?
    *   **Comparison:** Compare "Strict Rejection" (TypeDB style) vs. "Adaptive Migration" (Your solution).

---

## RQ: The Limit of Local-First Querying (The "Thick Client" RQ)
**Question:**
> *What is the performance overhead of running a Distributed Graph Database (Option 5.2) on consumer hardware compared to a Centralized Cloud architecture?*

*   **Why:** Validates the "Option 5" vs "Option 2" trade-off.
*   **How to Evaluate:**
    *   **Benchmark:** Execute 1,000 read queries (e.g., 3-hop traversal).
    *   **Compare:** Local Neo4j (0ms network, high CPU) vs. Cloud Neo4j (50ms network, low CPU).
    *   **Result:** A chart showing the break-even point where Local becomes faster.


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