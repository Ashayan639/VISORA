-- ─────────────────────────────────────────────────────────────
-- VISORA — Supabase schema (HACKATHON MODE)
--
-- How to apply:
--   1. Open your Supabase project → SQL Editor.
--   2. Paste this file and run.
--   3. Re-running is safe (uses IF NOT EXISTS / DROP POLICY IF EXISTS).
--
-- ⚠️  RLS policies below grant full read/write to BOTH anon and authenticated
-- roles. This is intentional for hackathon speed. Tighten before production.
-- ─────────────────────────────────────────────────────────────

-- gen_random_uuid() is built into PostgreSQL 13+ (Supabase uses 15+),
-- so no extension is required. Kept here as a no-op safety net.
create extension if not exists pgcrypto;

-- ─────────────────────────────────────────────────────────────
-- Tables
-- ─────────────────────────────────────────────────────────────

create table if not exists projects (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  input_type      text,
  startup_idea    text,
  website_url     text,
  industry        text,
  target_audience text,
  location        text,
  brand_style     text,
  product_type    text,
  -- Added beyond the original spec to capture the full UserInput type.
  visual_mood     text,
  brand_result    jsonb,
  trust_score     jsonb,
  website_concept jsonb,
  marketing_pack  jsonb,
  -- Conversation snapshot for resume-from-gallery (optional).
  chat_messages   jsonb,
  session_id        text
);

-- Safe migration for existing Supabase projects (re-run in SQL Editor):
alter table projects add column if not exists chat_messages jsonb;
alter table projects add column if not exists session_id text;

create table if not exists visuals (
  id                uuid primary key default gen_random_uuid(),
  project_id        uuid references projects(id) on delete cascade,
  visual_type       text,
  title             text,
  prompt            text,
  image_url         text,
  -- Kept in addition to the spec columns so we can surface load states
  -- and partial failures when rendering image grids.
  status            text,
  created_at        timestamptz not null default now()
);

create table if not exists models_3d (
  id                uuid primary key default gen_random_uuid(),
  project_id        uuid references projects(id) on delete cascade,
  model_type        text,
  prompt            text,
  source_image_url  text,
  model_url         text,
  status            text,
  created_at        timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────────────────────────

create index if not exists projects_created_at_idx
  on projects (created_at desc);

create index if not exists visuals_project_id_idx
  on visuals (project_id);

create index if not exists models_3d_project_id_idx
  on models_3d (project_id);

-- ─────────────────────────────────────────────────────────────
-- Row Level Security — HACKATHON MODE
-- Anyone (anon + authenticated) can read/write. Tighten later.
-- ─────────────────────────────────────────────────────────────

alter table projects   enable row level security;
alter table visuals    enable row level security;
alter table models_3d  enable row level security;

drop policy if exists "hackathon_all_access" on projects;
create policy "hackathon_all_access"
  on projects
  for all
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "hackathon_all_access" on visuals;
create policy "hackathon_all_access"
  on visuals
  for all
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "hackathon_all_access" on models_3d;
create policy "hackathon_all_access"
  on models_3d
  for all
  to anon, authenticated
  using (true)
  with check (true);
