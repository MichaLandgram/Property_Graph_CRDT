
import { useEffect, useRef, useState, useCallback } from 'react';
import { KuzuMessage, KuzuResponse } from './resultTypes';

export const useKuzu = () => {
    const [isReady, setIsReady] = useState(false);
    const workerRef = useRef<Worker | null>(null);
    const pendingQueries = useRef<Map<string, { resolve: (val: any) => void, reject: (err: any) => void }>>(new Map());

    useEffect(() => {
        const worker = new Worker(new URL('./kuzu.worker.ts', import.meta.url));
        workerRef.current = worker;

        worker.onmessage = (e: MessageEvent<KuzuResponse>) => {
            const { type } = e.data;
            
            if (type === 'INIT_SUCCESS') {
                setIsReady(true);
                return;
            }

            if (type === 'QUERY_RESULT') {
                const { id, result } = e.data as any;
                const promise = pendingQueries.current.get(id);
                if (promise) {
                    promise.resolve(result);
                    pendingQueries.current.delete(id);
                }
            }

            if (type === 'ERROR') {
                const { id, error } = e.data as any;
                if (id && pendingQueries.current.has(id)) {
                     pendingQueries.current.get(id)?.reject(error);
                     pendingQueries.current.delete(id);
                } else {
                    console.error("Kuzu Worker Error:", error);
                }
            }
        };

        // Send INIT
        worker.postMessage({ type: 'INIT' } as KuzuMessage);

        return () => {
            worker.terminate();
        };
    }, []);

    const query = useCallback((cypher: string): Promise<any> => {
        if (!workerRef.current || !isReady) return Promise.reject("DB not ready");

        const id = crypto.randomUUID();
        return new Promise((resolve, reject) => {
            pendingQueries.current.set(id, { resolve, reject });
            workerRef.current?.postMessage({ type: 'QUERY', cypher, id } as KuzuMessage);
        });
    }, [isReady]);

    return { isReady, query };
};
