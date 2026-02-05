
import React, { useState } from 'react';
import { useKuzu } from './useKuzu';

export const KuzuTestComponent: React.FC = () => {
    const { isReady, query } = useKuzu();
    const [result, setResult] = useState<any>(null);
    const [log, setLog] = useState<string[]>([]);

    const addLog = (msg: string) => setLog(prev => [...prev, msg]);

    const handleCreate = async () => {
        try {
            addLog("Executing: CREATE NODE TABLE User(name STRING, age INT64, PRIMARY KEY (name))");
            await query("CREATE NODE TABLE User(name STRING, age INT64, PRIMARY KEY (name))");
            addLog("Table User created.");
            
            addLog("Executing: CREATE (u:User {name: 'Alice', age: 30})");
            await query("CREATE (u:User {name: 'Alice', age: 30})");
            addLog("User Alice created.");
        } catch (e: any) {
            addLog("Error: " + e.toString());
        }
    };

    const handleQuery = async () => {
        try {
            addLog("Executing: MATCH (u:User) RETURN u.*");
            const res = await query("MATCH (u:User) RETURN u.*");
            setResult(res);
            addLog("Query success.");
        } catch (e: any) {
            addLog("Error: " + e.toString());
        }
    };

    return (
        <div style={{ border: '1px solid #ccc', padding: '20px', margin: '20px' }}>
            <h2>KuzuDB WASM Test</h2>
            <div>Status: <strong>{isReady ? "Ready" : "Initializing..."}</strong></div>
            <div style={{ marginTop: '10px' }}>
                <button disabled={!isReady} onClick={handleCreate} style={{ marginRight: '10px' }}>
                    1. Create Schema & Data
                </button>
                <button disabled={!isReady} onClick={handleQuery}>
                    2. Query Data
                </button>
            </div>
            {result && (
                <div style={{ marginTop: '10px', background: '#f0f0f0', padding: '10px' }}>
                    <strong>Query Result:</strong>
                    <pre>{JSON.stringify(result, null, 2)}</pre>
                </div>
            )}
            <div style={{ marginTop: '10px', fontSize: '12px', color: '#555' }}>
                <strong>Log:</strong>
                {log.map((l, i) => <div key={i}>{l}</div>)}
            </div>
        </div>
    );
};
