// The few Node APIs the parallel test runners use (tests only; the project has no @types/node and adds no dependency).
declare module 'node:fs' {
  export function mkdirSync(path: string, opts?: { recursive?: boolean }): void;
  export function readdirSync(path: string): string[];
  export function readFileSync(path: string, encoding: 'utf8'): string;
  export function rmSync(path: string, opts?: { recursive?: boolean; force?: boolean }): void;
  export function writeFileSync(path: string, data: string): void;
}
declare module 'node:os' {
  export function availableParallelism(): number;
}
declare module 'node:path' {
  export function join(...parts: string[]): string;
}
declare const process: { cwd(): string; env: Record<string, string | undefined> };
