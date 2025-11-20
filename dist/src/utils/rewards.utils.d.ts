export declare const ROL_USD_VALUE = 100;
export declare const ROL_SELL_VALUE = 95;
export declare const MILESTONE_CARDS: {
    readonly TEST: {
        readonly threshold: 0.25;
        readonly maxThreshold: 0.99;
        readonly name: "Test";
        readonly cardImage: "test card.png";
        readonly description: "7-Day Test Staker";
        readonly emoji: "🧪";
        readonly testOnly: true;
        readonly minDays: 7;
    };
    readonly CLAY: {
        readonly threshold: 10;
        readonly maxThreshold: 99.99;
        readonly name: "Clay";
        readonly cardImage: "clay.png";
        readonly description: "365-Day Clay Staker";
        readonly emoji: "🏺";
        readonly minDays: 365;
    };
    readonly METAL: {
        readonly threshold: 100;
        readonly maxThreshold: 999.99;
        readonly name: "Metal";
        readonly cardImage: "metal.png";
        readonly description: "365-Day Metal Staker";
        readonly emoji: "🔩";
        readonly minDays: 365;
    };
    readonly BRONZE: {
        readonly threshold: 1000;
        readonly maxThreshold: 9999.99;
        readonly name: "Bronze";
        readonly cardImage: "bronze.png";
        readonly description: "365-Day Bronze Staker";
        readonly emoji: "🥉";
        readonly minDays: 365;
    };
    readonly DIAMOND: {
        readonly threshold: 10000;
        readonly maxThreshold: 10000;
        readonly name: "Diamond";
        readonly cardImage: "diamond.png";
        readonly description: "365-Day Diamond Staker";
        readonly emoji: "💎";
        readonly minDays: 365;
    };
};
export declare function calculate365DayAmount(initialAmount: number): number;
export declare function getMilestoneCardTier(stakeAmount: number): typeof MILESTONE_CARDS[keyof typeof MILESTONE_CARDS] | null;
export declare function calculateFinalAmount(initialAmount: number, days: number): number;
export declare function calculateMilestoneCardBonus(stakeAmount: number, period: string, daysCompleted?: number): {
    eligible: boolean;
    cardTier?: string;
    cardImage?: string;
    cardEmoji?: string;
    finalAmount?: number;
    profit?: number;
    cardBonusUSD?: number;
    totalReceived?: number;
};
