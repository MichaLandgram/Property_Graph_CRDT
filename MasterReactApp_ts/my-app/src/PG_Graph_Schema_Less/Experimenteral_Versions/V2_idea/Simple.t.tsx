// import { addNode, deleteNode, getVisibleNodes, updateNode, getNodeProps } from './SimpleGraph';
// import { syncDocs } from '../../Helper/sync';
// import { getDoc } from '../../Helper/creator';

// describe('Hybrid Policy Test for Conflict Resolution (REMOVE_WINS vs. ADD_WINS) NO CONCURRENCY', () => {
//     let graph;
//     const rwId = 'rw-config-1';
//     const awId = 'aw-user-2';

//     // Graph V1 init
//     beforeEach(() => {
//         graph = getDoc();
//         graph.getMap('nodes');
//         graph.getMap('properties');
//         graph.getMap('removedNodes');
//         graph.getMap('edges');
//         // add Node with remove wins policy
//         addNode({ 
//             id: rwId, 
//             initialProps: { policy: 'REMOVE_WINS', name: 'Konfiguration' }, 
//             graph 
//         });

//         // add Node with add wins policy
//         addNode({ 
//             id: awId, 
//             initialProps: { policy: 'ADD_WINS', name: 'Aktiver User' }, 
//             graph 
//         });
//     });

//     test('Sollte zwei Knoten initial sichtbar haben', () => {
//         const initialNodes = getVisibleNodes({ graph });
        
//         expect(graph.getMap('nodes').has(rwId)).toBe(true);
//         expect(graph.getMap('nodes').has(awId)).toBe(true);
//         console.log('Initial Nodes:', initialNodes);
//         expect(initialNodes).toHaveLength(2);

//         expect(initialNodes.map(n => n.id)).toEqual(expect.arrayContaining([rwId, awId]));
//     });

//     test('RW-Knoten (REMOVE_WINS) sollte nach Löschung unsichtbar bleiben, auch wenn ein gleichzeitiger Update versucht wird', () => {
//         // Lösche den Knoten
//         deleteNode({ id: rwId, graph });

//         const removedNodesMap = graph.getMap('removedNodes');
//         expect(removedNodesMap.has(rwId)).toBe(true);
        
//         const nodesMap = graph.getMap('nodes');
//         const rwNodeMap = nodesMap.get(rwId);
//         // Simuliere ein Update auf den gelöschten Knoten
//         updateNode({ id: rwId, props: { name: 'Konfiguration (UPDATE)' }, graph });

//         const afterRwDelete = getVisibleNodes({ graph });
//         expect(afterRwDelete).toHaveLength(1);
//         expect(afterRwDelete[0].id).toBe(awId);
//         expect(afterRwDelete.map(n => n.id)).not.toContain(rwId);
//     });

//     test('AW-Knoten (ADD_WINS) sollte nach Löschung strukturell entfernt werden und unsichtbar sein', () => {
//         deleteNode({ id: awId, graph });
//         const nodesMap = graph.getMap('nodes');
//         expect(nodesMap.has(awId)).toBe(false); 
//         const removedNodesMap = graph.getMap('removedNodes');
//         expect(removedNodesMap.has(awId)).toBe(false);
//         const afterAwDelete = getVisibleNodes({ graph });
//         expect(afterAwDelete).toHaveLength(1);
//         deleteNode({ id: rwId, graph });
//         const finalNodes = getVisibleNodes({ graph });
//         expect(finalNodes).toHaveLength(0);
//     });
// });

// describe('Hybrid Policy Sync Tests (Concurreny and Revival)', () => {
//     let docA;
//     let docB;
//     const rwId = 'rw-config-1'; // REMOVE_WINS
//     const awId = 'aw-user-2';  // ADD_WINS

//     beforeEach(() => {

//         docA = getDoc();
//         docB = getDoc();
//         ['nodes', 'removedNodes', 'edges'].forEach(mapName => {
//             docA.getMap(mapName);
//             docB.getMap(mapName);
//         });

