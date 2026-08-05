CREATE TABLE IF NOT EXISTS content_reads (
  id varchar(36) PRIMARY KEY,
  user_id varchar(36) NOT NULL,
  content_id varchar(36) NOT NULL,
  read_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY content_reads_user_content_uq (user_id, content_id),
  KEY content_reads_user_idx (user_id),
  KEY content_reads_content_idx (content_id),
  CONSTRAINT content_reads_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT content_reads_content_fk FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE
);
