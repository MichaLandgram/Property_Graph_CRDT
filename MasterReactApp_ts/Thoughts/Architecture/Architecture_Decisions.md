# Architecture Comparison & Decision Matrix

This document summarizes the architectural options explored for integrating **Yjs (Real-time Collaboration)** with **Graph Databases (Neo4j, ArangoDB, ...)**.

## 0. Abstraction
- Small sketch that scheme is indipendent of the basic Y-PG implementation.
```mermaid
graph TD

    Y-PG[YJS Property Graph CRDTs]
    Schema[Schema Validation] <-->|Validate| Y-PG
```
## 1. Client-Side Direct Write 
**Concept:** Every Client connects directly to a Graph Database. Clients write updates to the Graph Database individually.

```mermaid
graph LR
    C1 -->|Writes| DB[(Graph Database)]
    C2 -->|Writes| DB
    C1 <-->|Syncs| C2
```

*   **Pros:**
    *   **Easy**
*   **Cons:**
    *   **Race Conditions** 
    *   **Dualism:** Data exists in `y-indexeddb` (Client Cache) and Graph Database independently. They drift apart easily.
*   **Opinion:** **No**.

---

## 2. Native CRDT Support (Neo4j Plugin IDEA NEO4J ONLY)
**Concept:** A custom Neo4j Plugin (in Java) that handels CRDT merging logic internally.

```mermaid
graph LR
    C1[Client] -->|1. Update| P[Java Plugin]
    subgraph Neo4j Kernel
        P -->|2. CRDT Merge| S{State}
        P -->|3. Project| G[Graph Props]
    end
```


*   **Pros:**
    *   **Perfect Integration:** Seamlessly handles conflict resolution within the database engine.
    *   **Consistency:** No risk of race conditions.
*   **Cons:**
    *   **Complexity:** Complex to implement - not necessary to argue about schema consistency, path consistency, etc. - not 100% sure if it is completly possible
    *   **Maintenance:** Requires maintaining custom Java code that deeply hooks into Neo4j internals. - could break after an update.
*   **Opinion:** **Not Recommended**. High effort and risk for a thesis project.

---


## 3. Gateway Architecture
**Concept:** A centralized **Node.js Sync Server** acts as the *Single Source of Truth*. It holds the Yjs document in RAM and acts as the **Sole Writer** to the Graph Database.

```mermaid
graph LR
    subgraph C1
        UI1[UI] -->|Read/Write| YJS1[Y-PGS]
    end
    YJS1 <-->|WS| YJS3[Server-Y-PGS]
    subgraph C2
        UI2[UI] -->|Read/Write| YJS2[Y-PGS]
    end
    YJS2 <-->|WS| YJS3
    subgraph Sync Server
        GB[DB Gateway]
        YJS3 <-->|triggers| GB
    end
    GB -->|Read/Write| DB[(Graph Database)]
```

*   **Pros:**
    *   **Focused:** Only the Sync Server writes to the Graph Database. No risk of race conditions.
    *   **Goal:** Easy to argue about the wanted constraints. (Schema, Schema Evolution, Path Consistency, ...)
    *   **Compatible:** Compatible with different Graph Databases. Just change the write / load functions.
    *   **Concurrency:** Handeled by our implementation of YJS Property Graph CRDTs.
    *   **Consistency:** The Graph Database always reflects the converged state. No "overwrite" bugs.
*   **Cons:**
    *   **Redundancy:** Data exists in Server YJS Document + Graph Database.
    *   **No Offline Querying:** You can't run full Cypher queries (`MATCH ...`) locally, offline.
    *   **
*   **Opinion:** **Recommended**. Easy way of arguing about the wanted constraints.

---

### 3.1 Gateway Architecture with optimized Read

```mermaid
graph LR
    subgraph C1
        UI1[UI] -->|Write| YJS1[Y-PGS]
        UI1 -->|Read| RL1[Read Layer]
    end

    subgraph C*
        OC[Other Clients]
    end
    subgraph Interaction Layer
        GB[DB Gateway]
        YJS3[Server-Y-PGS] <-->|triggers| GB
    end
    OC[Other Clients] <-->|WS| YJS3
    YJS1 <-->|WS| YJS3
    RL1 -->|if online: Read| DB[(Graph Database)]
    RL1 -->|if offline: Read| YJS1
    GB -->|Write| DB[(Graph Database)]
```

