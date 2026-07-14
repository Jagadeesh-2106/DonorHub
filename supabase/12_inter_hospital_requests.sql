-- Create inter_hospital_requests table
CREATE TABLE IF NOT EXISTS public.inter_hospital_requests (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id uuid NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  provider_id uuid NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  blood_group text NOT NULL,
  quantity integer NOT NULL,
  emergency_level text CHECK (emergency_level IN ('low', 'medium', 'high', 'critical')) NOT NULL,
  purpose text NOT NULL,
  status text CHECK (status IN ('pending', 'accepted', 'declined')) DEFAULT 'pending' NOT NULL,
  created_at timestamp WITH time zone DEFAULT timezone('utc', now()),
  updated_at timestamp WITH time zone DEFAULT timezone('utc', now()),
  CONSTRAINT inter_hospital_requests_quantity_check CHECK (quantity > 0)
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.inter_hospital_requests ENABLE ROW LEVEL SECURITY;

-- Allow select for requester and provider hospitals
CREATE POLICY "Select own inter-hospital requests" ON public.inter_hospital_requests
  FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = provider_id);

-- Allow requester hospital to insert requests
CREATE POLICY "Insert own inter-hospital requests" ON public.inter_hospital_requests
  FOR INSERT WITH CHECK (auth.uid() = requester_id);

-- Allow provider and requester to update requests
CREATE POLICY "Update own inter-hospital requests" ON public.inter_hospital_requests
  FOR UPDATE USING (auth.uid() = requester_id OR auth.uid() = provider_id);
