-- Run this in Supabase: SQL Editor → New query → paste → Run
-- Lets authenticated users create and manage their own pets (required if RLS is enabled on public.pets).

-- Enable RLS on pets if not already (no-op if already on)
alter table public.pets enable row level security;

-- Allow users to insert pets where they are the owner
drop policy if exists "Users can insert own pets" on public.pets;
create policy "Users can insert own pets"
on public.pets
for insert
to authenticated
with check (auth.uid() = owner_id);

-- Allow users to select/update/delete their own pets
drop policy if exists "Users can manage own pets" on public.pets;
create policy "Users can manage own pets"
on public.pets
for all
to authenticated
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);
