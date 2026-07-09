-- Allow select for all authenticated users
create policy "Allow select authenticated" on profiles for select using (
  auth.role() = 'authenticated'
);

-- Allow update only by owner
create policy "Allow update own" on profiles for update using (
  id = auth.uid()
);
