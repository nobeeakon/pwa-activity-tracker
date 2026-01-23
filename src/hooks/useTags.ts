import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import type { Tag } from '../types/tag';

/**
 * Get all tags sorted by name
 */
export function useTags(): Tag[] {
  const tags = useLiveQuery(() => db.tags.orderBy('name').toArray());
  return tags ?? [];
}

/**
 * Get a single tag by ID
 */
export function useTag(id: number | undefined): Tag | undefined {
  const tag = useLiveQuery(() => {
    if (id === undefined) return undefined;
    return db.tags.get(id);
  }, [id]);
  return tag;
}

/**
 * Resolve array of tag IDs to Tag objects
 */
export function useActivityTags(tagIds: number[] | undefined): Tag[] {
  const tags = useLiveQuery(async () => {
    if (!tagIds || tagIds.length === 0) return [];
    return await db.tags.where('id').anyOf(tagIds).toArray();
  }, [tagIds?.join(',')]); // Use join for stable dependency

  return tags ?? [];
}

/**
 * Get usage count for each tag (how many activities use each tag)
 */
export function useTagUsageCounts(): Map<number, number> {
  const counts = useLiveQuery(async () => {
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
  });

  return counts ?? new Map();
}
