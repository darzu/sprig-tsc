export function assert(cond: any, msg?: string): asserts cond {
  if (!cond)
    throw new Error(msg ?? "Assertion failed (consider adding a helpful msg).");
}

export function flatten<T>(ts: T[][]): T[] {
  return ts.reduce((p, n) => [...p, ...n], [] as T[]);
}

export function range(length: number): number[] {
  return ((new Array(length) as any).fill(null) as number[]).map((_, i) => i);
}

export function parseJsonWithComments(str: string): any {
  // https://stackoverflow.com/questions/33483667/how-to-strip-json-comments-in-javascript
  str = str.replace(/\\"|"(?:\\"|[^"])*"|(\/\/.*|\/\*[\s\S]*?\*\/)/g, (m, g) =>
    g ? "" : m
  );
  return JSON.parse(str);
}

export function never(x: never, msg?: string): never {
  throw new Error(msg ?? "Unexpected object: " + x);
}
