export const isArray = (v) => Array.isArray(v);
export const isObj   = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
export const isPrim  = (v) => !isObj(v) && !isArray(v);

export function detectColumns(arr) {
  const keys = new Set();
  arr.forEach((item) => isObj(item) && Object.keys(item).forEach((k) => keys.add(k)));
  return [...keys];
}

export function formatValue(v) {
  if (v === null || v === undefined) return { text: 'null',     kind: 'null'    };
  if (typeof v === 'boolean')        return { text: String(v),  kind: 'bool'    };
  if (typeof v === 'number')         return { text: String(v),  kind: 'num'     };
  if (typeof v === 'string') {
    if (/^\d{4}-\d{2}-\d{2}T/.test(v)) {
      try { return { text: new Date(v).toLocaleString(), kind: 'date' }; } catch {}
    }
    return { text: v, kind: 'str' };
  }
  if (isArray(v)) return { text: `[${v.length} items]`,         kind: 'complex' };
  if (isObj(v))   return { text: `{${Object.keys(v).length} keys}`, kind: 'complex' };
  return { text: String(v), kind: 'str' };
}

export function kindColor(kind, theme) {
  const map = {
    null:    theme.muted,
    bool:    theme.warn,
    num:     theme.accent,
    str:     theme.text,
    date:    theme.accent3,
    complex: theme.muted,
  };
  return map[kind] || theme.text;
}
