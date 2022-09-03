export function parseCommandlineArguments(
  args: string[],
  anchors: string[],
): Record<string, Array<string>> {
  let result: Record<string, Array<string>> = {};

  for (const anchor of anchors) {
    result[anchor] = new Array<string>();   
  }

  let argIdx = 0;
  while (argIdx < args.length) {
    const arg = args[argIdx];
    const value = args[argIdx+1];
    for (const anchor of anchors) {
      if (anchor === arg) {
        result[anchor].push(value);
        argIdx++;
        break;
      }
    }
    argIdx++;
  }

  return result;
}

export function parseColumnSeparatedPair(pair: string): { key: string, value: string } {
  let result: { key: string, value: string } = { key: '', value: '' };
  const segments = pair.split(':');

  let i = 0;
  if (i < segments.length) {
    result.key = segments[i++];
  }

  if (i < segments.length) {
    result.value = segments[i++];
  }

  return result;
}
