import * as Y from 'yjs';
import { GrowOnlyCounter, OurVector, Point } from '../Helper/YJS_helper/moreComplexTypes';

/**
 * A wrapper around Y.Map that implements the "Dual-Key Register" pattern.
 * It handles the 'init_' prefixing logic to resolve concurrency races between 
 * creations and updates. [add vs update]
 */
export class DualKeyMap {
    private map: Y.Map<any>;

    // wrapper around Y.Map
    constructor(map: Y.Map<any>) {
        this.map = map;
    }

    /**
     * Sets an initial value. primitive values are prefixed with 'init_'.
     * Complex shared types (Y.Map, Y.Array, Counter) are set directly 
     * because they support internal merging.
     */
    setInitial(key: string, value: any) {
        // Shared Types: No race condition, set directly
        if (value instanceof GrowOnlyCounter) {
            this.map.set(key, value.counter);
            return;
        }
        if (value instanceof Y.Map || value instanceof Y.Array) {
            this.map.set(key, value);
            return;
        }

        // Primitives: Use init_ prefix to avoid overwriting concurrent updates
        const initKey = `init_${key}`;
        
        // Handle custom objects that need serialization
        if (value instanceof Date) {
            this.map.set(initKey, value.toISOString());
            return;
        }

        // Standard primitive (string, number, boolean)
        this.map.set(initKey, value);
    }

    /**
     * Sets an update value.
     * Always sets the direct key.
     * Deletes the 'init_' key if it exists to optimize memory (Dual-Key cleanup).
     */
    setUpdate(key: string, value: any, expectedType?: any, graph?: any) {
        if (expectedType && typeof expectedType === 'object' && 'kind' in expectedType) { 
             if (expectedType.kind === 'counter' && typeof value === 'number') {
                  if (!graph) throw new Error("Graph instance required for Counter update");
                  this.handleCounterUpdate(key, value, graph);
                  return;
             } else if (expectedType.kind === 'yarray' && Array.isArray(value)) {
                  this.handleArrayUpdate(key, value);
                  return;
             } else if (expectedType.kind === 'ymap' && typeof value === 'object' && value !== null && !(value instanceof Y.Map)) {
                  this.handleMapUpdate(key, value);
                  return;
             }
        }

        this.map.set(key, value);
        
        // Memory Optimization: Delete init key if it exists
        const initKey = `init_${key}`;
        if (this.map.has(initKey)) {
            this.map.delete(initKey);
        }
    }

    /**
     * Prioritizes the direct key (Update).
     * Falls back to 'init_' key (Initial) if direct key is missing.
     */
    get(key: string): any {
        if (this.map.has(key)) {
            return this.map.get(key);
        }
        const initKey = `init_${key}`;
        return this.map.get(initKey);
    }

    /**
     * Returns all normalized properties as a object.
     * Merges 'init_' keys and direct keys, with direct keys taking precedence.
     */
    getAll(): any {
        const combinedProps = new Map<string, any>();
        
        // Iterate all keys in the underlying map
        this.map.forEach((value: any, key: string) => {
             if (key.startsWith('init_')) {
                 const realKey = key.replace('init_', '');
                 // Only use init value if we haven't seen a update value yet
                 if (!combinedProps.has(realKey)) {
                     combinedProps.set(realKey, value);
                 }
             } else {
                 combinedProps.set(key, value);
             }
        });

        const result: any = {};
        combinedProps.forEach((value, key) => {
            result[key] = value;
        });
        return result;
    }

    private handleCounterUpdate(key: string, value: number, graph: any) {
        let currentCounterMap = this.map.get(key);
        if (!currentCounterMap || !(currentCounterMap instanceof Y.Map)) {
             const newMap = new Y.Map<number>();
             this.map.set(key, newMap);
             currentCounterMap = newMap;
        }
        if (currentCounterMap instanceof Y.Map) {
             const counterWrapper = new GrowOnlyCounter(currentCounterMap, graph);
             const currentTotal = counterWrapper.getTotal();
             const diff = value - currentTotal;
             if (diff > 0) {
                 counterWrapper.increment({ amount: diff });
             } else if (diff < 0) {
                 console.warn(`GrowOnlyCounter for ${key} cannot be decremented. Ignored.`);
             }
             return;
        }
    }

    private handleArrayUpdate(key: string, value: any[]) {
        let currentArray = this.map.get(key);
        if (!currentArray || !(currentArray instanceof Y.Array)) {
            const newArray = new Y.Array();
            this.map.set(key, newArray);
            currentArray = newArray;
        }
        if (currentArray instanceof Y.Array) {
            const length = currentArray.length;
            if (length > 0) currentArray.delete(0, length);
            currentArray.push(value);
        }
    }

    private handleMapUpdate(key: string, value: any) {
        let currentMap = this.map.get(key);
        if (!currentMap || !(currentMap instanceof Y.Map)) {
            const newMap = new Y.Map();
            this.map.set(key, newMap);
            currentMap = newMap;
        }
        if (currentMap instanceof Y.Map) {
            const currentKeys = Array.from(currentMap.keys());
            const newKeys = Object.keys(value);
            
            newKeys.forEach(inputKey => {
                if (currentMap.get(inputKey) !== value[inputKey]) {
                    currentMap.set(inputKey, value[inputKey]);
                }
            });

            currentKeys.forEach(existingKey => {
                if (!(existingKey in value)) {
                    currentMap.delete(existingKey);
                }
            });
        }
    }
}
