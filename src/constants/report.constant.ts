export const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

export const TIME_CONSTANTS = {
  MILLISECONDS_PER_DAY: 24 * 60 * 60 * 1000,
  MILLISECONDS_PER_WEEK: 7 * 24 * 60 * 60 * 1000,
  DAYS_PER_MONTH_AVERAGE: 30,
} as const;

export const REPORT_BREAKDOWNS = {
  DAYS_THRESHOLD_FOR_DAILY: 7,
  DAYS_THRESHOLD_FOR_WEEKLY: 60, // Allow weekly breakdown for up to ~2 months
} as const;
