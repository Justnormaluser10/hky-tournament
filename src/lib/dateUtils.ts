/**
 * Date & Time Utilities for Tournament Scheduling
 * Primary Timezone: Asia/Kolkata (IST - Gujarat, India)
 */

export const TOURNAMENT_TIMEZONE = 'Asia/Kolkata';

const MONTH_NAMES_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/**
 * Formats a date into human-friendly format (e.g., "25 Sep 2026").
 * Always formats in Asia/Kolkata timezone to avoid accidental day-shifting.
 */
export function formatMatchDate(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '';

  if (typeof dateInput === 'string') {
    // If it's a date-only string "YYYY-MM-DD"
    const match = dateInput.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) {
      const year = match[1];
      const monthIdx = parseInt(match[2], 10) - 1;
      const day = parseInt(match[3], 10);
      return `${day} ${MONTH_NAMES_SHORT[monthIdx] || ''} ${year}`;
    }
  }

  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return '';

  try {
    const day = d.toLocaleDateString('en-US', { day: 'numeric', timeZone: TOURNAMENT_TIMEZONE });
    const month = d.toLocaleDateString('en-US', { month: 'short', timeZone: TOURNAMENT_TIMEZONE });
    const year = d.toLocaleDateString('en-US', { year: 'numeric', timeZone: TOURNAMENT_TIMEZONE });
    return `${day} ${month} ${year}`;
  } catch {
    return '';
  }
}

/**
 * Formats a time string into 12-hour AM/PM format (e.g., "6:00 PM").
 */
export function formatMatchTime(timeInput: string | null | undefined): string {
  if (!timeInput) return '';
  const trimmed = timeInput.trim();

  // If already in 12h format like "6:00 PM", "07:30 PM", "6:00 AM"
  const m12 = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)$/i);
  if (m12) {
    const hours = parseInt(m12[1], 10);
    const mins = m12[2];
    const meridiem = m12[3].toUpperCase();
    return `${hours}:${mins} ${meridiem}`;
  }

  // If 24h format like "18:00" or "09:30"
  const m24 = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (m24) {
    let hours = parseInt(m24[1], 10);
    const mins = m24[2];
    const meridiem = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${mins} ${meridiem}`;
  }

  return trimmed;
}

/**
 * Converts a date input to HTML <input type="date"> value ("YYYY-MM-DD") in IST.
 */
export function toHtmlDateValue(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '';

  if (typeof dateInput === 'string') {
    const match = dateInput.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) return `${match[1]}-${match[2]}-${match[3]}`;
  }

  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return '';

  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: TOURNAMENT_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(d);
  } catch {
    return '';
  }
}

/**
 * Converts a time input to HTML <input type="time"> value ("HH:mm" 24h).
 */
export function toHtmlTimeValue(timeInput: string | null | undefined): string {
  if (!timeInput) return '';
  const trimmed = timeInput.trim();

  // If already 24h HH:mm
  const m24 = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (m24) {
    return `${m24[1].padStart(2, '0')}:${m24[2]}`;
  }

  // If 12h e.g. "6:00 PM" or "07:30 PM"
  const m12 = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)$/i);
  if (m12) {
    let hours = parseInt(m12[1], 10);
    const mins = m12[2];
    const isPM = m12[3].toUpperCase() === 'PM';
    if (isPM && hours < 12) hours += 12;
    if (!isPM && hours === 12) hours = 0;
    return `${String(hours).padStart(2, '0')}:${mins}`;
  }

  return '';
}

/**
 * Given a date string ("YYYY-MM-DD") and optional time string ("HH:mm"),
 * creates a Date object aligned to IST.
 */
export function parseIstDate(dateStr: string, timeStr?: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  let hours = 12;
  let minutes = 0;

  if (timeStr) {
    const m24 = timeStr.match(/^(\d{1,2}):(\d{2})$/);
    if (m24) {
      hours = parseInt(m24[1], 10);
      minutes = parseInt(m24[2], 10);
    } else {
      const m12 = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)/i);
      if (m12) {
        hours = parseInt(m12[1], 10);
        minutes = parseInt(m12[2], 10);
        const isPM = m12[3].toUpperCase() === 'PM';
        if (isPM && hours < 12) hours += 12;
        if (!isPM && hours === 12) hours = 0;
      }
    }
  }

  // Construct ISO string with +05:30 offset
  const hStr = String(hours).padStart(2, '0');
  const mStr = String(minutes).padStart(2, '0');
  const dStr = String(day).padStart(2, '0');
  const monStr = String(month).padStart(2, '0');
  const isoWithTz = `${year}-${monStr}-${dStr}T${hStr}:${mStr}:00+05:30`;

  return new Date(isoWithTz);
}
