CREATE TABLE IF NOT EXISTS users (
  id varchar(36) PRIMARY KEY,
  username varchar(80) NOT NULL,
  display_name varchar(160) NOT NULL,
  password_hash varchar(255) NOT NULL,
  role enum('ADMIN','READ_ONLY') NOT NULL DEFAULT 'READ_ONLY',
  active boolean NOT NULL DEFAULT true,
  last_login_at timestamp NULL,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at datetime NULL,
  UNIQUE KEY users_username_uq (username)
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS sessions (
  id varchar(36) PRIMARY KEY,
  user_id varchar(36) NOT NULL,
  token_hash varchar(64) NOT NULL,
  expires_at datetime NOT NULL,
  last_seen_at datetime NULL,
  ip_address varchar(64),
  user_agent varchar(255),
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY sessions_token_hash_uq (token_hash),
  KEY sessions_user_id_idx (user_id),
  KEY sessions_expires_at_idx (expires_at),
  CONSTRAINT sessions_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS article_groups (
  id varchar(36) PRIMARY KEY,
  name varchar(160) NOT NULL,
  slug varchar(180) NOT NULL,
  description text,
  sort_order int NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at datetime NULL,
  UNIQUE KEY article_groups_slug_uq (slug)
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS contents (
  id varchar(36) PRIMARY KEY,
  group_id varchar(36),
  type enum('NEWS','ARTICLE') NOT NULL,
  status enum('DRAFT','PUBLISHED','ARCHIVED') NOT NULL DEFAULT 'DRAFT',
  title varchar(240) NOT NULL,
  slug varchar(180) NOT NULL,
  summary text,
  body_json longtext NOT NULL,
  cover_image varchar(500),
  pinned boolean NOT NULL DEFAULT false,
  publish_at timestamp NULL,
  author_id varchar(36) NOT NULL,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at datetime NULL,
  UNIQUE KEY contents_slug_uq (slug),
  KEY contents_status_publish_idx (status, publish_at),
  KEY contents_group_idx (group_id),
  CONSTRAINT contents_group_fk FOREIGN KEY (group_id) REFERENCES article_groups(id) ON DELETE SET NULL,
  CONSTRAINT contents_author_fk FOREIGN KEY (author_id) REFERENCES users(id)
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS media (
  id varchar(36) PRIMARY KEY,
  content_id varchar(36),
  path varchar(500) NOT NULL,
  mime_type varchar(120) NOT NULL,
  size_bytes int NOT NULL,
  alt_text varchar(240),
  uploaded_by varchar(36) NOT NULL,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY media_content_idx (content_id),
  CONSTRAINT media_content_fk FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE,
  CONSTRAINT media_uploader_fk FOREIGN KEY (uploaded_by) REFERENCES users(id)
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS chat_conversations (
  id varchar(36) PRIMARY KEY,
  user_id varchar(36) NOT NULL,
  title varchar(200) NOT NULL,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at datetime NULL,
  KEY chat_conversations_user_idx (user_id),
  CONSTRAINT chat_conversations_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS chat_messages (
  id varchar(36) PRIMARY KEY,
  conversation_id varchar(36) NOT NULL,
  role enum('USER','ASSISTANT') NOT NULL,
  content text NOT NULL,
  metric_refs longtext,
  filter_snapshot longtext,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY chat_messages_conversation_idx (conversation_id),
  CONSTRAINT chat_messages_conversation_fk FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS audit_logs (
  id varchar(36) PRIMARY KEY,
  actor_id varchar(36),
  action varchar(100) NOT NULL,
  entity_type varchar(80) NOT NULL,
  entity_id varchar(80),
  metadata longtext,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY audit_logs_actor_idx (actor_id),
  CONSTRAINT audit_logs_actor_fk FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL
);
