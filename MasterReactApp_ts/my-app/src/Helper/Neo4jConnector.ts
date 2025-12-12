import neo4j from 'neo4j-driver';

// Helper to sanitize properties for Neo4j (remove undefined, complex objects if needed)
const sanitizeProps = (props: any) => {
    const clean: any = {};
    if (!props) return clean;
    
    Object.entries(props).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            // Convert objects/arrays to string if necessary - because Neo4j doesn't support complex objects
            if (typeof value === 'object') {
                clean[key] = JSON.stringify(value);
            } else {
                clean[key] = value;
            }
        }
    });
    return clean;
};

export const dumpGraphToNeo4j = async (nodes: any[], edges: any[]) => {
  const uri = 'bolt://localhost:7687';
  const user = 'neo4j';
  const password = 'password';

  const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
  const session = driver.session();

  try {
    console.log('Connecting to Neo4j...');
    
    console.log('Clearing existing database...');
    await session.run('MATCH (n) DETACH DELETE n');

    console.log(`Creating ${nodes.length} nodes...`);
    for (const node of nodes) {
        const props = sanitizeProps(node.data);
        await session.run(
            `CREATE (n:Node)
             SET n = $props
             SET n.id = $id`,
            { id: node.id, props: props }
        );
    }

    console.log(`Creating ${edges.length} edges...`, edges);
    for (const edge of edges) {
        const props = sanitizeProps(edge.data || edge.label ? { label: edge.label } : {});
        
        // Dynamic relationship type usage if available, else generic 'RELATED'
        const relType = edge.label ? edge.label.replace(/[^a-zA-Z0-9_]/g, '_').toUpperCase() : 'RELATED';

        // Note: Cypher doesn't allow dynamic Relationship Types via parameters easily, 
        //s o we use template literal with sanitization/default - because just dev lol
        
        await session.run(
            `MATCH (a:Node {id: $source}), (b:Node {id: $target})
             CREATE (a)-[r:${relType}]->(b)
             SET r += $props`,
             { source: edge.source, target: edge.target, props: props }
        );
    }
    
    console.log('Dump to Neo4j completed successfully.');
    alert('Dump to Neo4j completed successfully!');
  } catch (error) {
      console.error('Neo4j Dump Error:', error);
      alert('Failed to dump to Neo4j. See console for details.\nEnsure Docker container is running.');
      throw error;
  } finally {
      await session.close();
      await driver.close();
  }
};
