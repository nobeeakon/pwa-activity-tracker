import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import type { Activity } from '../types/activity';

export function useActivity(id: number): Activity | undefined {
  const activity = useLiveQuery(
    () => db.activities.get(id),
    [id]
  );
  return activity;
}
