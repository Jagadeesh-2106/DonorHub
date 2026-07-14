-- ==========================================
-- 00_extensions.sql
-- ==========================================
-- Enable UUID extension for UUID generation
create extension if not exists "uuid-ossp";

-- ==========================================
-- 01_schema.sql
-- ==========================================
-- Profiles table
create table profiles (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  role text check (role in ('donor', 'hospital', 'admin')) not null,
  name text,
  phone text,
  created_at timestamp with time zone default timezone('utc', now()),
  updated_at timestamp with time zone default timezone('utc', now())
);

-- Donors table
create table donors (
  id uuid primary key references profiles(id) on delete cascade,
  blood_group text not null,
  availability_status boolean default true,
  city text,
  district text,
  created_at timestamp with time zone default timezone('utc', now()),
  updated_at timestamp with time zone default timezone('utc', now())
);

-- Hospitals table
create table hospitals (
  id uuid primary key references profiles(id) on delete cascade,
  hospital_name text not null,
  address text,
  city text,
  district text,
  contact_person text,
  created_at timestamp with time zone default timezone('utc', now()),
  updated_at timestamp with time zone default timezone('utc', now())
);

-- Blood Requests table
create table blood_requests (
  id uuid primary key default uuid_generate_v4(),
  hospital_id uuid references hospitals(id) on delete cascade,
  blood_group text not null,
  quantity integer not null,
  status text check (status in ('pending', 'completed', 'cancelled')) default 'pending' not null,
  created_at timestamp with time zone default timezone('utc', now()),
  updated_at timestamp with time zone default timezone('utc', now())
);

-- Request Responses table
create table request_responses (
  id uuid primary key default uuid_generate_v4(),
  request_id uuid references blood_requests(id) on delete cascade,
  donor_id uuid references donors(id) on delete cascade,
  response text check (response in ('accepted', 'declined')) not null,
  response_date timestamp with time zone default timezone('utc', now())
);

-- Notifications table
create table notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  type text not null,
  message text not null,
  read_status boolean default false,
  created_at timestamp with time zone default timezone('utc', now())
);

-- ==========================================
-- 02_enable_rls.sql
-- ==========================================
alter table profiles enable row level security;
alter table donors enable row level security;
alter table hospitals enable row level security;
alter table blood_requests enable row level security;
alter table request_responses enable row level security;
alter table notifications enable row level security;

-- ==========================================
-- 03_profiles_policies.sql
-- ==========================================
-- Allow select for all authenticated users
create policy "Allow select authenticated" on profiles for select using (
  auth.role() = 'authenticated'
);

-- Allow update only by owner
create policy "Allow update own" on profiles for update using (
  id = auth.uid()
);

-- ==========================================
-- 04_donors_policies.sql
-- ==========================================
create policy "Donors select authenticated" on donors for select using (
  auth.role() = 'authenticated'
);

create policy "Donors update own" on donors for update using (
  id = auth.uid()
);

create policy "Donors insert own" on donors for insert with check (
  id = auth.uid()
);

-- ==========================================
-- 05_hospitals_policies.sql
-- ==========================================
create policy "Hospitals select authenticated" on hospitals for select using (
  auth.role() = 'authenticated'
);

create policy "Hospitals update own" on hospitals for update using (
  id = auth.uid()
);

create policy "Hospitals insert own" on hospitals for insert with check (
  id = auth.uid()
);

-- ==========================================
-- 06_requests_policies.sql
-- ==========================================
create policy "Hospitals manage own requests" on blood_requests for all using (
  exists (
    select 1 from hospitals where id = hospital_id and id = auth.uid()
  )
);

create policy "Hospitals insert own requests" on blood_requests for insert with check (
  hospital_id = auth.uid()
);

-- Donors can select requests that match their blood group and availability
create policy "Donors select compatible requests" on blood_requests for select using (
  exists (
    select 1 from donors
    where id = auth.uid()
    and availability_status = true
    and blood_requests.blood_group in (
      select compatible_group from blood_compatibility(donors.blood_group)
    )
  )
);

-- ==========================================
-- 07_responses_policies.sql
-- ==========================================
-- Donors can insert/select/update their own responses
create policy "Donors manage own responses" on request_responses for all using (
  donor_id = auth.uid()
);

