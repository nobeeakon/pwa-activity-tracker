import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import type { Activity } from '../types/activity';

export function useActivities(): Activity[] {
  const activities = useLiveQuery(() => db.activities.toArray());
  return activities ?? [];
}
