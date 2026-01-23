import { db } from './database';
import type { Tag } from '../types/tag';

const MAX_TAG_NAME_LENGTH = 30;
const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;

export const tagService = {
  // Tag CRUD Operations

  async addTag(tag: Omit<Tag, 'id'>): Promise<number> {
    // Validate tag name
    const trimmedName = tag.name.trim();
    if (!trimmedName) {
      throw new Error('Tag name cannot be empty');
    }

    if (trimmedName.length > MAX_TAG_NAME_LENGTH) {
      throw new Error(`Tag name cannot exceed ${MAX_TAG_NAME_LENGTH} characters`);
    }

    // Check for duplicate names (case-insensitive)
    const existing = await db.tags
      .filter(t => t.name.toLowerCase() === trimmedName.toLowerCase())
      .first();

    if (existing) {
      throw new Error(`Tag "${trimmedName}" already exists`);
    }

    // Validate color format
    if (!HEX_COLOR_REGEX.test(tag.color)) {
      throw new Error('Color must be a valid hex code (e.g., #1976d2)');
    }

    const id = await db.tags.add({
      ...tag,
      name: trimmedName
    });

    if (id === undefined) {
      throw new Error('Failed to add tag');
    }

    return id;
  },

  async getAllTags(): Promise<Tag[]> {
    return await db.tags.orderBy('name').toArray();
  },

  async getTag(id: number): Promise<Tag | undefined> {
    return await db.tags.get(id);
  },

  async updateTag(id: number, changes: Partial<Tag>): Promise<number> {
    // If updating name, validate and check for duplicates
    if (changes.name !== undefined) {
      const trimmedName = changes.name.trim();

      if (!trimmedName) {
        throw new Error('Tag name cannot be empty');
      }

      if (trimmedName.length > MAX_TAG_NAME_LENGTH) {
        throw new Error(`Tag name cannot exceed ${MAX_TAG_NAME_LENGTH} characters`);
      }

      const existing = await db.tags
        .filter(t => t.name.toLowerCase() === trimmedName.toLowerCase() && t.id !== id)
        .first();

      if (existing) {
        throw new Error(`Tag "${trimmedName}" already exists`);
      }

      changes.name = trimmedName;
    }

    // If updating color, validate format
    if (changes.color && !HEX_COLOR_REGEX.test(changes.color)) {
      throw new Error('Color must be a valid hex code (e.g., #1976d2)');
    }

    return await db.tags.update(id, changes);
  },

  async deleteTag(id: number): Promise<void> {
    // Check if tag is in use by any activities
    const activities = await db.activities.toArray();
    const usageCount = activities.filter(a => a.tagIds?.includes(id)).length;

    if (usageCount > 0) {
      throw new Error(`Cannot delete tag: used by ${usageCount} ${usageCount === 1 ? 'activity' : 'activities'}`);
    }

    await db.tags.delete(id);
  },

  // Activity-Tag Relationship Operations

  async addTagToActivity(activityId: number, tagId: number): Promise<void> {
    const activity = await db.activities.get(activityId);
    if (!activity) {
      throw new Error(`Activity with ID ${activityId} not found`);
    }

    const tag = await db.tags.get(tagId);
    if (!tag) {
      throw new Error(`Tag with ID ${tagId} not found`);
    }

    const tagIds = activity.tagIds || [];

    // Idempotent operation - only add if not already present
    if (!tagIds.includes(tagId)) {
      await db.activities.update(activityId, {
        tagIds: [...tagIds, tagId]
      });
    }
  },

  async removeTagFromActivity(activityId: number, tagId: number): Promise<void> {
    const activity = await db.activities.get(activityId);
    if (!activity) return; // Silently ignore if activity doesn't exist

    const tagIds = activity.tagIds || [];
    await db.activities.update(activityId, {
      tagIds: tagIds.filter(id => id !== tagId)
    });
  },

  async getTagsForActivity(activityId: number): Promise<Tag[]> {
    const activity = await db.activities.get(activityId);
    if (!activity || !activity.tagIds || activity.tagIds.length === 0) {
      return [];
    }

    return await db.tags.where('id').anyOf(activity.tagIds).toArray();
  },

  async bulkAddTagsToActivity(activityId: number, tagIds: number[]): Promise<void> {
    const promises = tagIds.map(tagId => this.addTagToActivity(activityId, tagId));
    await Promise.all(promises);
  },

  async setTagsForActivity(activityId: number, tagIds: number[]): Promise<void> {
    await db.activities.update(activityId, { tagIds });
  },

  // Usage Statistics

  async getTagUsageCounts(): Promise<Map<number, number>> {
    const activities = await db.activities.toArray();
    const countMap = new Map<number, number>();

    activities.forEach(activity => {
      if (activity.tagIds) {
        activity.tagIds.forEach(tagId => {
          countMap.set(tagId, (countMap.get(tagId) || 0) + 1);
        });
      }
    });

    return countMap;
  }
};
