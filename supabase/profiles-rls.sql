-- Run this in Supabase: SQL Editor → New query → paste → Run
-- Enables the app to create/update the current user's profile on login (fixes pets FK).

create policy "Users can manage own profile"
on public.profiles
for all
using (auth.uid() = id)
with check (auth.uid() = id);
