import { useState, useCallback } from 'react';

export const useGraphErrorHandler = () => {
    const [_, setError] = useState(() => {
        return (error: Error) => {
             throw error;
        };
    });

    return useCallback((e: Error) => {
        setError(() => {
            throw e;
        });
    }, []);
};
