-- Run this in Supabase: SQL Editor → New query → paste → Run
-- Adds a weight column to the pets table so the Add Pet form can save weight.

alter table public.pets
add column if not exists weight numeric;

comment on column public.pets.weight is 'Pet weight in the unit specified by weight_unit (e.g. kg or lb)';
