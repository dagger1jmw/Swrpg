// The few Node APIs the parallel test runners, the build's service-worker plugin (vite.config.ts) and the dist check use (the project
// has no @types/node and adds no dependency).
declare module 'node:fs' {
  export function mkdirSync(path: string, opts?: { recursive?: boolean }): void;
  export function readdirSync(path: string): string[];
  export function readFileSync(path: string, encoding: 'utf8'): string;
  export function readFileSync(path: string): Uint8Array;
  export function rmSync(path: string, opts?: { recursive?: boolean; force?: boolean }): void;
  export function writeFileSync(path: string, data: string | Uint8Array): void;
  export function existsSync(path: string): boolean;
  export function statSync(path: string): { isDirectory(): boolean; size: number };
}
declare module 'node:os' {
  export function availableParallelism(): number;
  export function tmpdir(): string;
}
declare module 'node:path' {
  export function join(...parts: string[]): string;
  export function relative(from: string, to: string): string;
}
declare module 'node:crypto' {
  export function createHash(algorithm: string): { update(data: string | Uint8Array): ReturnType<typeof createHash>; digest(encoding: 'hex'): string };
}
declare const process: { cwd(): string; pid: number; env: Record<string, string | undefined>; argv: string[]; exitCode?: number };
