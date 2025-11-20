export function getDaysInPeriod(period: string): number {
  const daysMap = {
    THIRTY_DAYS: 30,
    SIXTY_DAYS: 60,
    ONE_EIGHTY_DAYS: 180,
    THREE_SIXTY_FIVE_DAYS: 365,
  };
  return daysMap[period] || 30;
}

export function calculateStakeEndDate(startDate: Date, totalDays: number): Date {
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + totalDays);
  return endDate;
}

export function calculateDailyRollover(amount: number, odds: number): number {
  return amount * odds;
}
