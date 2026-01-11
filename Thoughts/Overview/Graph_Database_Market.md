# Graph Database Market Overview: Schema vs. Schema-less
## 1. Schema-less (or Schema-Optional)
These databases prioritize **Flexibility**. You can insert any data without defining a structure first.

| Database | Primary Model | Schema Policy | Notes |
| :--- | :--- | :--- | :--- |
| **Neo4j** | Labeled Property Graph | **Optional** | Default is schema-less. You *can* add Constraints (Uniqueness, Type) and Indexes later, but they are not required to start. |
| **ArangoDB** | Multi-Model (Doc + Graph) | **Schema-less** | Uses generic JSON documents. Schema validation is available but opt-in. Very flexible. |
| **Azure Cosmos DB** | Multi-Model (Gremlin) | **Schema-less** | A distributed JSON store at its core. No strict graph schema enforcement. |
| **OrientDB** | Multi-Model | **Hybrid** | Can work in "Schema-less", "Schema-full", or "Schema-hybrid" modes. |
| **Amazon Neptune** | RDF / LPG (Gremlin) | **Schema-less** | Fully managed. No strict schema enforcement for Property Graph data. |
| **Memgraph** | Labeled Property Graph | **Optional** | In-memory, high performance. Similar to Neo4j; allows optional constraints but defaults to open. |

*   **Pros:** Fast development, easy iteration, handles heterogeneous data.
*   **Cons:** Application code must handle data validation; potential for "messy" data.

---

## 2. Schema-Enforced (Strict Typing)
These databases prioritize **Consistency and Structure**. You *must* define types, attributes, and allowed relationships.

| Database | Primary Model | Schema Policy | Notes |
| :--- | :--- | :--- | :--- |
| **TigerGraph** | Native Parallel Property Graph | **Strict** | Requires a predefined GSQL schema (Vertex/Edge Types) before loading data. Strong typing improves performance for massive analytics. |
| **Dgraph** | GraphQL / RDF-like | **Strict** | Requires a GraphQL schema definition. If a predicate isn't in the schema, you (usually) can't write it. |
| **TypeDB (Vaticle)** | Polymorphic Entity-Relation | **Very Strict** | Uses a strong logical type system (TypeQL). Validates logical consistency and rules at write time. |
| **TerminusDB** | Knowledge Graph | **Strict** | Git-like graph DB. Requires a WOQL schema definition ensuring strong structural integrity. |
| **JanusGraph** | Property Graph | **Configurable** | Can be configured to be strict, but often used somewhat flexibly on top of BigTable/Cassandra. |

*   **Pros:** Data guarantees, better optimization for specific queries, self-documenting.
*   **Cons:** Slower prototyping (schema migration needed for every change), rigid.

---
> **Note:** "Schema-less" does not mean "No Structure". It means the structure is **Implicit** (in the data) rather than **Explicit** (in the database engine).
