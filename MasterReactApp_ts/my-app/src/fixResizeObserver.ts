// This file is used to suppress the "ResizeObserver loop completed with undelivered notifications" error
// which is a common benign error when using graphing libraries like reagraph/reactflow.

const resizeObserverLoopErr = /ResizeObserver loop completed with undelivered notifications/;
const resizeObserverLoopLimitErr = /ResizeObserver loop limit exceeded/;

export const installFix = () => {
    // 1. Override console.error
    const originalError = console.error;
    console.error = (...args) => {
        if (args.some(arg => {
            if (typeof arg === 'string') {
                return resizeObserverLoopErr.test(arg) || resizeObserverLoopLimitErr.test(arg);
            }
            if (arg instanceof Error) {
                return resizeObserverLoopErr.test(arg.message) || resizeObserverLoopLimitErr.test(arg.message);
            }
            return false;
        })) {
            return;
        }
        originalError.call(console, ...args);
    };

    // 2. Add window error event listener
    window.addEventListener('error', (e) => {
        if (resizeObserverLoopErr.test(e.message) || resizeObserverLoopLimitErr.test(e.message)) {
            e.stopImmediatePropagation();
            e.preventDefault();
        }
    });

    // 3. Override window.onerror
    const originalOnError = window.onerror;
    window.onerror = (msg, url, lineNo, columnNo, error) => {
        const message = String(msg);
        if (resizeObserverLoopErr.test(message) || resizeObserverLoopLimitErr.test(message)) {
            return true; // Suppress error
        }
        if (originalOnError) {
            return originalOnError(msg, url, lineNo, columnNo, error);
        }
        return false;
    };
};
