import * as Y from 'yjs';
import { PropertyGraph } from '../PropertyGraph';

/**
 * Seeds the exact instance graph from the Bon19 paper figure: 
 *
 *   Persons:  p1 (Harry Hacker), p2 (Alice Alison), p3 (Bob Bobsten)
 *   Messages: m1, m2, m3
 *
 *   Relationships:
 *     m1 --HAS_CREATOR--> p2
 *     m3 --HAS_CREATOR--> p2
 *     m2 --HAS_CREATOR--> p3
 *     p1 --KNOWS-->       p2
 *     p2 --KNOWS-->       p3
 *     p1 --LIKES-->       m2
 *     p3 --LIKES-->       m2
 *     m3 --REPLY_OF-->   m2
 *
 * Idempotent: skips any node / edge that already exists.
 */
export function seedBon19Graph(doc: Y.Doc, pg: PropertyGraph): void {

    // Nodes
    // TODO Rewrite this to use firstName: {value: 'Harry', writeType: 'string'} 
    // writeType is the type the property is written as in the graph, helpful for the lens engine

    const nodeDefs = [
        {
            nodeId: 'p1',
            type: 'Person',
            color: '#3fb950',
            props: {
                firstName: 'Harry',
                lastName:  'Hacker',
                labels:    'resident, citizen',
            },
        },
        {
            nodeId: 'p2',
            type: 'Person',
            color: '#3fb950',
            props: {
                firstName: 'Alice',
                lastName:  'Alison',
                labels:    'resident, citizen',
            },
        },
        {
            nodeId: 'p3',
            type: 'Person',
            color: '#3fb950',
            props: {
                firstName: 'Bob',
                lastName:  'Bobsten',
                labels:    'resident, citizen',
            },
        },
        {
            nodeId: 'msg1',
            type: 'Message',
            color: '#da3633',
            props: {
                imageFile:    'photo33711.jpg',
                mood:         'happy',
                creationDate: '2010-10-16',
                browserUsed:  'Firefox',
                labels:       'message',
            },
        },
        {
            nodeId: 'msg2',
            type: 'Message',
            color: '#da3633',
            props: {
                imageFile:    'dummy2.jpg',
                mood:         'sad',
                creationDate: '2010-10-30',
                browserUsed:  'Firefox, Safari',
                labels:       'message',
            },
        },
        {
            nodeId: 'msg3',
            type: 'Message',
            color: '#da3633',
            props: {
                imageFile:    '',
                mood:         'nutral',
                creationDate: '2010-10-30',
                browserUsed:  'Safari',
                labels:       'message',
            },
        },
    ];

    for (const n of nodeDefs) {
        if (pg.getNodeProps(doc, n.nodeId)) continue;
        pg.addNode({ doc, nodeId: n.nodeId, type: n.type, props: n.props, color: n.color, policy: 'OBSERVED_REMOVE' });
    }

    // Edges

    const edgeDefs = [
        // HAS_CREATOR: Message → Person
        { edgeId: 'msg1-p2-hc', sourceId: 'msg1', targetId: 'p2', type: 'HAS_CREATOR', props: {} },
        { edgeId: 'msg3-p2-hc', sourceId: 'msg3', targetId: 'p2', type: 'HAS_CREATOR', props: {} },
        { edgeId: 'msg2-p3-hc', sourceId: 'msg2', targetId: 'p3', type: 'HAS_CREATOR', props: {} },

        // KNOWS: Person → Person
        { edgeId: 'p1-p2-knows', sourceId: 'p1', targetId: 'p2', type: 'KNOWS', props: {} },
        { edgeId: 'p2-p3-knows', sourceId: 'p2', targetId: 'p3', type: 'KNOWS', props: {} },

        // LIKES: Person → Message
        { edgeId: 'p1-msg2-likes', sourceId: 'p1', targetId: 'msg2', type: 'LIKES', props: {} },
        { edgeId: 'p3-msg2-likes', sourceId: 'p3', targetId: 'msg2', type: 'LIKES', props: {} },

        // REPLY_OF: Message → Message
        { edgeId: 'msg3-msg2-reply', sourceId: 'msg3', targetId: 'msg2', type: 'REPLY_OF', props: {} },
        { edgeId: 'msg2-msg1-reply', sourceId: 'msg2', targetId: 'msg2', type: 'REPLY_OF', props: {} },
    ];

    const existingEdgeIds = new Set(pg.getVisibleEdges(doc).map(e => e.id));
    for (const e of edgeDefs) {
        if (existingEdgeIds.has(e.edgeId)) continue;
        try {
            pg.addEdge({ doc, ...e });
        } catch {
            // ignorable but safe is safe :D
        }
    }
}
