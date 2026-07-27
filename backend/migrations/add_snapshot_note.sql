-- Adds the free-text note captured during the monthly check-in.
-- SQLModel's create_all() creates missing tables but never ALTERs existing
-- ones, so this must be run by hand against production Postgres.
-- Safe to run multiple times.

ALTER TABLE networthsnapshot ADD COLUMN IF NOT EXISTS note VARCHAR(280);
