import * as Y from 'yjs';
import { EdgeData } from './types';


export type edgeLabelData = Y.Map<EdgeData>;
export type edgeTargets = Y.Map<edgeLabelData>;

export type dataTypesYjs = string | number | boolean | Y.Array<dataTypesYjs> | Date | Y.Map<dataTypesYjs>; // |  CounterYjs| Vector | Point;

// export type CounterYjs = Y.Map<number>;