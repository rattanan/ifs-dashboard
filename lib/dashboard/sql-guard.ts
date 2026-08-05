const forbidden = /\b(INSERT|UPDATE|DELETE|MERGE|CREATE|ALTER|DROP|TRUNCATE|GRANT|REVOKE|BEGIN|DECLARE|EXECUTE|CALL|COMMIT)\b/i;

export function assertReadOnlySql(sql: string) {
  const normalized = sql.trim();
  if (!/^(SELECT|WITH)\b/i.test(normalized)) {
    throw new Error("Oracle query must begin with SELECT or WITH");
  }
  if (normalized.includes(";") || normalized.includes("--") || normalized.includes("/*")) {
    throw new Error("Oracle query contains prohibited delimiters or comments");
  }
  if (forbidden.test(normalized)) {
    throw new Error("Oracle query contains a prohibited statement");
  }
  return normalized;
}

export function pickQueryBinds(sql: string, values: Record<string, unknown>) {
  const names = new Set(Array.from(sql.matchAll(/:([A-Za-z][A-Za-z0-9_]*)/g), (match) => match[1]));
  return Object.fromEntries(Array.from(names, (name) => [name, values[name] ?? null]));
}
