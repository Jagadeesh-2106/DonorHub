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
