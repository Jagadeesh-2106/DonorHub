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
