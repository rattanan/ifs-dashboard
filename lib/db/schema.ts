import {
  boolean,
  datetime,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

export type Role = "ADMIN" | "READ_ONLY";
export type ContentType = "NEWS" | "ARTICLE";
export type ContentStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export const users = mysqlTable(
  "users",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    username: varchar("username", { length: 80 }).notNull(),
    displayName: varchar("display_name", { length: 160 }).notNull(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    role: mysqlEnum("role", ["ADMIN", "READ_ONLY"]).notNull().default("READ_ONLY"),
    active: boolean("active").notNull().default(true),
    lastLoginAt: timestamp("last_login_at", { mode: "date" }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: datetime("updated_at", { mode: "date" }),
  },
  (table) => [uniqueIndex("users_username_uq").on(table.username)],
);

export const sessions = mysqlTable(
  "sessions",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: varchar("token_hash", { length: 64 }).notNull(),
    expiresAt: datetime("expires_at", { mode: "date" }).notNull(),
    lastSeenAt: datetime("last_seen_at", { mode: "date" }),
    ipAddress: varchar("ip_address", { length: 64 }),
    userAgent: varchar("user_agent", { length: 255 }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("sessions_token_hash_uq").on(table.tokenHash),
    index("sessions_user_id_idx").on(table.userId),
    index("sessions_expires_at_idx").on(table.expiresAt),
  ],
);

export const articleGroups = mysqlTable(
  "article_groups",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    name: varchar("name", { length: 160 }).notNull(),
    slug: varchar("slug", { length: 180 }).notNull(),
    description: text("description"),
    sortOrder: int("sort_order").notNull().default(0),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: datetime("updated_at", { mode: "date" }),
  },
  (table) => [uniqueIndex("article_groups_slug_uq").on(table.slug)],
);

export const contents = mysqlTable(
  "contents",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    groupId: varchar("group_id", { length: 36 }).references(() => articleGroups.id, {
      onDelete: "set null",
    }),
    type: mysqlEnum("type", ["NEWS", "ARTICLE"]).notNull(),
    status: mysqlEnum("status", ["DRAFT", "PUBLISHED", "ARCHIVED"])
      .notNull()
      .default("DRAFT"),
    title: varchar("title", { length: 240 }).notNull(),
    slug: varchar("slug", { length: 180 }).notNull(),
    summary: text("summary"),
    bodyJson: json("body_json").$type<{ paragraphs: string[] }>().notNull(),
    coverImage: varchar("cover_image", { length: 500 }),
    pinned: boolean("pinned").notNull().default(false),
    publishAt: timestamp("publish_at", { mode: "date" }),
    authorId: varchar("author_id", { length: 36 })
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: datetime("updated_at", { mode: "date" }),
  },
  (table) => [
    uniqueIndex("contents_slug_uq").on(table.slug),
    index("contents_status_publish_idx").on(table.status, table.publishAt),
    index("contents_group_idx").on(table.groupId),
  ],
);

export const media = mysqlTable(
  "media",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    contentId: varchar("content_id", { length: 36 }).references(() => contents.id, {
      onDelete: "cascade",
    }),
    path: varchar("path", { length: 500 }).notNull(),
    mimeType: varchar("mime_type", { length: 120 }).notNull(),
    sizeBytes: int("size_bytes").notNull(),
    altText: varchar("alt_text", { length: 240 }),
    uploadedBy: varchar("uploaded_by", { length: 36 })
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [index("media_content_idx").on(table.contentId)],
);

export const chatConversations = mysqlTable(
  "chat_conversations",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 200 }).notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: datetime("updated_at", { mode: "date" }),
  },
  (table) => [index("chat_conversations_user_idx").on(table.userId)],
);

export const chatMessages = mysqlTable(
  "chat_messages",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    conversationId: varchar("conversation_id", { length: 36 })
      .notNull()
      .references(() => chatConversations.id, { onDelete: "cascade" }),
    role: mysqlEnum("role", ["USER", "ASSISTANT"]).notNull(),
    content: text("content").notNull(),
    metricRefs: json("metric_refs").$type<string[]>(),
    filterSnapshot: json("filter_snapshot").$type<Record<string, string | null>>(),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [index("chat_messages_conversation_idx").on(table.conversationId)],
);

export const auditLogs = mysqlTable(
  "audit_logs",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    actorId: varchar("actor_id", { length: 36 }).references(() => users.id, {
      onDelete: "set null",
    }),
    action: varchar("action", { length: 100 }).notNull(),
    entityType: varchar("entity_type", { length: 80 }).notNull(),
    entityId: varchar("entity_id", { length: 80 }),
    metadata: json("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [index("audit_logs_actor_idx").on(table.actorId)],
);
