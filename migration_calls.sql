create table public.sign_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  label text not null,
  frames jsonb not null,
  created_at timestamptz default now()
);
alter table public.sign_templates enable row level security;
create policy "templates: own" on public.sign_templates for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
