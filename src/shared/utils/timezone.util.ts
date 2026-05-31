const WINDOWS_TO_IANA_TIMEZONE: Record<string, string> = {
  '(UTC-05:00) Eastern Time (US & Canada)': 'America/New_York',
  'Eastern Standard Time': 'America/New_York',
  'US/Eastern': 'America/New_York',
  EST: 'America/New_York',
  EDT: 'America/New_York',
  '(UTC-06:00) Central Time (US & Canada)': 'America/Chicago',
  'Central Standard Time': 'America/Chicago',
  'US/Central': 'America/Chicago',
  CST: 'America/Chicago',
  CDT: 'America/Chicago',
  '(UTC-07:00) Mountain Time (US & Canada)': 'America/Denver',
  'Mountain Standard Time': 'America/Denver',
  'US/Mountain': 'America/Denver',
  MST: 'America/Denver',
  MDT: 'America/Denver',
  '(UTC-08:00) Pacific Time (US & Canada)': 'America/Los_Angeles',
  'Pacific Standard Time': 'America/Los_Angeles',
  'US/Pacific': 'America/Los_Angeles',
  PST: 'America/Los_Angeles',
  PDT: 'America/Los_Angeles',
  '(UTC+00:00) Dublin, Edinburgh, Lisbon, London': 'Europe/London',
  'GMT Standard Time': 'Europe/London',
  '(UTC+04:00) Yerevan': 'Asia/Yerevan',
};

export function normalizeIanaTimezone(timezone: string): string {
  const trimmed = timezone.trim();
  const mapped =
    WINDOWS_TO_IANA_TIMEZONE[trimmed] ??
    WINDOWS_TO_IANA_TIMEZONE[trimmed.replace(/\s+/g, ' ')] ??
    trimmed;

  try {
    Intl.DateTimeFormat(undefined, { timeZone: mapped });
  } catch {
    throw new Error(`Invalid timezone: ${timezone}`);
  }

  return mapped;
}

export function isValidIanaTimezone(timezone: string): boolean {
  try {
    normalizeIanaTimezone(timezone);
    return true;
  } catch {
    return false;
  }
}
