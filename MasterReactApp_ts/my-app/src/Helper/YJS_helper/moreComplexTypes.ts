import * as Y from 'yjs';
import { Counter } from '../../Helper/types_interfaces/types';


/**
 My small Grow-Only Counter CRDT implementation using Yjs
 */
export class GrowOnlyCounter {
  public counterName: string;
  public counter: Y.Map<number>;
  private clientId: string;

  constructor(doc: Y.Doc, counterName: string = 'counter') {
    this.counterName = counterName;
    this.counter = doc.getMap<number>(counterName);
    this.clientId = doc.clientID.toString();
  }

  increment({ amount = 1, doc }: { amount?: number;  doc: Y.Doc }): void {
    if (amount < 0) {
      throw new Error('GrowOnlyCounter can only increment, not decrement');
    }
    
    doc.transact(() => {
      const currentValue = this.counter.get(this.clientId) || 0;
      this.counter.set(this.clientId, currentValue + amount);
    });
  }

  getTotal(): number {
    let total = 0;
    this.counter.forEach((value) => {
      total += value;
    });
    return total;
  }

  getClientValue(): number {
    return this.counter.get(this.clientId) || 0;
  }

  getAllValues(): Map<string, number> {
    const values = new Map<string, number>();
    this.counter.forEach((value, clientId) => {
      values.set(clientId, value);
    });
    return values;
  }

  reset({doc}: {doc: Y.Doc}): void {
    doc.transact(() => {
      this.counter.delete(this.clientId);
    });
  }

  onUpdate(callback: (total: number) => void): () => void {
    const observer = () => {
      callback(this.getTotal());
    };
    
    this.counter.observe(observer);
    
    return () => {
      this.counter.unobserve(observer);
    };
  }
}

// Usage example:
/*
const ydoc = new Y.Doc();
const counter = new GrowOnlyCounter(ydoc);

counter.increment();      // Increment by 1
counter.increment(5);     // Increment by 5

console.log(counter.getTotal());        // Total from all clients
console.log(counter.getClientValue());  // This client's contribution

// Subscribe to changes
const unsubscribe = counter.onUpdate((total) => {
  console.log('Counter total:', total);
});

// Unsubscribe when done
unsubscribe();
*/


// TODO BETTER IMPLEMENTATIONS FOR POINT AND VECTOR 
export class Point {
    x: number;
    y: number;
    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
}

export class OurVector {
    x: number;
    y: number;
    z: number;
    constructor(x: number, y: number, z: number) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
}