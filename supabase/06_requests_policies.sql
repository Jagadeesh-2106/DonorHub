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
