// Calendar days as "YYYY-MM-DD" strings in the device's local time zone.
// Days compare correctly as plain strings.

export type Day = string;

const pad = (n: number) => String(n).padStart(2, '0');

export function localDay(at: string | Date): Day {
  const d = typeof at === 'string' ? new Date(at) : at;
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function addDays(day: Day, n: number): Day {
  const [y, m, d] = day.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}

export function daysBetween(from: Day, to: Day): number {
  const toUtc = (day: Day) => {
    const [y, m, d] = day.split('-').map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((toUtc(to) - toUtc(from)) / 86_400_000);
}
