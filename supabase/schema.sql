-- ═══════════════════════════════════════════════════════
--  SANCHOS REAL ESTATE CRM — Supabase Database Schema
-- ═══════════════════════════════════════════════════════
-- Run this entire file in: Supabase Dashboard → SQL Editor → Run

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ────────────────────────────────────────────────────────
-- 1. PROFILES  (extends Supabase auth.users)
-- ────────────────────────────────────────────────────────
create table public.profiles (
  id          uuid references auth.users(id) on delete cascade primary key,
  full_name   text not null,
  phone       text,
  role        text check (role in ('admin','agent','manager')) default 'agent',
  avatar_url  text,
  created_at  timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'New User'),
    new.raw_user_meta_data->>'phone',
    coalesce(new.raw_user_meta_data->>'role', 'agent')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ────────────────────────────────────────────────────────
-- 2. LEADS
-- ────────────────────────────────────────────────────────
create table public.leads (
  id            uuid default uuid_generate_v4() primary key,
  agent_id      uuid references public.profiles(id) on delete set null,
  full_name     text not null,
  phone         text,
  email         text,
  location      text,
  budget        numeric(12,2),
  interest      text,                      -- e.g. "3-bed apt, Bole"
  stage         text not null default 'new_lead'
                check (stage in (
                  'new_lead','contacted','interested',
                  'property_visit','negotiation','closed','lost'
                )),
  source        text check (source in (
                  'referral','website','social','walk_in','cold_call','other'
                )),
  notes         text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

alter table public.leads enable row level security;

create policy "Agents see own leads, admins see all"
  on public.leads for select using (
    auth.uid() = agent_id
    or exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin','manager')
    )
  );

create policy "Agents can insert their own leads"
  on public.leads for insert with check (auth.uid() = agent_id);

create policy "Agents can update their own leads"
  on public.leads for update using (auth.uid() = agent_id);

create policy "Agents can delete their own leads"
  on public.leads for delete using (auth.uid() = agent_id);

-- auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger leads_updated_at
  before update on public.leads
  for each row execute function public.set_updated_at();

