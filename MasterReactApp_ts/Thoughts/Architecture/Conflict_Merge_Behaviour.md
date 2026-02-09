# Introduction
-- as a basis see: https://arxiv.org/pdf/1806.10254 | https://arxiv.org/abs/1210.3368

We define as basis of our Graph an CRDT Map that supports: 

* **Create** - Adds a new entry to the map
* **Update** - Updates an existing entry in the map.
* **Remove** - Removes an entry from the map.

This gives us the Question: How does it behave in different merging scenarios?


![alt text](/MasterReactApp_ts/Thoughts/images/NodeConcurrencyMatrix.png)

The two I want to focus on are:

## Add/Update Win Semantic 
> Never Remove Property Data on a remove to ensure that the property data is always available if a node will be updated or readded again.

### Scenarios:

#### Scenario 1: Update Wins / Add Wins (The "Resurrection")
Context: concurrent `upd(N1)` vs `rmv(N1)`.

```mermaid
graph LR
    Start("{ (N1: {x:1}) }")
    subgraph Replica A
        direction LR
        A0("{ N1: {x:1} }") -- "upd(N1.x, 2)" --> A1("{ N1: {x:2} }")
    end

    subgraph Replica B
        direction LR
        B0("{ N1: {x:1} }") -- "upd(N1.y, 4)" --> B1("{ N1: {y:4} }") -- "rmv(N1)" --> B2("{ }")
    end

    %% Initial Sync
    Start -. "sync" .-> A0
    Start -. "sync" .-> B0

    %% Divergence happens above

    %% Sync / Merge
    A1 -. "sync" .-> Merge
    B2 -. "sync" .-> Merge

    Merge("Result: { N1: {x:2, y:4} }"):::merge

    %% Explanation
    class A0,A1,B0,B1,B2 state;
```
> **Logic:** The update `x=2` implies the existence of `N1`. The "Removed" flag from B is overwritten or ignored because the update timestamp acts as a "Latest Write" that validates the node's existence.

#### Scenario 2: Add Wins / Remove Wins (The "Resurrection")
Context concurrent `add(N1)` vs `rmv(N1)`.

```mermaid
graph LR
    Start("{ }")
    subgraph Replica A
        direction LR
        A0("{ }") -- "add(N1)" --> A1("{ N1 }")
    end

    subgraph Replica B
        direction LR
        B0("{ }") -- "add(N1)" --> B1("{ N1 }") -- "rmv(N1)" --> B2("{ }")
    end

    %% Initial Sync
    Start -. "sync" .-> A0
    Start -. "sync" .-> B0

    %% Divergence happens above

    %% Sync / Merge
    A1 -. "sync" .-> Merge
    B2 -. "sync" .-> Merge

    Merge("Result: { N1 }"):::merge

    %% Explanation
    class A0,A1,B0,B1,B2 state;
```
> **Logic:** The adding concurrent to an remove implies the existence of `N1`. The "Removed" flag from B is overwritten or ignored because the adding timestamp acts as a "Latest Write" that validates the node's existence.

## Observed Remove Win Semantic (Explicit Tag + Tombstone)

### Mechanism
*   **Add/Ref**: `Key -> { Value: v, Tag: t1 }`
*   **Remove**: `Tombstones.add(t1)`
*   **Visibility**: Visible if `entry.Tag` is NOT in `Tombstones`.

### Update to Dead Version vs Re-Add (Resurrection)
Context: 
1. **Replica B** removes `N1` (adding tag `t1` to Tombstones). 
2. **Replica A** concurrent update acts on *dead* tag `t1`.
3. **Replica C** concurrent Re-Add creates *new* tag `t2`.

```mermaid
graph LR

    Start("{ Key: N1, Tag: t1 }")

    subgraph Replica A
        direction LR
        A0(State: Has t1) -- "update(N1, val=2) -> Keeps t1" --> A1("{ Key: N1, Val: 2, Tag: t1 }")
    end

    subgraph Replica B
        direction LR
        B0(State: Has t1) -- "remove(N1) -> Tombstone(t1)" --> B1("Tombstones: {t1}"):::tomb
    end

    subgraph Replica C
        direction LR
        C0(State: Has t1) -- "re-add(N1) -> New Tag t2" --> C1("{ Key: N1, Val: 3, Tag: t2 }")
    end

    Start -. "sync" .-> A0
    Start -. "sync" .-> B0
    Start -. "sync" .-> C0
    %% Merge Logic
    A1 -. "sync" .-> Merge
    B1 -. "sync" .-> Merge
    C1 -. "sync" .-> Merge

    Merge("Result: { Key: N1, Val: 3, Tag: t2 } (t1 is dead, t2 wins)"):::merge

    %% Explanation
    class A0,A1,B0,C0,C1 state;
```
> **Logic:** 
> *   Update from **A** refers to `t1`. Since `t1` is in `Tombstones` (from **B**), this entry is **Hidden/Ignored**.
> *   Re-Add from **C** generated `t2`. `t2` is NOT in Tombstones. **N1 is visible (Resurrected) with value 3.**

## Concurrent Adds (Convergent Merge)
Context: Both clients add the same Node/Edge with **Deterministic ID**, generating the *same* Tag (or just sharing the Key and merging properties).

```mermaid
graph LR
    subgraph Replica A
        direction LR
        A0("{ }") -- "add(N1, color:red)" --> A1("{ N1: {color:red} }")
    end

    subgraph Replica B
        direction LR
        B0("{ }") -- "add(N1, size:big)" --> B1("{ N1: {size:big} }")
    end

    %% Sync / Merge
    A1 -. "sync" .-> Merge
    B1 -. "sync" .-> Merge

    Merge("Result: { N1: {color:red, size:big} }"):::merge

    %% Explanation
    class A0,A1,B0,B1 state;
```
> **Logic:** If IDs are deterministic, Yjs treats them as the same Map. Concurrent operations simply merge properties. No "Duplicates".
