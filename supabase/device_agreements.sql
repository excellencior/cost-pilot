-- Execute this in the Supabase SQL Editor

-- Create the device agreements table to track policy acceptance by device UUID
CREATE TABLE public.device_agreements (
    device_id text PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    agreed_at timestamp with time zone DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.device_agreements ENABLE ROW LEVEL SECURITY;

-- Allow anyone (including anonymous users) to check if a specific device ID exists
-- They must know the exact UUID of the device to query it.
CREATE POLICY "Allow anon select by device id" ON public.device_agreements
    FOR SELECT USING (true);

-- Allow authenticated users to insert/update their device agreements
CREATE POLICY "Allow authenticated insert" ON public.device_agreements
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow authenticated update" ON public.device_agreements
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    
-- Allow users to delete their own device agreements if they wish
CREATE POLICY "Allow authenticated delete" ON public.device_agreements
    FOR DELETE USING (auth.uid() = user_id);
