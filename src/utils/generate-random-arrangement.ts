export function generateRandomArrangement(population: number): Array<number> {
  const randIntInclusive =  (n: number) => Math.floor(Math.random() * n); // X ~ [0, n-1]
  let arrangement: number[] = [];
  for (let i = 0; i < population; i++) {
    arrangement.push(i);
  }

  const exchange = <T>(ary: T[], i: number, j: number) => {
    const temp = ary[i];
    ary[i] = ary[j];
    ary[j] = temp;
  };
  for (let i = 0; i < population; i++) {
    exchange(arrangement, i, i+randIntInclusive(population-1-i));
  }

  return arrangement;
}