//         addNode({ id: rwId, initialProps: { policy: 'REMOVE_WINS', name: 'RW Original' }, graph: docA });
//         addNode({ id: awId, initialProps: { policy: 'ADD_WINS', name: 'AW Original' }, graph: docA });

//         syncDocs(docA, docB);
//         expect(getVisibleNodes({ graph: docB })).toHaveLength(2);
//     });

//     test('RW in case of concurrent update on the same node', () => {
//         deleteNode({ id: rwId, graph: docA }); 
        
//         const rwNodeB = docB.getMap('nodes').get(rwId);
//         updateNode({ id: rwId, props: { name: 'RW Konkurrenz-Update' }, graph: docB });

//         syncDocs(docA, docB);
//         syncDocs(docB, docA);

//         expect(docA.getMap('removedNodes').has(rwId)).toBe(true);
//         expect(docB.getMap('removedNodes').has(rwId)).toBe(true);
        
//         expect(getVisibleNodes({ graph: docA })).toHaveLength(1);
//         expect(getVisibleNodes({ graph: docB })).toHaveLength(1);
        
//         expect(docA.getMap('properties').get(rwId) === undefined).toBe(true);
//     });
    
//     test('AW-Knoten muss nach Delete vs. Update wiederbelebt werden (Revival)', () => {
//         deleteNode({ id: awId, graph: docA }); 
        
//         // const awNodeB = docB.getMap('nodes').get(awId);
//         // awNodeB.set('data', 'AW Revival-Update');
//         // "touch Operation" to ensure AW node exists in docB
//         updateNode({ id: awId, props: { data: 'AW Revival-Update', policy: 'ADD_WINS' }, graph: docB });
        
//         expect(docA.getMap('nodes').has(awId)).toBe(false);

//         syncDocs(docA, docB);
//         syncDocs(docB, docA);

//         expect(docA.getMap('nodes').has(awId)).toBe(true);
//         expect(docB.getMap('nodes').has(awId)).toBe(true);

//         // expect(docA.getMap('nodes').get(awId).get('data')).toBe('AW Revival-Update');

//         expect(getVisibleNodes({ graph: docA })).toHaveLength(2);
        
//         console.log(`\n✅ AW Revival Test "`);
//     });
    
//     test('RW-Knoten muss nach konkurrierenden Deletes nur einen Grabstein haben', () => {
        
//         deleteNode({ id: rwId, graph: docA }); 
//         deleteNode({ id: rwId, graph: docB }); 
        
//         syncDocs(docA, docB); 
//         syncDocs(docB, docA); 
        
//         expect(docA.getMap('removedNodes').has(rwId)).toBe(true);
//         expect(docB.getMap('removedNodes').has(rwId)).toBe(true);
        
        
//         expect(getVisibleNodes({ graph: docA })).toHaveLength(1);
        
//         console.log(`\n✅ Blacklist Merge Test erfolgreich: Zwei konkurrierende Löschungen mergen zu einem einzelnen Grabstein.`);
//     });

//     test('AW-Knoten soll beide Update Informationen nach konkurrierenden Updates behalten', () => {

//         updateNode({ id: awId, props: { data: 'AW Update', policy: 'ADD_WINS', data2: 'AW Update 1' }, graph: docA });
//         updateNode({ id: awId, props: { data: 'AW Update', policy: 'ADD_WINS', data3: 'AW Update 2' }, graph: docB });
//         console.log(getNodeProps(docA, awId));
//         console.log(getNodeProps(docB, awId));

//         expect(getNodeProps(docA, awId).data2).toBe('AW Update 1');
//         expect(getNodeProps(docB, awId).data3).toBe('AW Update 2');

//         syncDocs(docA, docB);
//         syncDocs(docB, docA);

//         expect(getNodeProps(docA, awId).data2).toBe('AW Update 1');
//         expect(getNodeProps(docA, awId).data3).toBe('AW Update 2');
//         expect(getNodeProps(docB, awId).data3).toBe('AW Update 2');
//         expect(getNodeProps(docB, awId).data2).toBe('AW Update 1');

//         console.log(`\n✅ AW Concurrent Update Merge Test erfolgreich: Beide Updates wurden beibehalten.`);
//     });
// });