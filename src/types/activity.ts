export interface Activity {
  id?: number;
  name: string;
  description: string;
  createdAt: Date;
  records: { date: Date; note?: string }[];
  everyHours?: number;
}

export type ActivityStatus = 'onTrack' | 'almostOverdue' | 'shortOverdue' | 'overdue';

