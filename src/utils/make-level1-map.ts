export function makeL1Map<DatumT, ValueT>(
  lst: Array<DatumT>, 
  getKey: (_: DatumT) => string, 
  getValue: (_: DatumT) => ValueT): Record<string, ValueT> {
  let l1Map: Record<string, ValueT> = {};
  for (const datum of lst) {
    l1Map[getKey(datum)] = getValue(datum);
  }

  return l1Map;
}
