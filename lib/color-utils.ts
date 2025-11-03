/**
 * Determines the color for a score based on its value
 * - Positive: Lime Green (#39FF14)
 * - Zero: Electric Blue (#00FFFF)
 * - Negative: Hot Pink (#FF00FF)
 */
export function getScoreColor(score: number): string {
  if (score > 0) return '#39FF14'; // Lime Green - positive
  if (score === 0) return '#00FFFF'; // Electric Blue - zero
  return '#FF00FF'; // Hot Pink - negative
}

/**
 * Determines the color for a rank based on its position
 * - Top 25%: Lime Green (#39FF14)
 * - Middle 50%: Electric Blue (#00FFFF)
 * - Bottom 25%: Hot Pink (#FF00FF)
 */
export function getRankColor(rank: number, totalPlayers: number): string {
  const percentile = rank / totalPlayers;
  
  if (percentile <= 0.25) return '#39FF14'; // Lime Green - top 25%
  if (percentile <= 0.75) return '#00FFFF'; // Electric Blue - middle 50%
  return '#FF00FF'; // Hot Pink - bottom 25%
}

/**
 * Returns the ordinal suffix for a given number
 * Examples: 1st, 2nd, 3rd, 4th, etc.
 */
export function getOrdinalSuffix(num: number): string {
  const j = num % 10;
  const k = num % 100;
  
  if (j === 1 && k !== 11) return 'st';
  if (j === 2 && k !== 12) return 'nd';
  if (j === 3 && k !== 13) return 'rd';
  return 'th';
}

