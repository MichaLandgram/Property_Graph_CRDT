/**
 * SMALL MOCK GRAPH DATABASE EXPORT
 * 
 */

// 1. Raw Nodes directly from "String" DB layer
export const mockRawDBNodes = [
    {
        id: "node_1",
        identifyingType: "Person",
        props: {
            firstName: "John",
            lastName: "Doe",
            notAllowedProperty: "This should be filtered out by the SchemaLensEngine"
        }
    },
    {
        id: "node_2",
        identifyingType: "Message",
        props: {
            // DB stores "sad", Lens should translate to numeric 0, when typeChange.
            mood: "sad", 
            imageFile: 'image.png',
            creationDate: '2026-04-17T12:00:00.000Z',
            browserUsed: 'Chrome'
        }
    },
    {
        id: "node_3",
        identifyingType: "Spaceship", // Alien Ghost Node! Is not declared in Schema.
        props: {
            speed: "lightspeed"
        }
    }
];

// 2. Raw Edges directly from "String" DB layer
export const mockRawDBEdges = [
    {
        id: "edge_1",
        identifyingEdge: "KNOWS",
        sourceId: "node_1",
        targetId: "node_2",
        props: {
            since: "2010" 
        }
    }
];

/**
 * MOCK APPLICATION PAYLOADS 
 * 
 * This data mimics what your UI Application generates and wants to write 
 * INTO the database to test `encodeValueForGraph` stringification safely.
 */
export const mockAppUpdatePayloads = {
    messageUpdate: {
        identifyingType: "Message",
        props: {
             // App saves Integer 10 -> Lens should translate it to "10" for the DB!
            mood: 10,
            
             // postedAt is a not allowed property in the schema, so it should be filtered out by the SchemaLensEngine
            postedAt: new Date("2026-04-18T00:00:00.000Z")  
        }
    },
    kowsEdgeUpdate: {
        identifyingEdge: "KNOWS",
        props: {
            // App saves Native JS Integer -> Lens should parse safely to "2025" string
            since: 2025 
        }
    }
};
