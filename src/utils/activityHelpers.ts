import { format, formatDistanceToNow, addHours, differenceInHours, max } from 'date-fns';
import type { Activity, ActivityStatus } from '../types/activity';

// Maximum length for record notes
export const MAX_NOTE_LENGTH = 300;

// Helper function to calculate status based on hours until due
export function calculateStatus(hoursUntilDue: number): ActivityStatus {
  if (hoursUntilDue > 8) {
    return 'onTrack';
  } else if (hoursUntilDue > 0) {
    return 'almostOverdue';
  } else if (hoursUntilDue > -24) {
    return 'shortOverdue';
  } else {
    return 'overdue';
  }
}

// Helper function to format time display
export function formatTimeDuration(hours: number): string {
  const absHours = Math.abs(hours);
  
  if (absHours < 24) {
    return `${Math.floor(absHours)} hour${Math.floor(absHours) !== 1 ? 's' : ''}`;
  } else {
    const days = Math.floor(absHours / 24);
    return `${days} day${days !== 1 ? 's' : ''}`;
  }
}

// Helper function to format record date with relative time
export function formatRecordDate(date: Date): string {
  const formattedDate = format(date, 'MMM d, yyyy');
  const relativeTime = formatDistanceToNow(date, { addSuffix: true });
  return `${formattedDate} (${relativeTime})`;
}

// Calculate next due date considering excluded days
export function calculateNextDueDate(
  lastRecordDate: Date,
  everyHours: number,
  excludedDays?: number[]
): Date {
  // Calculate base next due date
  let nextDue = addHours(lastRecordDate, everyHours);

  // If no excluded days, return immediately
  if (!excludedDays || excludedDays.length === 0) {
    return nextDue;
  }

  // Advance by 24 hours while date falls on excluded day (max 7 iterations for safety)
  let iterations = 0;
  while (excludedDays.includes(nextDue.getDay()) && iterations < 7) {
    nextDue = addHours(nextDue, 24);
    iterations++;
  }

  return nextDue;
}

// Calculate activity status including all timing information
export function calculateActivityStatus(activity: Activity): {
  lastRecordedDate: Date | null;
  hoursSinceLastRecord: number | null;
  hoursUntilDue: number | null;
  status: ActivityStatus | null;
} {
  // Find last record date
  const lastRecordedDate =
    activity.records.length > 0
      ? max(activity.records.map((r) => r.date))
      : null;

  // Calculate hours since last record
  const hoursSinceLastRecord = lastRecordedDate
    ? differenceInHours(new Date(), lastRecordedDate)
    : null;

  // Calculate next due date and status if activity has scheduling
  let hoursUntilDue: number | null = null;
  let status: ActivityStatus | null = null;

  if (activity.everyHours && lastRecordedDate) {
    const nextDueDate = calculateNextDueDate(
      lastRecordedDate,
      activity.everyHours,
      activity.excludedDays
    );
    hoursUntilDue = differenceInHours(nextDueDate, new Date());
    status = calculateStatus(hoursUntilDue);
  }

  return {
    lastRecordedDate,
    hoursSinceLastRecord,
    hoursUntilDue,
    status,
  };
}
