/**
 * LOGIC.JS - Game Logic & Calculations
 * Business logic for game analysis (Dark System calculator, etc.)
 * Separated from API calls and UI rendering
 */

/**
 * DARK SYSTEM ANALYZER
 */

/**
 * Calculate player classification based on Dark System
 * Analyzes win rate and MVP count against expected benchmarks
 *
 * @param {number} totalMatches - Total matches played
 * @param {number} winRate - Win rate percentage (0-100)
 * @param {number} mvpCount - Total MVP/Gold medals earned
 *
 * @returns {Object} Analysis result with classification and stats
 */
export function analyzeDarkSystem(totalMatches, winRate, mvpCount) {
  if (totalMatches === 0) {
    return null;
  }

  // Determine expected benchmarks by match count
  const benchmarks = getBenchmarks(totalMatches);
  const expectedWR = benchmarks.winRate;
  const expectedMVP = benchmarks.mvpCount;

  // Evaluate metrics
  const wrGood = winRate >= expectedWR;
  const mvpGood = mvpCount >= expectedMVP;
  const mvpRatio = totalMatches > 0 ? Math.round((totalMatches / mvpCount) * 10) / 10 : 0;

  // Classify player
  let classification = 'NEEDS IMPROVEMENT';
  let classificationClass = 'warning';

  if (wrGood && mvpGood) {
    classification = '💚 GOOD PLAYER';
    classificationClass = 'good';
  } else if (!wrGood && !mvpGood) {
    classification = '💀 DARK SYSTEM';
    classificationClass = 'dark';
  }

  return {
    classification,
    classificationClass,
    currentWR: winRate,
    expectedWR,
    currentMVP: mvpCount,
    expectedMVP,
    mvpRatio,
    wrPasses: wrGood,
    mvpPasses: mvpGood,
  };
}

/**
 * Get benchmarks for experience level
 * @private
 */
function getBenchmarks(matchCount) {
  if (matchCount >= 5000) {
    return { winRate: 53, mvpCount: Math.floor(matchCount / 10) };
  }
  if (matchCount >= 4000) {
    return { winRate: 52, mvpCount: Math.floor(matchCount / 10) };
  }
  if (matchCount >= 3000) {
    return { winRate: 53, mvpCount: Math.floor(matchCount / 10) };
  }
  if (matchCount >= 2000) {
    return { winRate: 54, mvpCount: Math.floor(matchCount / 10) };
  }
  if (matchCount >= 1000) {
    return { winRate: 55, mvpCount: Math.floor(matchCount / 10) };
  }
  return { winRate: 52, mvpCount: Math.floor(matchCount / 10) };
}

/**
 * RANKING SYSTEM
 */

/**
 * Determine rank progression based on matches
 */
export function getRankRecommendation(matchCount) {
  const ranks = [
    {
      minMatches: 5000,
      rank: 'Mythic',
      description: 'Elite tier - consistent top 1% skill',
    },
    {
      minMatches: 3000,
      rank: 'Legend',
      description: 'Advanced tier - strong mechanical skill',
    },
    {
      minMatches: 1000,
      rank: 'Grandmaster',
      description: 'Solid player - good game knowledge',
    },
    { minMatches: 500, rank: 'Master', description: 'Developing skills' },
    { minMatches: 100, rank: 'Expert', description: 'Learning rank basics' },
    { minMatches: 0, rank: 'Beginner', description: 'New to ranked' },
  ];

  for (const tier of ranks) {
    if (matchCount >= tier.minMatches) {
      return tier;
    }
  }

  return ranks[ranks.length - 1];
}

/**
 * Calculate skill rating based on stats
 */
export function calculateSkillRating(winRate, mvpRate, heroMastery) {
  // Simple skill formula combining multiple factors
  const wrComponent = (winRate - 50) * 2; // 50% WR = 0 points, 55% = 10 points
  const mvpComponent = mvpRate * 10; // Each 1% MVP rate = 10 points
  const masteryComponent = Math.min(heroMastery / 100, 2); // Cap at 2 points

  const totalRating = Math.round(wrComponent + mvpComponent + masteryComponent);
  return Math.max(0, Math.min(100, totalRating)); // Clamp 0-100
}

/**
 * HERO ANALYSIS
 */

/**
 * Classify hero tier based on meta stats
 */
export function analyzeHeroTier(pickRate, winRate) {
  // Tier classification logic
  if (pickRate > 15 && winRate > 55) return 'S+';
  if (pickRate > 12 && winRate > 54) return 'S';
  if (pickRate > 10 && winRate > 53) return 'A+';
  if (pickRate > 8 && winRate > 52) return 'A';
  if (pickRate > 5 && winRate > 51) return 'B+';
  if (winRate > 50) return 'B';
  return 'C';
}

/**
 * Determine if hero should be banned
 */
export function shouldBan(pickRate, winRate, personalWRAgainst = null) {
  // Strong pick + high win rate = ban priority
  if (pickRate > 15 && winRate > 55) return true;

  // High personal loss rate = ban priority
  if (personalWRAgainst && personalWRAgainst < 40) return true;

  return false;
}

/**
 * ROLE ANALYSIS
 */

/**
 * Analyze role effectiveness
 */
export function analyzeRoleStats(role, stats) {
  return {
    role,
    avgWR: stats.avgWR || 0,
    avgMVP: stats.avgMVP || 0,
    suggestion: stats.avgWR >= 55 ? 'Strong role - continue' : 'Consider secondary role',
  };
}
