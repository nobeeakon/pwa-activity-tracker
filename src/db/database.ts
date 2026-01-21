import Dexie, { type EntityTable } from 'dexie';
import type { Activity } from '../types/activity';

const db = new Dexie('ActivityTrackerDB') as Dexie & {
  activities: EntityTable<Activity, 'id'>;
};

// Version 1: Initial schema
db.version(1).stores({
  activities: '++id, name, createdAt'
});

// Version 2: Migrate recordedDates to records structure
db.version(2).stores({
  activities: '++id, name, createdAt'
}).upgrade(async (trans) => {
  console.log('🔄 Starting database migration from v1 to v2...');
  
  const activities = await trans.table('activities').toArray();
  let totalActivities = 0;
  let totalRecordsTransformed = 0;

  for (const activity of activities) {
    // Check if activity has the old recordedDates structure
    if (activity.recordedDates && Array.isArray(activity.recordedDates)) {
      const oldRecordsCount = activity.recordedDates.length;
      
      // Transform each date to the new record structure
      const records = activity.recordedDates.map((date: Date) => ({
        date: date,
        note: undefined
      }));

      // Update the activity with the new structure
      await trans.table('activities').update(activity.id, {
        records: records,
        recordedDates: undefined // Remove old field
      });

      totalActivities++;
      totalRecordsTransformed += oldRecordsCount;
      
      console.log(`  ✓ Migrated activity "${activity.name}": ${oldRecordsCount} dates → ${records.length} records`);
    } else if (!activity.records) {
      // Handle activities that might not have either field
      await trans.table('activities').update(activity.id, {
        records: []
      });
      totalActivities++;
      console.log(`  ✓ Initialized empty records for activity "${activity.name}"`);
    }
  }

  console.log(`✅ Migration complete: ${totalActivities} activities processed, ${totalRecordsTransformed} records transformed`);
});

export { db };
