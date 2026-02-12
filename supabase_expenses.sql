-- Expenses Table for Offline-First Sync
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY, -- Generated locally, so we don't use default
  user_id UUID REFERENCES auth.users(id),
  amount NUMERIC NOT NULL,
  category JSONB NOT NULL, -- Storing full category object for simplicity
  title TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted BOOLEAN DEFAULT FALSE,
  
  -- Index for faster queries
  CONSTRAINT expenses_user_id_idx FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Index for searching and syncing
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_updated_at ON expenses(updated_at);

-- RLS Policies
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own data
CREATE POLICY "Users can read own expenses" 
ON expenses FOR SELECT 
USING (auth.uid() = user_id);

-- Allow users to insert their own data (even with specific IDs)
CREATE POLICY "Users can insert own expenses" 
ON expenses FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own data
CREATE POLICY "Users can update own expenses" 
ON expenses FOR UPDATE 
USING (auth.uid() = user_id);

-- Allow users to "delete" (soft delete) their own data
-- Actually, since we use soft deletes, this is just an update.
-- But standard delete policy if needed:
CREATE POLICY "Users can delete own expenses" 
ON expenses FOR DELETE 
USING (auth.uid() = user_id);
