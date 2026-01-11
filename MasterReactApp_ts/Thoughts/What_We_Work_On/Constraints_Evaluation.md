# Constraints 
based on 
[PG-Key: Keys for Property Graphs]
[PG-Schema: Schemas for Property Graphs]
[Papoc Paper]

## Constraints & Consistency Models
*Based on **Research Challenge 1**, we apply a "Dynamic Consistency" approach:*
*   **Strategy A (Local):** Uses **TCC (Transactional Causal Consistency)** (High Availability). Suitable for Tier 1.
*   **Strategy B (Server):** Uses **Strict Serializability** (via Gateway). Suitable for Tier 2 (Cardinality).
*   **Strategy C (Prevention):** Uses **Local Invariants** to reduce the need for repair.

## Tier 1 Only Local
Basic Schema (local resolvable)
*   **Node / Edge Label:** Simple check. (R1/2/3)
*   **Property Type:** `typeof value === '...'`.  -> For what properties we are talking about look at PropertyOverview.md (R1/2/3)
*   **Allowed Edges:** Ensuring `(:Person)-[:OWNS]->(:Car)` is valid.

## Tier 2 Conflict (Non-Monotonic)

### Singleton
- at most one key in the key scope

### Exclusive
- Uniqueness (é.g: all emails should be globally unique)

### Mandatory
- at least one key in the key scope

#### Combinations

- Exclusive + Mandatory = every user must have at least one email and no two users can use the same email;
- Exclusive + Singleton = every user may have at most one preferred email for contacting them but again no two users can have the same preferred email;
![alt text](/Thoughts/images/image.png)
- Exclusive + Mandatory = every user has exactly one email

### Identifier
- Singleton + Exclusive + Mandatory uniquely identify an entity.
*   **IDENTIFIER:** (e.g., Papoc Example: "Visit") - I think the usage and deifiniton is wrong in the paper.
    *   *Constraint:* 
    *   *Note on Papoc Example:* R1 shouldn't be able to add a "Visit" if "Endorses" is missing.
    *   *Correction:* With **Strategy C (Local Prevention)**, R1 blocks this write immediately. The paper likely assumes a system where checks are "lazy" or "globally checked after".
    *   *IF NOT BLOCKET IT IS A PATH EXSISTENCE PROBLEM* not a unique identifier problem.

### Cardinality (General Case) 
(e.g., Min 1, Max 1, Min 10).
        *   **Cardinality (Papoc Expa,üöe):** Arbitrary Bounds (Min N / Max N).
            *   *(Reactive Design):* Why is `size` set by humans? Why not calculate it on the fly?
            *   *Strategy D (Avoidance):* Use **Computed Properties**. Don't store `size: large`. Calculate `count(edges)` on the fly. This eliminates the constraint entirely.
    *   *The "Merge Trap":* All of these suffer from the same problem: User A satisfies the rule, User B breaks it (concurrently).
    *   *Repair Strategy (Architectural Trade-off):*
        *   **Hybrid Relay (Opt 5.2):** Server Authority. The Relay sees the conflict and fixes it.
        *   **Pure P2P (Opt 5.1):** Deterministic Consensus. All clients must agree on a "Tie-Breaker" rule (e.g., "Lowest Client ID wins") - Update Storm / Ping Pong CRDT Updates.
        *   **Max N:** 1. Idea: Deterministic Drop (remove excess edges). 2. Idea: RICH-CRDT Escrow - right exchange or compensation.
        *   **Min N:** 1. Idea: Server/Consensus-Assisted (create placeholder edges or revert).

### Degree In / Out  (e.g., "Max 5 in/out edges" - independent of label of edge).
    *   *Problem:* User A adds edge nr. 5. User B adds edge nr. 5. Both valid locally. Merge -> 7 edges.
    *   *Repair:* 1. Idea: Deterministic Drop (remove excess edges). 2. Idea: RICH-CRDT Escrow - right exchange or compensation.
### Referential Integrity
    *   *Problem:* Client A deletes Node. Client B connects to Node. Sync -> Dangling Edge.
    *   *Repair:* "Cascade Delete" or "Resurrect Node" (Ghost Node). (More to be seen in Add-wins vs Remove-observe-wins)

### Bidirectional Edges
    *   *Problem:* `(A)-[:FRIEND]->(B)` implies `(B)-[:FRIEND]->(A)`.
    *   *Repair:* "Cascading Write" (Auto-Create). If I write `A->B`, I also write `B->A`. Same for deletion.

## Tier 3 Global

*   **Schema Evolution:** (R7/8/9/10/11)
    *   *Problem:* Client A is offline on Schema V1 (User has no `age`). Server upgrades to Schema V2 (`age` is MANDATORY). Client A syncs.
    *   *Constraint:* "Data must match the *latest* schema."
*   **Acyclicity:** (No Cycles - EVELYNS WORK)
    *   *Strategy A (Local Prevention):* Check `isCyclic()` before *my own* write.
        *   *Cost:* High CPU (DFS) on the Client.
        *   *Benefit:* Prevents "Self-Inflicted" cycles.
    *   *Strategy B (Centralized Repair):* Server checks *all* writes. Reverts violations.
        *   *Benefit:* Handles "Merge Conflicts" not on the Client (User A + User B create cycle together).
    *   **Strategy C:**
        *   **Local:** Prevent obvious mistakes (Best-effort DFS on known graph).
        *   **Online:** Server / Merge logic handles the Merge Conflicts.
        *   *Result:* Minimizes "Ghost Edits" (only happens on race conditions) while keeping pure local work safe.

    *   **Path Existence / Non-Existence:**
     
        *  
    *   **Path Aggregation**
        *  



---

## Strategy Summary

| Tier | Scope | Constraints | Thesis Verdict |
| :--- | :--- | :--- | :--- |
| **1** | **Local** | Labels, Prop Types, Allowed Edges | **Implement (Baseline)** |
| **2** | **Conflict** | Cardinality, Ref Integrity, Bidirectional, Degree Constraints | **Implement** |
| **3** | **Global** | Acyclicity, Path, Schema Evolution | **--** |
