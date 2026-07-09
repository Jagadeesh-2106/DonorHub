-- Donors can insert/select/update their own responses
create policy "Donors manage own responses" on request_responses for all using (
  donor_id = auth.uid()
);

create policy "Hospitals view responses to their requests" on request_responses for select using (
  exists (
    select 1 from blood_requests where id = request_id and hospital_id = auth.uid()
  )
);
