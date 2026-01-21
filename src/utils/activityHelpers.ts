import { format, formatDistanceToNow } from 'date-fns';
import type { ActivityStatus } from '../types/activity';

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
