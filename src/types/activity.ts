export interface Activity {
  id?: number;
  name: string;
  description: string;
  createdAt: Date;
  records: { date: Date; note?: string }[];
  everyHours?: number;
  /** 0=Sunday, 6=Saturday */
  excludedDays?: number[]; 
  tagIds?: number[];
}

export type ActivityStatus = 'onTrack' | 'almostOverdue' | 'shortOverdue' | 'overdue';

