create policy "Hospitals select authenticated" on hospitals for select using (
  auth.role() = 'authenticated'
);

create policy "Hospitals update own" on hospitals for update using (
  id = auth.uid()
);

create policy "Hospitals insert own" on hospitals for insert with check (
  id = auth.uid()
);
