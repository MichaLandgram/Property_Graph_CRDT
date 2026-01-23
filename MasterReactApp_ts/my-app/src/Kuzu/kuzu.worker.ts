
import Kuzu from '@kuzu/kuzu-wasm';
import { KuzuMessage, KuzuResponse } from './resultTypes';

let db: any = null;
let conn: any = null;

const initDB = async () => {
    try {
        console.log("Worker: Loading Kuzu...");
        const kuzu = await Kuzu();
        console.log("Worker: Kuzu loaded keys:", Object.keys(kuzu));

        try {
            db = new kuzu.Database(":memory:", 1024 * 1024 * 512);
            conn = new kuzu.Connection(db);
        } catch (e: any) {
            console.warn("Worker: 'new' failed");
        }

        postMessage({ type: 'INIT_SUCCESS' } as KuzuResponse);
    } catch (err: any) {
        console.error("Kuzu Worker Init Error:", err);
        postMessage({ type: 'ERROR', error: err.toString() } as KuzuResponse);
    }
};

onmessage = async (e: MessageEvent<KuzuMessage>) => {
    const { type } = e.data;

    if (type === 'INIT') {
        if (!db) await initDB();
        else postMessage({ type: 'INIT_SUCCESS' } as KuzuResponse);
        return;
    }

    if (type === 'QUERY') {
        const { cypher, id } = e.data as any;
        try {
            if (!conn) throw new Error("Connection not initialized");
            const result = await conn.query(cypher);
            console.log("Worker: Query Result Object:", result);
            console.log("Worker: Result Keys:", Object.keys(result));
            console.log("Worker: Result Prototype:", Object.getPrototypeOf(result));
            const rows = [{ textInfo: result.toString() }]; 
            postMessage({ type: 'QUERY_RESULT', id, result: rows } as KuzuResponse);
        } catch (err: any) {
             postMessage({ type: 'ERROR', id, error: err.toString() } as KuzuResponse);
        }
    }
};
