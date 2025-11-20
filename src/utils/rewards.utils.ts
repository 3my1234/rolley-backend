export const ROL_USD_VALUE = 100; // 1 ROL = $100 USD (buy price)
export const ROL_SELL_VALUE = 95; // 1 ROL = $95 USD (sell price - 5% discount)

export const MILESTONE_CARDS = {
  TEST: {
    threshold: 0.25,
    maxThreshold: 0.99,
    name: 'Test',
    cardImage: 'test card.png',
    description: '7-Day Test Staker',
    emoji: '🧪',
    testOnly: true,
    minDays: 7,
  },
  CLAY: {
    threshold: 10,
    maxThreshold: 99.99,
    name: 'Clay',
    cardImage: 'clay.png',
    description: '365-Day Clay Staker',
    emoji: '🏺',
    minDays: 365,
  },
  METAL: {
    threshold: 100,
    maxThreshold: 999.99,
    name: 'Metal',
    cardImage: 'metal.png',
    description: '365-Day Metal Staker',
    emoji: '🔩',
    minDays: 365,
  },
  BRONZE: {
    threshold: 1000,
    maxThreshold: 9999.99,
    name: 'Bronze',
    cardImage: 'bronze.png',
    description: '365-Day Bronze Staker',
    emoji: '🥉',
    minDays: 365,
  },
  DIAMOND: {
    threshold: 10000,
    maxThreshold: 10000,
    name: 'Diamond',
    cardImage: 'diamond.png',
    description: '365-Day Diamond Staker',
    emoji: '💎',
    minDays: 365,
  },
} as const;

export function calculate365DayAmount(initialAmount: number): number {
  return initialAmount * Math.pow(1.05, 365);
}

export function getMilestoneCardTier(stakeAmount: number): typeof MILESTONE_CARDS[keyof typeof MILESTONE_CARDS] | null {
  if (stakeAmount >= 10000) return MILESTONE_CARDS.DIAMOND;
  if (stakeAmount >= 1000) return MILESTONE_CARDS.BRONZE;
  if (stakeAmount >= 100) return MILESTONE_CARDS.METAL;
  if (stakeAmount >= 10) return MILESTONE_CARDS.CLAY;
  if (stakeAmount >= 0.25 && stakeAmount < 10) return MILESTONE_CARDS.TEST;
  return null;
}

export function calculateFinalAmount(initialAmount: number, days: number): number {
  return initialAmount * Math.pow(1.05, days);
}

export function calculateMilestoneCardBonus(
  stakeAmount: number,
  period: string,
  daysCompleted?: number
): {
  eligible: boolean;
  cardTier?: string;
  cardImage?: string;
  cardEmoji?: string;
  finalAmount?: number;
  profit?: number;
  cardBonusUSD?: number;
  totalReceived?: number;
} {
  const card = getMilestoneCardTier(stakeAmount);
  
  if (!card) {
    return { eligible: false };
  }

  // For TEST card: Allow completion at 7 days
  if (card.name === 'Test') {
    const actualDays = daysCompleted || 7;
    if (actualDays < 7) {
      return { eligible: false };
    }
    
    const finalAmount = calculateFinalAmount(stakeAmount, actualDays);
    const profit = finalAmount - stakeAmount;
    const cardBonusUSD = profit / 5;
    const totalReceived = finalAmount + cardBonusUSD;

    return {
      eligible: true,
      cardTier: card.name,
      cardImage: card.cardImage,
      cardEmoji: card.emoji,
      finalAmount: Math.round(finalAmount * 100) / 100,
      profit: Math.round(profit * 100) / 100,
      cardBonusUSD: Math.round(cardBonusUSD * 100) / 100,
      totalReceived: Math.round(totalReceived * 100) / 100,
    };
  }

  // For REAL cards: Only for 365-day stakes
  if (period !== 'THREE_SIXTY_FIVE_DAYS') {
    return { eligible: false };
  }

  // Only for $10-$10,000 range
  if (stakeAmount < 10 || stakeAmount > 10000) {
    return { eligible: false };
  }

  const finalAmount = calculate365DayAmount(stakeAmount);
  const profit = finalAmount - stakeAmount;
  const cardBonusUSD = profit / 5;
  const totalReceived = finalAmount + cardBonusUSD;

  return {
    eligible: true,
    cardTier: card.name,
    cardImage: card.cardImage,
    cardEmoji: card.emoji,
    finalAmount: Math.round(finalAmount * 100) / 100,
    profit: Math.round(profit * 100) / 100,
    cardBonusUSD: Math.round(cardBonusUSD * 100) / 100,
    totalReceived: Math.round(totalReceived * 100) / 100,
  };
}
