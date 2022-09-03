export function getFromL2<EntryT, ValueT>(
  m: Record<string, Record<string, EntryT>>,
  k1: string,
  k2: string,
  getValue: (_: EntryT) => ValueT,
  defaultValue: ValueT
) {
  if (m[k1]) {
    if (m[k1][k2]) {
      return getValue(m[k1][k2]);
    }
  }

  return defaultValue;
}
