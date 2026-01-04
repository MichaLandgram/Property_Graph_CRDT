import * as Y from 'yjs';
import { v4 as uuidv4 } from 'uuid';


/**
 My small Grow-Only Counter CRDT implementation using Yjs
 */
export class GrowOnlyCounter {
  public counterName: string;
  public counter: Y.Map<number>;
  private clientId: string;

  constructor(counterMap: Y.Map<number>, doc?: Y.Doc) {
    this.counterName = 'implicit';
    this.counter = counterMap;
    const d = doc || this.counter.doc;
    if (d) {
        this.clientId = d.clientID.toString();
    } else {
        // Fallback if sth goes wrong - but log a warning
        console.warn('GrowOnlyCounter: Could not determine client ID. Using fallback UUID.');
        this.clientId = uuidv4();
    }
  }

  increment({ amount = 1, doc }: { amount?: number;  doc?: Y.Doc }): void {
    if (amount < 0) {
      throw new Error('GrowOnlyCounter can only increment, not decrement');
    }

    const d = doc || this.counter.doc;
    if (!d) {
        throw new Error('GrowOnlyCounter cannot increment without being attached to a Y.Doc');
    }
    if (!this.clientId) {
        this.clientId = d.clientID.toString();
    }
    
    d.transact(() => {
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