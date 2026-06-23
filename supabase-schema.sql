-- Run this in the Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- Vault entries table
create table if not exists public.vault_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  username text not null,
  encrypted_password text not null,
  url text,
  category text not null default 'other' check (category in ('web', 'app', 'email', 'social', 'banking', 'server', 'other')),
  notes text,
  favorite boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Row Level Security: each user only sees their own entries
alter table public.vault_entries enable row level security;

create policy "Users can view their own entries"
  on public.vault_entries for select
  using (auth.uid() = user_id);

create policy "Users can insert their own entries"
  on public.vault_entries for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own entries"
  on public.vault_entries for update
  using (auth.uid() = user_id);

create policy "Users can delete their own entries"
  on public.vault_entries for delete
  using (auth.uid() = user_id);

-- Index for performance
create index if not exists vault_entries_user_id_idx on public.vault_entries(user_id);
create index if not exists vault_entries_category_idx on public.vault_entries(user_id, category);
