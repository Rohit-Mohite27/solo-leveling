/** Express 5 params can be string | string[]. Normalize to one string. */
export function paramString(
  raw: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(raw)) return raw[0];
  return raw;
}

export function parseId(
  raw: string | string[] | undefined,
): number | null {
  const value = paramString(raw);
  if (value === undefined) return null;
  const id = Number(value);
  return Number.isFinite(id) ? id : null;
}
