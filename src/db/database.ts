import Dexie, { type EntityTable } from 'dexie';
import type { Activity } from '../types/activity';
import type { Tag } from '../types/tag';

const db = new Dexie('ActivityTrackerDB') as Dexie & {
  activities: EntityTable<Activity, 'id'>;
  tags: EntityTable<Tag, 'id'>;
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

// Version 3: Add excludedDays field
db.version(3).stores({
  activities: '++id, name, createdAt'
}).upgrade(async (trans) => {
  console.log('🔄 Starting database migration from v2 to v3...');

  const activities = await trans.table('activities').toArray();
  let migratedCount = 0;

  for (const activity of activities) {
    // Initialize excludedDays as empty array if not present
    if (!activity.excludedDays) {
      await trans.table('activities').update(activity.id, {
        excludedDays: []
      });
      migratedCount++;
      console.log(`  ✓ Initialized excludedDays for activity "${activity.name}"`);
    }
  }

  console.log(`✅ Migration complete: ${migratedCount} activities updated with excludedDays field`);
});

// Version 4: Add tags table and tagIds field to activities
db.version(4).stores({
  activities: '++id, name, createdAt',
  tags: '++id, name, createdAt'
}).upgrade(async (trans) => {
  console.log('🔄 Starting database migration from v3 to v4...');

  const activities = await trans.table('activities').toArray();
  let migratedCount = 0;

  for (const activity of activities) {
    // Initialize tagIds as empty array if not present
    if (!activity.tagIds) {
      await trans.table('activities').update(activity.id, {
        tagIds: []
      });
      migratedCount++;
      console.log(`  ✓ Initialized tagIds for activity "${activity.name}"`);
    }
  }

  console.log(`✅ Migration complete: ${migratedCount} activities updated with tagIds field`);
  console.log('📦 Tags table created successfully');
});

export { db };
