import { db } from './database';
import type { Activity } from '../types/activity';

export const activityService = {
  // Create
  async addActivity(activity: Omit<Activity, 'id'>): Promise<number> {
    const id = await db.activities.add(activity);
    if (id === undefined) {
      throw new Error('Failed to add activity');
    }
    return id;
  },

  // Read
  async getAllActivities(): Promise<Activity[]> {
    return await db.activities.toArray();
  },

  async getActivity(id: number): Promise<Activity | undefined> {
    return await db.activities.get(id);
  },

  // Update
  async updateActivity(id: number, changes: Partial<Activity>): Promise<number> {
    return await db.activities.update(id, changes);
  },

  async recordDate(id: number, date: Date, note?: string): Promise<void> {
    const activity = await db.activities.get(id);
    if (activity) {
      activity.records.push({ date, note });
      await db.activities.update(id, { records: activity.records });
    }
  },

  async updateRecordNote(activityId: number, recordIndex: number, note?: string): Promise<void> {
    const activity = await db.activities.get(activityId);
    if (activity && activity.records[recordIndex]) {
      activity.records[recordIndex].note = note;
      await db.activities.update(activityId, { records: activity.records });
    }
  },

  async deleteRecord(activityId: number, recordIndex: number): Promise<void> {
    const activity = await db.activities.get(activityId);
    if (activity && activity.records[recordIndex]) {
      activity.records.splice(recordIndex, 1);
      await db.activities.update(activityId, { records: activity.records });
    }
  },

  // Delete
  async deleteActivity(id: number): Promise<void> {
    await db.activities.delete(id);
  }
};
