-- PROFILES
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text not null,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy "Profiles are viewable by authenticated users"
  on public.profiles for select to authenticated using (true);
create policy "Users can insert own profile"
  on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "Users can update own profile"
  on public.profiles for update to authenticated using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  base_username text;
  final_username text;
  counter int := 0;
begin
  base_username := lower(regexp_replace(coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)), '[^a-z0-9_]', '', 'g'));
  if base_username = '' then base_username := 'user'; end if;
  final_username := base_username;
  while exists (select 1 from public.profiles where username = final_username) loop
    counter := counter + 1;
    final_username := base_username || counter::text;
  end loop;

  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    final_username,
    coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name', final_username),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- EVENTS
create table public.events (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  location text,
  scheduled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.events enable row level security;
create policy "Events viewable by authenticated"
  on public.events for select to authenticated using (true);
create policy "Authenticated can create events"
  on public.events for insert to authenticated with check (auth.uid() = host_id);
create policy "Hosts can update own events"
  on public.events for update to authenticated using (auth.uid() = host_id);
create policy "Hosts can delete own events"
  on public.events for delete to authenticated using (auth.uid() = host_id);
create trigger events_updated_at before update on public.events
  for each row execute function public.set_updated_at();

-- RSVPs
create type public.rsvp_status as enum ('going', 'maybe', 'no');
create table public.rsvps (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status public.rsvp_status not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(event_id, user_id)
);
alter table public.rsvps enable row level security;
create policy "RSVPs viewable by authenticated"
  on public.rsvps for select to authenticated using (true);
create policy "Users insert own rsvp"
  on public.rsvps for insert to authenticated with check (auth.uid() = user_id);
create policy "Users update own rsvp"
  on public.rsvps for update to authenticated using (auth.uid() = user_id);
create policy "Users delete own rsvp"
  on public.rsvps for delete to authenticated using (auth.uid() = user_id);
create trigger rsvps_updated_at before update on public.rsvps
  for each row execute function public.set_updated_at();

-- TIME PROPOSALS + VOTES
create table public.time_proposals (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  proposed_by uuid not null references auth.users(id) on delete cascade,
  proposed_time timestamptz not null,
  label text,
  created_at timestamptz not null default now()
);
alter table public.time_proposals enable row level security;
create policy "Proposals viewable by authenticated"
  on public.time_proposals for select to authenticated using (true);
create policy "Authenticated can propose"
  on public.time_proposals for insert to authenticated with check (auth.uid() = proposed_by);
create policy "Proposer can delete"
  on public.time_proposals for delete to authenticated using (auth.uid() = proposed_by);

create table public.time_votes (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.time_proposals(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(proposal_id, user_id)
);
alter table public.time_votes enable row level security;
create policy "Votes viewable by authenticated"
  on public.time_votes for select to authenticated using (true);
create policy "Users insert own vote"
  on public.time_votes for insert to authenticated with check (auth.uid() = user_id);
create policy "Users delete own vote"
  on public.time_votes for delete to authenticated using (auth.uid() = user_id);

-- TASKS
create type public.task_priority as enum ('high', 'med', 'low');
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  assigned_to uuid references auth.users(id) on delete set null,
  task_name text not null,
  priority public.task_priority not null default 'med',
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.tasks enable row level security;
create policy "Tasks viewable by authenticated"
  on public.tasks for select to authenticated using (true);
create policy "Authenticated can create tasks"
  on public.tasks for insert to authenticated with check (auth.uid() = created_by);
create policy "Creator or assignee can update"
  on public.tasks for update to authenticated using (auth.uid() = created_by or auth.uid() = assigned_to);
create policy "Creator can delete"
  on public.tasks for delete to authenticated using (auth.uid() = created_by);
create trigger tasks_updated_at before update on public.tasks
  for each row execute function public.set_updated_at();

-- FRIENDSHIPS
create type public.friendship_status as enum ('pending', 'accepted', 'declined');
create table public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users(id) on delete cascade,
  addressee_id uuid not null references auth.users(id) on delete cascade,
  status public.friendship_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(requester_id, addressee_id),
  check (requester_id <> addressee_id)
);
alter table public.friendships enable row level security;
create policy "Friendships viewable by parties"
  on public.friendships for select to authenticated
  using (auth.uid() = requester_id or auth.uid() = addressee_id);
create policy "Users send friend requests"
  on public.friendships for insert to authenticated with check (auth.uid() = requester_id);
create policy "Addressee or requester updates"
  on public.friendships for update to authenticated
  using (auth.uid() = addressee_id or auth.uid() = requester_id);
create policy "Parties can delete"
  on public.friendships for delete to authenticated
  using (auth.uid() = requester_id or auth.uid() = addressee_id);
create trigger friendships_updated_at before update on public.friendships
  for each row execute function public.set_updated_at();

-- CONVERSATIONS + MESSAGES
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  title text,
  event_id uuid references public.events(id) on delete set null,
  is_direct boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.conversations enable row level security;

create table public.conversation_members (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);
alter table public.conversation_members enable row level security;

-- helper to avoid recursion
create or replace function public.is_conversation_member(_conv uuid, _user uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.conversation_members where conversation_id = _conv and user_id = _user);
$$;

create policy "Members view conversation"
  on public.conversations for select to authenticated
  using (public.is_conversation_member(id, auth.uid()));
create policy "Authenticated can create conversations"
  on public.conversations for insert to authenticated with check (true);

create policy "Members view membership"
  on public.conversation_members for select to authenticated
  using (public.is_conversation_member(conversation_id, auth.uid()));
create policy "Users can join conversations they create"
  on public.conversation_members for insert to authenticated with check (auth.uid() = user_id or public.is_conversation_member(conversation_id, auth.uid()));
create policy "Users can leave"
  on public.conversation_members for delete to authenticated using (auth.uid() = user_id);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);
alter table public.messages enable row level security;
create policy "Members view messages"
  on public.messages for select to authenticated
  using (public.is_conversation_member(conversation_id, auth.uid()));
create policy "Members send messages"
  on public.messages for insert to authenticated
  with check (auth.uid() = sender_id and public.is_conversation_member(conversation_id, auth.uid()));
create policy "Sender can delete"
  on public.messages for delete to authenticated using (auth.uid() = sender_id);

create index on public.events (scheduled_at);
create index on public.rsvps (event_id);
create index on public.tasks (event_id);
create index on public.messages (conversation_id, created_at);
create index on public.friendships (addressee_id, status);