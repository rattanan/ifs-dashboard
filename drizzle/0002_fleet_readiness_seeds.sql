CREATE TABLE IF NOT EXISTS fleet_readiness_seeds (
  id varchar(36) PRIMARY KEY,
  site varchar(10) NOT NULL,
  snapshot json NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at datetime NULL,
  UNIQUE KEY fleet_readiness_seeds_site_uq (site),
  KEY fleet_readiness_seeds_active_idx (active)
);
