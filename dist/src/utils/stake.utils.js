"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDaysInPeriod = getDaysInPeriod;
exports.calculateStakeEndDate = calculateStakeEndDate;
exports.calculateDailyRollover = calculateDailyRollover;
function getDaysInPeriod(period) {
    const daysMap = {
        THIRTY_DAYS: 30,
        SIXTY_DAYS: 60,
        ONE_EIGHTY_DAYS: 180,
        THREE_SIXTY_FIVE_DAYS: 365,
    };
    return daysMap[period] || 30;
}
function calculateStakeEndDate(startDate, totalDays) {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + totalDays);
    return endDate;
}
function calculateDailyRollover(amount, odds) {
    return amount * odds;
}
//# sourceMappingURL=stake.utils.js.map