// Type definitions for Node.js global objects
// These are the built-in objects available in the global scope of Node.js

// This is a simplified version of @types/node's global definitions
declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test';
    NEXT_PUBLIC_SUPABASE_URL: string;
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
    NEXT_PUBLIC_APP_URL: string;
    // Add other environment variables here
  }
}

// This allows TypeScript to understand the global `process` object
declare const process: NodeJS.Process;

// This allows TypeScript to understand the global `__dirname` and `__filename` in modules
declare const __dirname: string;
declare const __filename: string;

// This allows TypeScript to understand the global `setImmediate` function
declare function setImmediate(callback: (...args: any[]) => void, ...args: any[]): NodeJS.Immediate;

// This allows TypeScript to understand the global `clearImmediate` function
declare function clearImmediate(immediateId: NodeJS.Immediate): void;

// This allows TypeScript to understand the global `setInterval` function
declare function setInterval(callback: (...args: any[]) => void, ms: number, ...args: any[]): NodeJS.Timeout;

// This allows TypeScript to understand the global `clearInterval` function
declare function clearInterval(intervalId: NodeJS.Timeout): void;

// This allows TypeScript to understand the global `setTimeout` function
declare function setTimeout(callback: (...args: any[]) => void, ms: number, ...args: any[]): NodeJS.Timeout;

// This allows TypeScript to understand the global `clearTimeout` function
declare function clearTimeout(timeoutId: NodeJS.Timeout): void;
