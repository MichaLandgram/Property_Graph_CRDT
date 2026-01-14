# Architecture Comparison & Decision Matrix

This document summarizes the architectural options explored for integrating **Yjs (Real-time Collaboration)** with **Graph Databases (Neo4j, ArangoDB, ...)**.

## 0. Abstraction
- Small sketch that scheme is indipendent of the basic Y-PG implementation.
```mermaid
graph TD

    Y-PG[YJS Property Graph CRDTs]
    Schema[Schema Validation] <-->|Validate| Y-PG
```



### 3 Gateway Architecture with optimized Read
**Concept:** A centralized **Node.js Sync Server** acts as the *Single Source of Truth*. It holds the Yjs document in RAM and acts as the **Sole Writer** to the Graph Database.

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
