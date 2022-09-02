export function makeLevel2Map<T>(
  lst: Array<T>,
  getL1Key: (_: T) => string,
  getL2Key: (_: T) => string
): Record<string, Record<string, T>> {
  let l2Map: Record<string, Record<string, T>> = {};
  for (const datum of lst) {
    const l1Key = getL1Key(datum);
    const l2Key = getL2Key(datum);
    if (!(l2Map[l1Key])) {
      l2Map[l1Key] = {};
    }
    l2Map[l1Key][l2Key] = datum;
  }

  return l2Map;
}
