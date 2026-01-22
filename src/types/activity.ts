export interface Activity {
  id?: number;
  name: string;
  description: string;
  createdAt: Date;
  records: { date: Date; note?: string }[];
  everyHours?: number;
  excludedDays?: number[]; // 0=Sunday, 6=Saturday
}

export type ActivityStatus = 'onTrack' | 'almostOverdue' | 'shortOverdue' | 'overdue';

