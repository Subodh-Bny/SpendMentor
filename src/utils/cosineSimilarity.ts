export default function cosineSimilarity(
  vecA: number[],
  vecB: number[]
): number {
  if (vecA.length !== vecB.length) {
    throw new Error("Vectors must be of the same length");
  }

  const dotProduct = vecA.reduce((sum, value, i) => sum + value * vecB[i], 0);
  const magnitudeA = Math.sqrt(
    vecA.reduce((sum, value) => sum + value * value, 0)
  );
  const magnitudeB = Math.sqrt(
    vecB.reduce((sum, value) => sum + value * value, 0)
  );

  if (magnitudeA === 0 || magnitudeB === 0) return 0;

  const similarity = dotProduct / (magnitudeA * magnitudeB);
  return Math.max(-1, Math.min(1, similarity)); // Clamp between -1 and 1
}
