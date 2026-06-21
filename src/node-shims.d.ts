declare module 'node:crypto' {
  export function randomUUID(): string;
  export function createHash(algorithm: string): { update(data: string): { digest(encoding: 'hex'): string } };
  export function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean;
}
declare module 'node:test' {
  export default function test(name: string, fn: () => void | Promise<void>): void;
}
declare module 'node:assert/strict' {
  interface Assert { equal(actual: unknown, expected: unknown, message?: string): void; ok(value: unknown, message?: string): void; throws(block: () => unknown, validator?: (error: any) => boolean): void; }
  const assert: Assert;
  export default assert;
}
declare const Buffer: { from(input: string): Uint8Array };
