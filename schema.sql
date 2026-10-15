create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default 'مستخدم',
  role text not null default 'deaf' check (role in ('deaf','hearing')),
  sign_dialect text default 'لغة الإشارة المصرية / العربية الموحدة',
  bio text default '',
  created_at timestamptz default now()
);
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  sender_role text, original_mode text, text text not null, sign_gloss text,
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;
alter table public.messages enable row level security;
create policy "profiles: read" on public.profiles for select to authenticated using (true);
create policy "profiles: update own" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create policy "messages: read own" on public.messages for select to authenticated using (auth.uid() in (sender_id, receiver_id));
create policy "messages: send as self" on public.messages for insert to authenticated with check (auth.uid() = sender_id);

create function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'name','مستخدم'), coalesce(new.raw_user_meta_data->>'role','deaf'));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

alter publication supabase_realtime add table public.messages;
