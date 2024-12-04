export default function cosineSimilarity(
  vecA: number[],
  vecB: number[]
): number {
  const dotProduct = vecA.reduce((sum, value, i) => sum + value * vecB[i], 0);
  const magnitudeA = Math.sqrt(
    vecA.reduce((sum, value) => sum + value * value, 0)
  );
  const magnitudeB = Math.sqrt(
    vecB.reduce((sum, value) => sum + value * value, 0)
  );

  if (magnitudeA === 0 || magnitudeB === 0) return 0;

  return dotProduct / (magnitudeA * magnitudeB);
}
