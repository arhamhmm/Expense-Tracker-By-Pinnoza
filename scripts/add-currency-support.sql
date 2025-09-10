-- Add currency support to existing database
-- Run this if you already have the expense tracker database set up

-- Add currency column to expenses table
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'USD';

-- Add currency column to projects table  
ALTER TABLE projects ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'USD';

-- Create project_entries table
CREATE TABLE IF NOT EXISTS project_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update existing records to have USD as default currency (if needed)
UPDATE expenses SET currency = 'USD' WHERE currency IS NULL OR currency = '';
UPDATE projects SET currency = 'USD' WHERE currency IS NULL OR currency = '';

-- Enable RLS for project_entries
ALTER TABLE project_entries ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for project_entries
DROP POLICY IF EXISTS "Users can manage entries of their projects" ON project_entries;
CREATE POLICY "Users can manage entries of their projects" ON project_entries
  FOR ALL USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- Add indexes for better performance with currency
CREATE INDEX IF NOT EXISTS expenses_currency_idx ON expenses(currency);
CREATE INDEX IF NOT EXISTS projects_currency_idx ON projects(currency);
CREATE INDEX IF NOT EXISTS project_entries_project_id_idx ON project_entries(project_id);
CREATE INDEX IF NOT EXISTS project_entries_date_idx ON project_entries(date);

-- Add check constraints to ensure valid currency codes
ALTER TABLE expenses ADD CONSTRAINT IF NOT EXISTS expenses_currency_check 
  CHECK (currency IN ('USD', 'EUR', 'CAD', 'PKR'));

ALTER TABLE projects ADD CONSTRAINT IF NOT EXISTS projects_currency_check 
  CHECK (currency IN ('USD', 'EUR', 'CAD', 'PKR'));

ALTER TABLE project_entries ADD CONSTRAINT IF NOT EXISTS project_entries_currency_check 
  CHECK (currency IN ('USD', 'EUR', 'CAD', 'PKR'));