*   **Optimizes:**
    *   **Offline Querying:** Implement a YJS Graph Traversal Layer that can run locally. -> **CON** Not really efficient and limited.

## 5. Distributed / Local-First (Thick Gateway)
**Concept:** Each client runs a **Local Graph Database** instance + a **Local Sync Server**.

```mermaid
graph TD
    subgraph C1
        UI1[UI] -->|Write/Read| YA[Y-PGS] 
        subgraph Interaction Layer1[Interaction Layer]
            YA[Y-PGS] --> GA[DB Gateway]
        end
        GA --> DBA[(Graph Database)]
    end
    subgraph C*
        UI2[UI] -->|Write/Read| YB[Y-PGS]
        subgraph Interaction Layer2[Interaction Layer]
            YB[Y-PGS] --> GB[DB Gateway]
        end
        GB --> DBB[(Graph Database)]
    end
    YA <-->|P2P Sync| YB
```

*   **Pros:**
    *   **Resilience:** No central point of failure.
*   **Cons:**
    *   **Resources:** Running Graph Database (JVM) on every client is very heavy.
    *   **Sync Complexity:** You essentially run the "Gateway Architecture" on every device.
    *   **Offline Querying:** You can't run full Cypher queries (`MATCH ...`) locally, offline.
    *   **Data Duplication:** Data exists in Server YJS Document + Graph Database.
*   **Opinion:** **I like it**. 

### 5.1. Decoupled Read / Write

Read from the Graph Database directly. Write via the Sync Server.

```mermaid
graph TD
    subgraph C1
        UI1[UI] -->|Write| YA[Y-PGS] 
        subgraph Interaction Layer1[Interaction Layer]
            YA[Y-PGS] --> GA[DB Gateway]
        end
        GA --> DBA[(Graph Database)]
    end
    subgraph C*
        UI2[UI] -->|Write| YB[Y-PGS]
        subgraph Interaction Layer2[Interaction Layer]
            YB[Y-PGS] --> GB[DB Gateway]
        end
        GB --> DBB[(Graph Database)]
    end
        UI1 -->|Read| DBA
        UI2 -->|Read| DBB 
    YA <-->|P2P Sync| YB
```


*   **Optimizes:**
    *   **Offline Querying:** You can run full Cypher queries (`MATCH ...`) locally, even offline.
    *   **Data Duplication:** Data exists in Server YJS Document + Graph Database.

### 5.2 Hybrid / Relay (WebSocket)
**Concept:** Clients run **Local Graph Database** but sync via a central **WebSocket Relay Server**.
> The WS server could be used as a global constraint solver. [Cyclicity, Path Existence, ...] - single source of truth
But single point of failure! Still local work could be done.



```mermaid
graph TD
    subgraph C1
        UI1[UI] -->|Write/Read| YA[Y-PGS] 
        subgraph Interaction Layer1[Interaction Layer]
            YA[Y-PGS] --> GA[DB Gateway]
        end
        GA --> DBA[(Graph Database)]
    end
    subgraph WS
        Relay[("WebSocket Relay (No Storage)")]
    end
    subgraph C*
        UI2[UI] -->|Write/Read| YB[Y-PGS]
        subgraph Interaction Layer2[Interaction Layer]
            YB[Y-PGS] --> GB[DB Gateway]
        end
        GB --> DBB[(Graph Database)]
    end
    YA <-->|WS Messages| Relay
    YB <-->|WS Messages| Relay
```

-> WS instead of P2P Sync

## Summary

| Feature | Client-Side Write | Gateway Architecture | Native Plugin | Distributed (Local DB) |
| :--- | :--- | :--- | :--- | :--- |
| **Conflict Resolution** | Poor (Last Write Wins) | Reliable (CRDTs) | Reliable (CRDTs) | **Reliable (Local Gateway)** |
| **Data Querying** | **Good** | **Good** (Remote)  | **Perfect** | **Perfect (Local)** |
| **Complexity** | Low | **Medium** | **High** | **Medium** |


