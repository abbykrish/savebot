-- SaveBot schema — run in Supabase SQL Editor
-- Uses existing Supabase auth (auth.users)

-- Drop old Stash tables if they exist
drop table if exists save_tags cascade;
drop table if exists tags cascade;
drop table if exists saves cascade;
drop table if exists folders cascade;

-- Folders
create table folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  color text,
  is_auto boolean default false,
  source_tag_id uuid,
  created_at timestamptz default now()
);

alter table folders enable row level security;
create policy "Users manage own folders" on folders
  for all using (auth.uid() = user_id);

-- Saves
create table saves (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  url text not null,
  title text not null default '',
  content text,
  content_markdown text,
  excerpt text,
  highlight text,
  summary text,
  notes text,
  site_name text,
  author text,
  image_url text,
  word_count integer,
  source_type text not null default 'article' check (source_type in ('article', 'pdf', 'highlight')),
  ai_status text not null default 'pending' check (ai_status in ('pending', 'processing', 'done', 'failed')),
  folder_id uuid references folders(id) on delete set null,
  is_archived boolean default false,
  is_favorite boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table saves enable row level security;
create policy "Users manage own saves" on saves
  for all using (auth.uid() = user_id);

-- Tags
create table tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  color text,
  is_auto boolean default false,
  created_at timestamptz default now(),
  unique(user_id, name)
);

alter table tags enable row level security;
create policy "Users manage own tags" on tags
  for all using (auth.uid() = user_id);

-- Save-Tags junction
create table save_tags (
  save_id uuid references saves(id) on delete cascade not null,
  tag_id uuid references tags(id) on delete cascade not null,
  primary key (save_id, tag_id)
);

alter table save_tags enable row level security;
create policy "Users manage own save_tags" on save_tags
  for all using (
    exists (select 1 from saves where saves.id = save_id and saves.user_id = auth.uid())
  );

-- Full-text search index
alter table saves add column if not exists fts tsvector
  generated always as (
    to_tsvector('english',
      coalesce(title, '') || ' ' ||
      coalesce(summary, '') || ' ' ||
      coalesce(notes, '') || ' ' ||
      coalesce(excerpt, '')
    )
  ) stored;

create index saves_fts_idx on saves using gin(fts);
create index saves_user_id_idx on saves(user_id);
create index saves_created_at_idx on saves(created_at desc);
create index saves_folder_id_idx on saves(folder_id);

-- Full-text search function
create or replace function search_saves(search_query text, user_id_param uuid)
returns setof saves as $$
  select *
  from saves
  where user_id = user_id_param
    and fts @@ plainto_tsquery('english', search_query)
  order by ts_rank(fts, plainto_tsquery('english', search_query)) desc;
$$ language sql stable;

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger saves_updated_at
  before update on saves
  for each row execute function update_updated_at();
