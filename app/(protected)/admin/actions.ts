"use server";

import { hash } from "bcryptjs";
import { and, count, eq, ne } from "drizzle-orm";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { writeAudit } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { articleGroups, contents, media, sessions, users } from "@/lib/db/schema";

const userSchema = z.object({ username: z.string().trim().min(3).max(80).regex(/^[A-Za-z0-9._-]+$/), displayName: z.string().trim().min(2).max(160), password: z.string().min(12).max(128), role: z.enum(["ADMIN", "READ_ONLY"]) });
const groupSchema = z.object({ name: z.string().trim().min(2).max(160), slug: z.string().trim().min(2).max(180).regex(/^[a-z0-9-]+$/), description: z.string().trim().max(2000).optional(), sortOrder: z.coerce.number().int().min(0).max(9999) });
const contentSchema = z.object({ type: z.enum(["NEWS", "ARTICLE"]), title: z.string().trim().min(3).max(240), slug: z.string().trim().min(3).max(180).regex(/^[a-z0-9-]+$/), summary: z.string().trim().max(3000).optional(), body: z.string().trim().min(3).max(50000), groupId: z.string().uuid().optional().or(z.literal("")), status: z.enum(["DRAFT", "PUBLISHED"]), pinned: z.boolean() });

export async function createUserAction(formData: FormData) {
  const actor = await requireAdmin();
  const input = userSchema.parse(Object.fromEntries(formData));
  const id = crypto.randomUUID();
  await getDb().insert(users).values({ id, username: input.username.toLowerCase(), displayName: input.displayName, passwordHash: await hash(input.password, 12), role: input.role });
  await writeAudit({ actorId: actor.id, action: "USER_CREATE", entityType: "USER", entityId: id, metadata: { username: input.username, role: input.role } });
  revalidatePath("/admin/users");
}

export async function setUserActiveAction(formData: FormData) {
  const actor = await requireAdmin();
  const id = z.string().uuid().parse(formData.get("id"));
  const active = z.enum(["true", "false"]).parse(formData.get("active")) === "true";
  if (id === actor.id && !active) throw new Error("ไม่สามารถปิดบัญชีตนเองได้");
  const target = (await getDb().select({ role: users.role, active: users.active }).from(users).where(eq(users.id, id)).limit(1))[0];
  if (!target) throw new Error("ไม่พบผู้ใช้");
  if (!active && target.role === "ADMIN" && target.active) {
    const [{ total }] = await getDb().select({ total: count() }).from(users).where(and(eq(users.role, "ADMIN"), eq(users.active, true), ne(users.id, id)));
    if (total === 0) throw new Error("ต้องมี Admin ที่เปิดใช้งานอย่างน้อยหนึ่งบัญชี");
  }
  await getDb().update(users).set({ active, updatedAt: new Date() }).where(eq(users.id, id));
  if (!active) await getDb().delete(sessions).where(eq(sessions.userId, id));
  await writeAudit({ actorId: actor.id, action: active ? "USER_ACTIVATE" : "USER_DEACTIVATE", entityType: "USER", entityId: id });
  revalidatePath("/admin/users");
}

export async function resetPasswordAction(formData: FormData) {
  const actor = await requireAdmin();
  const id = z.string().uuid().parse(formData.get("id"));
  const password = z.string().min(12).max(128).parse(formData.get("password"));
  await getDb().update(users).set({ passwordHash: await hash(password, 12), updatedAt: new Date() }).where(eq(users.id, id));
  await getDb().delete(sessions).where(eq(sessions.userId, id));
  await writeAudit({ actorId: actor.id, action: "USER_PASSWORD_RESET", entityType: "USER", entityId: id });
  revalidatePath("/admin/users");
}

export async function createGroupAction(formData: FormData) {
  const actor = await requireAdmin();
  const input = groupSchema.parse(Object.fromEntries(formData));
  const id = crypto.randomUUID();
  await getDb().insert(articleGroups).values({ id, ...input });
  await writeAudit({ actorId: actor.id, action: "GROUP_CREATE", entityType: "ARTICLE_GROUP", entityId: id });
  revalidatePath("/admin/groups");
}