create policy "Hospitals view responses to their requests" on request_responses for select using (
  exists (
    select 1 from blood_requests where id = request_id and hospital_id = auth.uid()
  )
);

-- ==========================================
-- 08_notifications_policies.sql
-- ==========================================
create policy "Users access own notifications" on notifications for all using (
  user_id = auth.uid()
);

-- ==========================================
-- 09_compatibility_function.sql
-- ==========================================
create or replace function blood_compatibility(recipient text) returns table(compatible_group text) as $$
begin
  return query
  select unnest(array[
    case recipient
      when 'A+'  then array['A+', 'A-', 'O+', 'O-']
      when 'A-'  then array['A-', 'O-']
      when 'B+'  then array['B+', 'B-', 'O+', 'O-']
      when 'B-'  then array['B-', 'O-']
      when 'AB+' then array['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
      when 'AB-' then array['A-', 'B-', 'AB-', 'O-']
      when 'O+'  then array['O+', 'O-']
      when 'O-'  then array['O-']
      else array[]::text[]
    end
  ]);
end;
$$ language plpgsql stable;

-- ==========================================
-- 10_auth_trigger.sql
-- ==========================================
-- Trigger to insert a profile when a new auth user is created
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'donor'),
    coalesce(new.raw_user_meta_data->>'name', '')
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger definition
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ==========================================
-- 11_hospital_blood_inventory.sql
-- ==========================================
-- Create hospital_blood_inventory table
create table if not exists public.hospital_blood_inventory (
  id uuid primary key default uuid_generate_v4(),
  hospital_id uuid not null references public.hospitals(id) on delete cascade,
  blood_group text not null,
  quantity integer not null default 0,
  created_at timestamp with time zone default timezone('utc', now()),
  updated_at timestamp with time zone default timezone('utc', now()),
  constraint hospital_blood_inventory_quantity_check check (quantity >= 0),
  constraint hospital_blood_inventory_unique_group unique (hospital_id, blood_group)
);

-- Enable Row Level Security (RLS)
alter table public.hospital_blood_inventory enable row level security;

-- Allow select for all authenticated users (to search nearby blood banks)
create policy "Inventory select authenticated" on public.hospital_blood_inventory
  for select using (auth.role() = 'authenticated');

-- Allow hospitals to manage their own blood inventory
create policy "Hospitals insert own inventory" on public.hospital_blood_inventory
  for insert with check (hospital_id = auth.uid());

create policy "Hospitals update own inventory" on public.hospital_blood_inventory
  for update using (hospital_id = auth.uid());

create policy "Hospitals delete own inventory" on public.hospital_blood_inventory
  for delete using (hospital_id = auth.uid());

-- ==========================================
-- 12_inter_hospital_requests.sql
-- ==========================================
-- Create inter_hospital_requests table
create table if not exists public.inter_hospital_requests (
  id uuid primary key default uuid_generate_v4(),
  requester_id uuid not null references public.hospitals(id) on delete cascade,
  provider_id uuid not null references public.hospitals(id) on delete cascade,
  blood_group text not null,
  quantity integer not null,
  emergency_level text check (emergency_level in ('low', 'medium', 'high', 'critical')) not null,
  purpose text not null,
  status text check (status in ('pending', 'accepted', 'declined')) default 'pending' not null,
  created_at timestamp with time zone default timezone('utc', now()),
  updated_at timestamp with time zone default timezone('utc', now()),
  constraint inter_hospital_requests_quantity_check check (quantity > 0)
);

-- Enable Row Level Security (RLS)
alter table public.inter_hospital_requests enable row level security;

-- Allow select for requester and provider hospitals
create policy "Select own inter-hospital requests" on public.inter_hospital_requests
  for select using (auth.uid() = requester_id or auth.uid() = provider_id);

-- Allow requester hospital to insert requests
create policy "Insert own inter-hospital requests" on public.inter_hospital_requests
  for insert with check (auth.uid() = requester_id);

-- Allow provider and requester to update requests
create policy "Update own inter-hospital requests" on public.inter_hospital_requests
  for update using (auth.uid() = requester_id or auth.uid() = provider_id);


