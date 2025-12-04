-- Migration 002: Change ip_hash to ip_address
-- Store raw IP for analytics instead of hash

-- SQLite doesn't support ALTER COLUMN, so we rename and recreate
-- Since this is early in development, we can just rename the column

ALTER TABLE ratings RENAME COLUMN ip_hash TO ip_address;
