-- internal msgs / supabase schema

-- Enable UUID extension
create extension if not exists "uuid-ossp";

--------------------------------------------------------------------------------
-- TABLES
--------------------------------------------------------------------------------

-- profiles (extends auth.users)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  avatar_url text,
  status text default 'offline',
  role text default 'user',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- workspaces
create table workspaces (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text unique not null,
  owner_id uuid references profiles(id) on delete cascade not null,
  logo_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- workspace_members
create table workspace_members (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references workspaces(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  role text default 'member',
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(workspace_id, user_id)
);

-- channels
create table channels (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references workspaces(id) on delete cascade not null,
  name text not null,
  description text,
  is_private boolean default false,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- channel_members
create table channel_members (
  id uuid primary key default uuid_generate_v4(),
  channel_id uuid references channels(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  last_read_at timestamp with time zone default timezone('utc'::text, now()),
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(channel_id, user_id)
);

-- messages
create table messages (
  id uuid primary key default uuid_generate_v4(),
  channel_id uuid references channels(id) on delete cascade not null,
  sender_id uuid references profiles(id) on delete cascade not null,
  parent_id uuid references messages(id) on delete cascade,
  content text not null,
  attachments jsonb default '[]'::jsonb,
  is_edited boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- reactions
create table reactions (
  id uuid primary key default uuid_generate_v4(),
  message_id uuid references messages(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  emoji text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(message_id, user_id, emoji)
);

-- files
create table files (
  id uuid primary key default uuid_generate_v4(),
  message_id uuid references messages(id) on delete cascade,
  uploaded_by uuid references profiles(id) on delete cascade not null,
  file_name text not null,
  file_url text not null,
  mime_type text,
  size_bytes bigint,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

--------------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS)
--------------------------------------------------------------------------------

alter table profiles enable row level security;
alter table workspaces enable row level security;
alter table workspace_members enable row level security;
alter table channels enable row level security;
alter table channel_members enable row level security;
alter table messages enable row level security;
alter table reactions enable row level security;
alter table files enable row level security;

-- Profiles: Anyone can read profiles. Users can update their own.
create policy "Anyone can read profiles" on profiles for select using (true);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Workspaces: Users can read workspaces they belong to
create policy "Users can read workspaces they belong to" on workspaces for select using (
  exists (
    select 1 from workspace_members wm 
    where wm.workspace_id = workspaces.id and wm.user_id = auth.uid()
  )
);
create policy "Workspace owners can update" on workspaces for update using (auth.uid() = owner_id);

-- Workspace Members: Users can read members of their workspaces
create policy "Users can read members of their workspaces" on workspace_members for select using (
  exists (
    select 1 from workspace_members wm 
    where wm.workspace_id = workspace_members.workspace_id and wm.user_id = auth.uid()
  )
);

-- Channels: Users can read channels they are a member of, or public channels in their workspace
create policy "Users can read channels" on channels for select using (
  (not is_private and exists (
    select 1 from workspace_members wm where wm.workspace_id = channels.workspace_id and wm.user_id = auth.uid()
  )) or
  exists (
    select 1 from channel_members cm where cm.channel_id = channels.id and cm.user_id = auth.uid()
  )
);

-- Channel Members: Users can read channel members
create policy "Users can read channel members" on channel_members for select using (
  exists (
    select 1 from channel_members cm where cm.channel_id = channel_members.channel_id and cm.user_id = auth.uid()
  )
);
create policy "Users can update own channel member read state" on channel_members for update using (auth.uid() = user_id);

-- Messages: Users can see messages in channels they belong to
create policy "Users can read messages in their channels" on messages for select using (
  exists (
    select 1 from channel_members cm where cm.channel_id = messages.channel_id and cm.user_id = auth.uid()
  )
);
-- Messages: Users can insert their own messages into channels they belong to
create policy "Users can insert own messages" on messages for insert with check (
  auth.uid() = sender_id and
  exists (
    select 1 from channel_members cm where cm.channel_id = messages.channel_id and cm.user_id = auth.uid()
  )
);
-- Messages: Users can update their own messages
create policy "Users can update own messages" on messages for update using (auth.uid() = sender_id);
-- Messages: Users can delete their own messages
create policy "Users can delete own messages" on messages for delete using (auth.uid() = sender_id);

-- Reactions: Similar to messages
create policy "Users can read reactions in their channels" on reactions for select using (
  exists (
    select 1 from messages m
    join channel_members cm on m.channel_id = cm.channel_id
    where m.id = reactions.message_id and cm.user_id = auth.uid()
  )
);
create policy "Users can insert own reactions" on reactions for insert with check (
  auth.uid() = user_id and
  exists (
    select 1 from messages m
    join channel_members cm on m.channel_id = cm.channel_id
    where m.id = reactions.message_id and cm.user_id = auth.uid()
  )
);
create policy "Users can delete own reactions" on reactions for delete using (auth.uid() = user_id);

-- Files: Users can see files in their channels
create policy "Users can read files in their channels" on files for select using (
  exists (
    select 1 from messages m
    join channel_members cm on m.channel_id = cm.channel_id
    where m.id = files.message_id and cm.user_id = auth.uid()
  )
);


--------------------------------------------------------------------------------
-- STORAGE & BUCKETS
--------------------------------------------------------------------------------
insert into storage.buckets (id, name, public) values ('chat-files', 'chat-files', true) on conflict do nothing;

create policy "Authenticated users can upload files" on storage.objects for insert with check (
  auth.role() = 'authenticated' and bucket_id = 'chat-files'
);

create policy "Anyone can read files" on storage.objects for select using (
  bucket_id = 'chat-files'
);

--------------------------------------------------------------------------------
-- TRIGGERS & FUNCTIONS
--------------------------------------------------------------------------------

-- Trigger to create profile on sign up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Trigger to update message updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger update_messages_updated_at
before update on messages
for each row execute procedure update_updated_at_column();

--------------------------------------------------------------------------------
-- REALTIME
--------------------------------------------------------------------------------
-- Enable realtime on tables
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table reactions;
alter publication supabase_realtime add table channel_members;
alter publication supabase_realtime add table profiles;
