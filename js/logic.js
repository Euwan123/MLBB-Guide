export function analyzeDarkSystem(totalMatches, winRate, mvpCount) {
  if (totalMatches === 0) {
    return null;
  }

  const benchmarks = getBenchmarks(totalMatches);
  const expectedWR = benchmarks.winRate;
  const expectedMVP = benchmarks.mvpCount;

  const wrGood = winRate >= expectedWR;
  const mvpGood = mvpCount >= expectedMVP;
  const mvpRatio = totalMatches > 0 ? Math.round((totalMatches / mvpCount) * 10) / 10 : 0;

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

function getBenchmarks(matchCount) {
  if (matchCount >= 5000) return { winRate: 53, mvpCount: Math.floor(matchCount / 10) };
  if (matchCount >= 4000) return { winRate: 52, mvpCount: Math.floor(matchCount / 10) };
  if (matchCount >= 3000) return { winRate: 53, mvpCount: Math.floor(matchCount / 10) };
  if (matchCount >= 2000) return { winRate: 54, mvpCount: Math.floor(matchCount / 10) };
  if (matchCount >= 1000) return { winRate: 55, mvpCount: Math.floor(matchCount / 10) };
  return { winRate: 52, mvpCount: Math.floor(matchCount / 10) };
}

export function getRankRecommendation(matchCount) {
  const ranks = [
    { minMatches: 5000, rank: 'Mythic', description: 'Elite tier - consistent top 1% skill' },
    { minMatches: 3000, rank: 'Legend', description: 'Advanced tier - strong mechanical skill' },
    { minMatches: 1000, rank: 'Grandmaster', description: 'Solid player - good game knowledge' },
    { minMatches: 500, rank: 'Master', description: 'Developing skills' },
    { minMatches: 100, rank: 'Expert', description: 'Learning rank basics' },
    { minMatches: 0, rank: 'Beginner', description: 'New to ranked' },
  ];
  for (const tier of ranks) {
    if (matchCount >= tier.minMatches) return tier;
  }
  return ranks[ranks.length - 1];
}

export function calculateSkillRating(winRate, mvpRate, heroMastery) {
  const wrComponent = (winRate - 50) * 2;
  const mvpComponent = mvpRate * 10;
  const masteryComponent = Math.min(heroMastery / 100, 2);
  const totalRating = Math.round(wrComponent + mvpComponent + masteryComponent);
  return Math.max(0, Math.min(100, totalRating));
}

export function analyzeHeroTier(pickRate, winRate) {
  if (pickRate > 15 && winRate > 55) return 'S+';
  if (pickRate > 12 && winRate > 54) return 'S';
  if (pickRate > 10 && winRate > 53) return 'A+';
  if (pickRate > 8 && winRate > 52) return 'A';
  if (pickRate > 5 && winRate > 51) return 'B+';
  if (winRate > 50) return 'B';
  return 'C';
}

export function shouldBan(pickRate, winRate, personalWRAgainst = null) {
  if (pickRate > 15 && winRate > 55) return true;
  if (personalWRAgainst && personalWRAgainst < 40) return true;
  return false;
}

export function analyzeRoleStats(role, stats) {
  return {
    role,
    avgWR: stats.avgWR || 0,
    avgMVP: stats.avgMVP || 0,
    suggestion: stats.avgWR >= 55 ? 'Strong role - continue' : 'Consider secondary role',
  };
}