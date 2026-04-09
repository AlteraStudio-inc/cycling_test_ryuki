create extension if not exists "uuid-ossp";

create type public.app_role as enum ('admin', 'employee');
create type public.room_type as enum ('global', 'direct');

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.app_role not null default 'employee',
  name text not null,
  employee_code text unique,
  phone text,
  department text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.shifts (
  id uuid primary key default uuid_generate_v4(),
  employee_id uuid not null references public.profiles (id) on delete cascade,
  shift_date date not null,
  start_time time not null,
  end_time time not null,
  shift_type text not null,
  note text,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shifts_time_order check (start_time < end_time)
);

create table if not exists public.chat_rooms (
  id uuid primary key default uuid_generate_v4(),
  room_type public.room_type not null,
  created_at timestamptz not null default now()
);

create table if not exists public.direct_room_members (
  id uuid primary key default uuid_generate_v4(),
  room_id uuid not null references public.chat_rooms (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint direct_room_members_unique unique (room_id, user_id)
);

create table if not exists public.messages (
  id uuid primary key default uuid_generate_v4(),
  room_id uuid not null references public.chat_rooms (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  read_flag boolean not null default false
);

create index if not exists idx_profiles_role on public.profiles (role);
create index if not exists idx_shifts_employee_date on public.shifts (employee_id, shift_date);
create index if not exists idx_shifts_date on public.shifts (shift_date);
create index if not exists idx_messages_room_created_at on public.messages (room_id, created_at desc);
create index if not exists idx_direct_room_members_user_id on public.direct_room_members (user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists shifts_set_updated_at on public.shifts;
create trigger shifts_set_updated_at
before update on public.shifts
for each row
execute function public.set_updated_at();

create or replace function public.is_admin(user_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = user_id and role = 'admin'
  );
$$;

create or replace function public.user_can_access_room(target_room_id uuid, user_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.chat_rooms cr
    where cr.id = target_room_id
      and (
        cr.room_type = 'global'
        or exists (
          select 1
          from public.direct_room_members drm
          where drm.room_id = cr.id
            and drm.user_id = user_id
        )
      )
  );
$$;

create or replace function public.check_shift_overlap()
returns trigger
language plpgsql
as $$
begin
  if exists (
    select 1
    from public.shifts s
    where s.employee_id = new.employee_id
      and s.shift_date = new.shift_date
      and s.id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000')
      and new.start_time < s.end_time
      and new.end_time > s.start_time
  ) then
    raise exception 'Shift overlaps with an existing shift';
  end if;

  return new;
end;
$$;

drop trigger if exists shifts_prevent_overlap on public.shifts;
create trigger shifts_prevent_overlap
before insert or update on public.shifts
for each row
execute function public.check_shift_overlap();

insert into public.chat_rooms (room_type)
select 'global'
where not exists (
  select 1 from public.chat_rooms where room_type = 'global'
);

alter table public.profiles enable row level security;
alter table public.shifts enable row level security;
alter table public.chat_rooms enable row level security;
alter table public.direct_room_members enable row level security;
alter table public.messages enable row level security;

create policy "profiles_select_self_or_admin"
on public.profiles
for select
using (auth.uid() = id or public.is_admin(auth.uid()));

create policy "profiles_insert_admin_only"
on public.profiles
for insert
with check (public.is_admin(auth.uid()) or auth.uid() = id);

create policy "profiles_update_self_or_admin"
on public.profiles
for update
using (auth.uid() = id or public.is_admin(auth.uid()))
with check (auth.uid() = id or public.is_admin(auth.uid()));

create policy "profiles_delete_admin_only"
on public.profiles
for delete
using (public.is_admin(auth.uid()));

create policy "shifts_select_self_or_admin"
on public.shifts
for select
using (employee_id = auth.uid() or public.is_admin(auth.uid()));

create policy "shifts_insert_admin_only"
on public.shifts
for insert
with check (public.is_admin(auth.uid()));

create policy "shifts_update_admin_only"
on public.shifts
for update
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy "shifts_delete_admin_only"
on public.shifts
for delete
using (public.is_admin(auth.uid()));

create policy "chat_rooms_select_member_or_global"
on public.chat_rooms
for select
using (
  room_type = 'global'
  or exists (
    select 1
    from public.direct_room_members drm
    where drm.room_id = id
      and drm.user_id = auth.uid()
  )
  or public.is_admin(auth.uid())
);

create policy "chat_rooms_insert_admin_only"
on public.chat_rooms
for insert
with check (public.is_admin(auth.uid()));

create policy "direct_room_members_select_member_or_admin"
on public.direct_room_members
for select
using (user_id = auth.uid() or public.is_admin(auth.uid()));

create policy "direct_room_members_manage_admin_only"
on public.direct_room_members
for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy "messages_select_room_member"
on public.messages
for select
using (public.user_can_access_room(room_id, auth.uid()));

create policy "messages_insert_room_member"
on public.messages
for insert
with check (
  sender_id = auth.uid()
  and public.user_can_access_room(room_id, auth.uid())
);

create policy "messages_update_sender_or_admin"
on public.messages
for update
using (sender_id = auth.uid() or public.is_admin(auth.uid()))
with check (sender_id = auth.uid() or public.is_admin(auth.uid()));

drop publication if exists supabase_realtime_messages;
create publication supabase_realtime_messages for table public.messages;
