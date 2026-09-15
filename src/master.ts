import source from '../masters/2026.json' with { type: 'json' };
function freezeDeep<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    for (const child of Object.values(value)) freezeDeep(child);
    Object.freeze(value);
  }
  return value;
}
export const master = freezeDeep(source);
