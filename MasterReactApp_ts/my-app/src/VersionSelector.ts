/* Import the graph classes */
import { SGraphV4 } from './PG_Graph_Schema_Less/V4/SimpleGraph';
import { SchemaGraph } from './PG_Graph_Schema_Introduced/V1/SchemaGraph';
import { SchemaGraphV2 } from './PG_Graph_Schema_Introduced/Experimental_Versions/V2/SchemaGraph';
// import { SchemaGraphV3 } from './PG_Graph_Schema_Introduced/V3/SchemaGraph';
import { Graph } from './Helper/types_interfaces/graph';

/* Import the schema classes */
import { Schema_1 } from './PG_Graph_Schema/schema_1';
import { Schema_Interface } from './Helper/types_interfaces/schema';


export enum GraphImplementation {
    SIMPLE_V4 = 'SIMPLE_V4',
    // SIMPLE_V5 = 'SIMPLE_V5', Currently not implemented but it will be the next version supporting Observe Removed
    SCHEMA_V1 = 'SCHEMA_V1', // based on SIMPLE_V4
    SCHEMA_V2 = 'SCHEMA_V2', // based on SCHEMA_V1
    SCHEMA_V3 = 'SCHEMA_V3' // based on SCHEMA_V2
}

export enum SchemaImplementation {
    SCHEMA_1 = 'SCHEMA_1'
    // VARIABLE_SCHEMA_1 = 'VARIABLE_SCHEMA_1' // currently not implemented
}

// Change this value to switch between implementations
const ACTIVE_GRAPH_IMPLEMENTATION: GraphImplementation = GraphImplementation.SCHEMA_V3 as GraphImplementation;
const ACTIVE_SCHEMA_IMPLEMENTATION: SchemaImplementation = SchemaImplementation.SCHEMA_1 as SchemaImplementation;



export const getGraphInstance = (): Graph => {
    switch (ACTIVE_GRAPH_IMPLEMENTATION) {
        case GraphImplementation.SIMPLE_V4:
            return new SGraphV4();
        case GraphImplementation.SCHEMA_V1:
            return new SchemaGraph();
        // case GraphImplementation.SCHEMA_V2:
        //     return new SchemaGraphV2();
        // case GraphImplementation.SCHEMA_V3:
        //     return new SchemaGraphV3();
        default:
            throw new Error(`Unknown graph implementation: ${ACTIVE_GRAPH_IMPLEMENTATION}`);
    }
};

// most likely needed in test
export const getActiveGraphClass = () => {
    switch (ACTIVE_GRAPH_IMPLEMENTATION) {
        case GraphImplementation.SIMPLE_V4:
            return SGraphV4;
        case GraphImplementation.SCHEMA_V1:
            return SchemaGraph;
        // case GraphImplementation.SCHEMA_V2:
        //     return SchemaGraphV2;
        // case GraphImplementation.SCHEMA_V3:
        //     return SchemaGraphV3;
        default:
            throw new Error(`Unknown graph implementation: ${ACTIVE_GRAPH_IMPLEMENTATION}`);
    }
};


export const getSchemaInstance = (): Schema_Interface => {
    switch (ACTIVE_SCHEMA_IMPLEMENTATION) {
        case SchemaImplementation.SCHEMA_1:
            return new Schema_1();
        default:
            throw new Error(`Unknown schema implementation: ${ACTIVE_SCHEMA_IMPLEMENTATION}`);
    }
};

// most likely needed in test 
export const getActiveSchemaClass = () => {
    switch (ACTIVE_SCHEMA_IMPLEMENTATION) {
        case SchemaImplementation.SCHEMA_1:
            return Schema_1;
        default:
            throw new Error(`Unknown schema implementation: ${ACTIVE_SCHEMA_IMPLEMENTATION}`);
    }
};