export async function setGroupActiveAction(formData: FormData) {
  const actor = await requireAdmin();
  const id = z.string().uuid().parse(formData.get("id"));
  const active = z.enum(["true", "false"]).parse(formData.get("active")) === "true";
  await getDb().update(articleGroups).set({ active, updatedAt: new Date() }).where(eq(articleGroups.id, id));
  await writeAudit({ actorId: actor.id, action: active ? "GROUP_ACTIVATE" : "GROUP_DEACTIVATE", entityType: "ARTICLE_GROUP", entityId: id });
  revalidatePath("/admin/groups");
}

function contentValues(formData: FormData) {
  const raw = Object.fromEntries(formData);
  return contentSchema.parse({ ...raw, pinned: formData.get("pinned") === "on" });
}

async function saveCoverImage(formData: FormData) {
  const file = formData.get("coverImage");
  if (!(file instanceof File) || file.size === 0) return undefined;
  const extensions: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
  const extension = extensions[file.type];
  if (!extension) throw new Error("รองรับเฉพาะ JPG, PNG และ WebP");
  if (file.size > 5 * 1024 * 1024) throw new Error("รูปภาพต้องมีขนาดไม่เกิน 5 MB");
  const filename = `${crypto.randomUUID()}.${extension}`;
  const directory = path.join(process.cwd(), "public", "uploads");
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, filename), Buffer.from(await file.arrayBuffer()));
  return { path: `/uploads/${filename}`, mimeType: file.type, sizeBytes: file.size, altText: String(formData.get("coverAlt") ?? "").slice(0, 240) || null };
}

async function recordMedia(upload: NonNullable<Awaited<ReturnType<typeof saveCoverImage>>>, contentId: string, uploadedBy: string) {
  await getDb().insert(media).values({ id: crypto.randomUUID(), contentId, uploadedBy, ...upload });
}

export async function createContentAction(formData: FormData) {
  const actor = await requireAdmin();
  const input = contentValues(formData);
  const id = crypto.randomUUID();
  const upload = await saveCoverImage(formData);
  await getDb().insert(contents).values({ id, type: input.type, title: input.title, slug: input.slug, summary: input.summary, groupId: input.groupId || null, status: input.status, pinned: input.pinned, publishAt: input.status === "PUBLISHED" ? new Date() : null, bodyJson: { paragraphs: input.body.split(/\n\s*\n/).filter(Boolean) }, coverImage: upload?.path, authorId: actor.id });
  if (upload) await recordMedia(upload, id, actor.id);
  await writeAudit({ actorId: actor.id, action: "CONTENT_CREATE", entityType: "CONTENT", entityId: id, metadata: { status: input.status } });
  revalidatePath("/"); revalidatePath("/content"); revalidatePath("/admin/content");
  redirect("/admin/content");
}

export async function updateContentAction(formData: FormData) {
  const actor = await requireAdmin();
  const id = z.string().uuid().parse(formData.get("id"));
  const input = contentValues(formData);
  const existing = (await getDb().select({ publishAt: contents.publishAt, coverImage: contents.coverImage }).from(contents).where(eq(contents.id, id)).limit(1))[0];
  const upload = await saveCoverImage(formData);
  const coverImage = upload?.path ?? existing?.coverImage;
  await getDb().update(contents).set({ type: input.type, title: input.title, slug: input.slug, summary: input.summary, groupId: input.groupId || null, status: input.status, pinned: input.pinned, publishAt: input.status === "PUBLISHED" ? existing?.publishAt ?? new Date() : null, bodyJson: { paragraphs: input.body.split(/\n\s*\n/).filter(Boolean) }, coverImage, updatedAt: new Date() }).where(eq(contents.id, id));
  if (upload) await recordMedia(upload, id, actor.id);
  await writeAudit({ actorId: actor.id, action: "CONTENT_UPDATE", entityType: "CONTENT", entityId: id, metadata: { status: input.status } });
  revalidatePath("/"); revalidatePath("/content"); revalidatePath("/admin/content"); revalidatePath(`/content/${input.slug}`);
  redirect("/admin/content");
}

export async function setContentStatusAction(formData: FormData) {
  const actor = await requireAdmin();
  const id = z.string().uuid().parse(formData.get("id"));
  const status = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).parse(formData.get("status"));
  await getDb().update(contents).set({ status, publishAt: status === "PUBLISHED" ? new Date() : null, updatedAt: new Date() }).where(eq(contents.id, id));
  await writeAudit({ actorId: actor.id, action: `CONTENT_${status}`, entityType: "CONTENT", entityId: id });
  revalidatePath("/"); revalidatePath("/content"); revalidatePath("/admin/content");
}
