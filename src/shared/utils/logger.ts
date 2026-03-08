
/**
 * Global logger utility for CostPilot.
 * 
 * This utility silences all logs in production to prevent technical "giveaways" 
 * in the browser console. During development or in terminal logs, it can be 
 * enabled to help with debugging.
 */
const isDev = import.meta.env.DEV;

export const Logger = {
    log: (...args: any[]) => {
        if (isDev) {
            console.log(...args);
        }
    },
    error: (...args: any[]) => {
        if (isDev) {
            console.error(...args);
        }
    },
    warn: (...args: any[]) => {
        if (isDev) {
            console.warn(...args);
        }
    },
    info: (...args: any[]) => {
        if (isDev) {
            console.info(...args);
        }
    },
};
