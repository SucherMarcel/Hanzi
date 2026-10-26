/** Random unique ID with a type prefix, e.g. "a-3f2a…" for an answer. */
export function newId(prefix: string): string {
  if (typeof crypto.randomUUID === 'function') return `${prefix}-${crypto.randomUUID()}`;
  const b = crypto.getRandomValues(new Uint8Array(16));
  return `${prefix}-${[...b].map((x) => x.toString(16).padStart(2, '0')).join('')}`;
}
