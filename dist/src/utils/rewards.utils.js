"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MILESTONE_CARDS = exports.ROL_SELL_VALUE = exports.ROL_USD_VALUE = void 0;
exports.calculate365DayAmount = calculate365DayAmount;
exports.getMilestoneCardTier = getMilestoneCardTier;
exports.calculateFinalAmount = calculateFinalAmount;
exports.calculateMilestoneCardBonus = calculateMilestoneCardBonus;
exports.ROL_USD_VALUE = 100;
exports.ROL_SELL_VALUE = 95;
exports.MILESTONE_CARDS = {
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
};
function calculate365DayAmount(initialAmount) {
    return initialAmount * Math.pow(1.05, 365);
}
function getMilestoneCardTier(stakeAmount) {
    if (stakeAmount >= 10000)
        return exports.MILESTONE_CARDS.DIAMOND;
    if (stakeAmount >= 1000)
        return exports.MILESTONE_CARDS.BRONZE;
    if (stakeAmount >= 100)
        return exports.MILESTONE_CARDS.METAL;
    if (stakeAmount >= 10)
        return exports.MILESTONE_CARDS.CLAY;
    if (stakeAmount >= 0.25 && stakeAmount < 10)
        return exports.MILESTONE_CARDS.TEST;
    return null;
}
function calculateFinalAmount(initialAmount, days) {
    return initialAmount * Math.pow(1.05, days);
}
function calculateMilestoneCardBonus(stakeAmount, period, daysCompleted) {
    const card = getMilestoneCardTier(stakeAmount);
    if (!card) {
        return { eligible: false };
    }
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
    if (period !== 'THREE_SIXTY_FIVE_DAYS') {
        return { eligible: false };
    }
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
//# sourceMappingURL=rewards.utils.js.map