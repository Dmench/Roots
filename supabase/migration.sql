-- ============================================================
-- Migration: add missing profile columns + directory read policy
-- Run this in Supabase SQL Editor → New query → Run
-- Safe to run multiple times (uses IF NOT EXISTS / DROP IF EXISTS)
-- ============================================================

alter table public.profiles
  add column if not exists neighborhood      text,
  add column if not exists languages         text[]  default '{}',
  add column if not exists show_in_directory boolean default true;

-- Allow settlers to see each other in the directory
-- (existing policy only allows selecting your own row — breaks /people page)
drop policy if exists "profiles_select_directory" on public.profiles;
create policy "profiles_select_directory" on public.profiles
  for select using (show_in_directory = true);
