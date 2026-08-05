import "server-only";

import { and, asc, count, desc, eq, isNull, lte, or } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { articleGroups, contentReads, contents, users } from "@/lib/db/schema";
import { normalizeContentBody } from "@/lib/content-body";

export async function getPublishedContents(limit = 12) {
  const now = new Date();
  return getDb()
    .select({
      id: contents.id,
      type: contents.type,
      title: contents.title,
      slug: contents.slug,
      summary: contents.summary,
      coverImage: contents.coverImage,
      pinned: contents.pinned,
      publishAt: contents.publishAt,
      groupName: articleGroups.name,
      authorName: users.displayName,
    })
    .from(contents)
    .leftJoin(articleGroups, eq(contents.groupId, articleGroups.id))
    .innerJoin(users, eq(contents.authorId, users.id))
    .where(
      and(
        eq(contents.status, "PUBLISHED"),
        or(isNull(contents.publishAt), lte(contents.publishAt, now)),
      ),
    )
    .orderBy(desc(contents.pinned), desc(contents.publishAt), desc(contents.createdAt))
    .limit(limit);
}

export async function getPublishedContentsForUser(userId: string, limit = 12) {
  const now = new Date();
  return getDb()
    .select({
      id: contents.id,
      type: contents.type,
      title: contents.title,
      slug: contents.slug,
      summary: contents.summary,
      coverImage: contents.coverImage,
      pinned: contents.pinned,
      publishAt: contents.publishAt,
      groupName: articleGroups.name,
      authorName: users.displayName,
      readAt: contentReads.readAt,
    })
    .from(contents)
    .leftJoin(articleGroups, eq(contents.groupId, articleGroups.id))
    .innerJoin(users, eq(contents.authorId, users.id))
    .leftJoin(contentReads, and(eq(contentReads.contentId, contents.id), eq(contentReads.userId, userId)))
    .where(
      and(
        eq(contents.status, "PUBLISHED"),
        or(isNull(contents.publishAt), lte(contents.publishAt, now)),
      ),
    )
    .orderBy(desc(contents.pinned), desc(contents.publishAt), desc(contents.createdAt))
    .limit(limit);
}

export async function getUnreadContentCount(userId: string) {
  const now = new Date();
  const rows = await getDb()
    .select({ value: count(contents.id) })
    .from(contents)
    .leftJoin(contentReads, and(eq(contentReads.contentId, contents.id), eq(contentReads.userId, userId)))
    .where(
      and(
        eq(contents.status, "PUBLISHED"),
        or(isNull(contents.publishAt), lte(contents.publishAt, now)),
        isNull(contentReads.id),
      ),
    );
  return Number(rows[0]?.value ?? 0);
}

export async function markContentAsRead(userId: string, contentId: string) {
  await getDb()
    .insert(contentReads)
    .values({ id: crypto.randomUUID(), userId, contentId })
    .onDuplicateKeyUpdate({ set: { readAt: new Date() } });
}

export async function getPublishedContentBySlug(slug: string) {
  const rows = await getDb()
    .select({
      id: contents.id,
      type: contents.type,
      title: contents.title,
      summary: contents.summary,
      bodyJson: contents.bodyJson,
      coverImage: contents.coverImage,
      publishAt: contents.publishAt,
      groupName: articleGroups.name,
      authorName: users.displayName,
    })
    .from(contents)
    .leftJoin(articleGroups, eq(contents.groupId, articleGroups.id))
    .innerJoin(users, eq(contents.authorId, users.id))
    .where(and(eq(contents.slug, slug), eq(contents.status, "PUBLISHED")))
    .limit(1);
  const item = rows[0];
  return item ? { ...item, bodyJson: normalizeContentBody(item.bodyJson) } : null;
}

export async function getArticleGroups() {
  return getDb().select().from(articleGroups).orderBy(asc(articleGroups.sortOrder), asc(articleGroups.name));
}
