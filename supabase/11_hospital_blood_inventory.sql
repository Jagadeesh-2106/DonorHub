-- Create hospital_blood_inventory table
CREATE TABLE IF NOT EXISTS public.hospital_blood_inventory (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  hospital_id uuid NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  blood_group text NOT NULL,
  quantity integer NOT NULL DEFAULT 0,
  created_at timestamp WITH time zone DEFAULT timezone('utc', now()),
  updated_at timestamp WITH time zone DEFAULT timezone('utc', now()),
  CONSTRAINT hospital_blood_inventory_quantity_check CHECK (quantity >= 0),
  CONSTRAINT hospital_blood_inventory_unique_group UNIQUE (hospital_id, blood_group)
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.hospital_blood_inventory ENABLE ROW LEVEL SECURITY;

-- Allow select for all authenticated users (to search nearby blood banks)
CREATE POLICY "Inventory select authenticated" ON public.hospital_blood_inventory
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow hospitals to manage their own blood inventory
CREATE POLICY "Hospitals insert own inventory" ON public.hospital_blood_inventory
  FOR INSERT WITH CHECK (hospital_id = auth.uid());

CREATE POLICY "Hospitals update own inventory" ON public.hospital_blood_inventory
  FOR UPDATE USING (hospital_id = auth.uid());

CREATE POLICY "Hospitals delete own inventory" ON public.hospital_blood_inventory
  FOR DELETE USING (hospital_id = auth.uid());
