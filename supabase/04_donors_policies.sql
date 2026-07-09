create policy "Donors select authenticated" on donors for select using (
  auth.role() = 'authenticated'
);

create policy "Donors update own" on donors for update using (
  id = auth.uid()
);

create policy "Donors insert own" on donors for insert with check (
  id = auth.uid()
);
