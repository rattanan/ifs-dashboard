import "server-only";

import { and, asc, desc, eq, isNull, lte, or } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { articleGroups, contents, users } from "@/lib/db/schema";

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
  return rows[0] ?? null;
}

export async function getArticleGroups() {
  return getDb().select().from(articleGroups).orderBy(asc(articleGroups.sortOrder), asc(articleGroups.name));
}
