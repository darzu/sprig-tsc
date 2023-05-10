export function assert(cond: any, msg?: string): asserts cond {
  if (!cond)
    throw new Error(msg ?? "Assertion failed (consider adding a helpful msg).");
}

export function flatten<T>(ts: T[][]): T[] {
  return ts.reduce((p, n) => [...p, ...n], [] as T[]);
}