-- ────────────────────────────────────────────────────────
-- 3. PROPERTIES
-- ────────────────────────────────────────────────────────
create table public.properties (
  id            uuid default uuid_generate_v4() primary key,
  agent_id      uuid references public.profiles(id) on delete set null,
  title         text not null,
  address       text,
  city          text default 'Addis Ababa',
  price         numeric(12,2),
  price_type    text check (price_type in ('sale','rent')) default 'sale',
  status        text check (status in ('available','sold','rented')) default 'available',
  bedrooms      int,
  bathrooms     int,
  area_sqm      numeric(8,2),
  description   text,
  images        text[],
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

alter table public.properties enable row level security;

create policy "Everyone can view properties"
  on public.properties for select using (true);

create policy "Agents can manage own properties"
  on public.properties for all using (auth.uid() = agent_id);

create trigger properties_updated_at
  before update on public.properties
  for each row execute function public.set_updated_at();

-- ────────────────────────────────────────────────────────
-- 4. ACTIVITIES
-- ────────────────────────────────────────────────────────
create table public.activities (
  id            uuid default uuid_generate_v4() primary key,
  agent_id      uuid references public.profiles(id) on delete cascade,
  lead_id       uuid references public.leads(id) on delete set null,
  type          text check (type in (
                  'call','meeting','site_visit','follow_up',
                  'contract','other'
                )) not null,
  title         text not null,
  notes         text,
  scheduled_at  timestamptz not null,
  completed     boolean default false,
  created_at    timestamptz default now()
);

alter table public.activities enable row level security;

create policy "Agents see own activities"
  on public.activities for select using (auth.uid() = agent_id);

create policy "Agents can manage own activities"
  on public.activities for all using (auth.uid() = agent_id);

-- ────────────────────────────────────────────────────────
-- 5. DASHBOARD STATS VIEW  (read-only computed)
-- ────────────────────────────────────────────────────────
create or replace view public.dashboard_stats as
select
  agent_id,
  count(*) filter (where date_trunc('month', created_at) = date_trunc('month', now()))
    as leads_this_month,
  count(*) filter (where stage = 'new_lead')   as new_leads,
  count(*) filter (where stage = 'closed')     as closed_deals,
  count(*) filter (where stage not in ('lost','closed')) as active_pipeline,
  round(
    count(*) filter (where stage = 'closed')::numeric
    / nullif(count(*), 0) * 100, 1
  ) as conversion_rate
from public.leads
group by agent_id;

-- ────────────────────────────────────────────────────────
-- 6. SEED DATA  (optional demo data)
-- ────────────────────────────────────────────────────────
-- Uncomment after creating your first user account and
-- replace 'YOUR_USER_UUID' with your actual user id from auth.users

/*
insert into public.leads (agent_id, full_name, phone, location, budget, stage, source, interest) values
  ('YOUR_USER_UUID', 'Abebe Alemu',    '+251911111111', 'Bole, Addis Ababa',     180000, 'new_lead',      'referral', '3-bed apartment'),
  ('YOUR_USER_UUID', 'Meseret Araya',  '+251922222222', 'Ayat, Addis Ababa',     95000,  'contacted',     'website',  '2-bed apartment'),
  ('YOUR_USER_UUID', 'Tewodros Samuel','+251933333333', 'CMC, Addis Ababa',      250000, 'interested',    'social',   'Investment property'),
  ('YOUR_USER_UUID', 'Hanna Tesfaye',  '+251944444444', 'Sarbet, Addis Ababa',   75000,  'property_visit','walk_in',  'Rental apartment'),
  ('YOUR_USER_UUID', 'Bereket Girma',  '+251955555555', 'Bole Lemi, Addis Ababa',400000, 'negotiation',   'referral', 'Villa'),
  ('YOUR_USER_UUID', 'Yewubdar Wolde', '+251966666666', 'Megenagna, Addis Ababa',500000, 'closed',        'cold_call','Commercial space');

insert into public.properties (agent_id, title, address, price, price_type, bedrooms, bathrooms, area_sqm) values
  ('YOUR_USER_UUID', 'Bole Atlas Condo',      'Bole, Addis Ababa',      245000, 'sale', 3, 2, 148),
  ('YOUR_USER_UUID', 'CMC Residence Villa',   'CMC, Addis Ababa',       1200,   'rent', 4, 3, 220),
  ('YOUR_USER_UUID', 'Kazanchis Office Suite','Kazanchis, Addis Ababa', 380000, 'sale', null, null, 340),
  ('YOUR_USER_UUID', 'Sarbet Family Home',    'Sarbet, Addis Ababa',    195000, 'sale', 5, 4, 310);
*/

-- ────────────────────────────────────────────────────────
-- 7. STORAGE BUCKET (property images)
-- ────────────────────────────────────────────────────────
-- Run in Supabase Dashboard → Storage → Create bucket
-- Name: property-images, Public: true

-- Then run these policies:
insert into storage.buckets (id, name, public)
  values ('property-images', 'property-images', true)
  on conflict do nothing;

create policy "Anyone can view property images"
  on storage.objects for select
  using (bucket_id = 'property-images');

create policy "Authenticated users can upload"
  on storage.objects for insert
  with check (bucket_id = 'property-images' and auth.role() = 'authenticated');

create policy "Owners can delete their images"
  on storage.objects for delete
  using (bucket_id = 'property-images' and auth.uid()::text = (storage.foldername(name))[1]);

-- ────────────────────────────────────────────────────────
-- 8. NOTIFICATIONS TABLE
-- ────────────────────────────────────────────────────────
create table public.notifications (
  id         uuid default uuid_generate_v4() primary key,
  user_id    uuid references public.profiles(id) on delete cascade,
  title      text not null,
  body       text,
  read       boolean default false,
  type       text default 'info',
  lead_id    uuid references public.leads(id) on delete set null,
  created_at timestamptz default now()
);

alter table public.notifications enable row level security;

create policy "Users see own notifications"
  on public.notifications for select using (auth.uid() = user_id);

create policy "Users can update own notifications"
  on public.notifications for update using (auth.uid() = user_id);

-- Auto-notify on new lead assigned
create or replace function public.notify_on_lead_insert()
returns trigger language plpgsql security definer as $$
begin
  insert into public.notifications (user_id, title, body, type, lead_id)
  values (
    new.agent_id,
    'New lead assigned',
    'You have a new lead: ' || new.full_name,
    'lead',
    new.id
  );
  return new;
end;
$$;

create trigger on_lead_insert
  after insert on public.leads
  for each row when (new.agent_id is not null)
  execute function public.notify_on_lead_insert();
