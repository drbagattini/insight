export function median(arr: number[]): number {
  if (arr.length === 0) return 0;
  const sortedArr = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sortedArr.length / 2);
  if (sortedArr.length % 2 === 0) {
    return (sortedArr[mid - 1] + sortedArr[mid]) / 2;
  } else {
    return sortedArr[mid];
  }
}

export function percentile(arr: number[], p: number): number {
  if (arr.length === 0) return 0;
  if (p <= 0) return Math.min(...arr);
  if (p >= 100) return Math.max(...arr);

  const sortedArr = [...arr].sort((a, b) => a - b);
  const index = (p / 100) * (sortedArr.length - 1);
  
  if (Number.isInteger(index)) {
    return sortedArr[index];
  } else {
    const lowerIndex = Math.floor(index);
    const upperIndex = Math.ceil(index);
    const weight = index - lowerIndex;
    return sortedArr[lowerIndex] * (1 - weight) + sortedArr[upperIndex] * weight;
  }
}
