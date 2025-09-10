-- Smart Expense Tracker Database Setup
-- Run these commands in your Supabase SQL editor

-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  budget DECIMAL(10,2) NOT NULL,
  spent DECIMAL(10,2) DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

-- Create groups table
CREATE TABLE IF NOT EXISTS groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create group_members table
CREATE TABLE IF NOT EXISTS group_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  balance DECIMAL(10,2) DEFAULT 0,
  user_email TEXT
);

-- Create shared_expenses table
CREATE TABLE IF NOT EXISTS shared_expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  paid_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_expenses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for expenses
DROP POLICY IF EXISTS "Users can manage their own expenses" ON expenses;
CREATE POLICY "Users can manage their own expenses" ON expenses
  FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for projects
DROP POLICY IF EXISTS "Users can manage their own projects" ON projects;
CREATE POLICY "Users can manage their own projects" ON projects
  FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for project_entries
DROP POLICY IF EXISTS "Users can manage entries of their projects" ON project_entries;
CREATE POLICY "Users can manage entries of their projects" ON project_entries
  FOR ALL USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- Create RLS policies for groups
DROP POLICY IF EXISTS "Users can manage their own groups" ON groups;
CREATE POLICY "Users can manage their own groups" ON groups
  FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for group_members
DROP POLICY IF EXISTS "Users can manage members of their groups" ON group_members;
CREATE POLICY "Users can manage members of their groups" ON group_members
  FOR ALL USING (
    group_id IN (
      SELECT id FROM groups WHERE user_id = auth.uid()
    )
  );

-- Create RLS policies for shared_expenses
DROP POLICY IF EXISTS "Users can manage expenses in their groups" ON shared_expenses;
CREATE POLICY "Users can manage expenses in their groups" ON shared_expenses
  FOR ALL USING (
    group_id IN (
      SELECT id FROM groups WHERE user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS expenses_user_id_idx ON expenses(user_id);
CREATE INDEX IF NOT EXISTS expenses_date_idx ON expenses(date);
CREATE INDEX IF NOT EXISTS expenses_category_idx ON expenses(category);

CREATE INDEX IF NOT EXISTS projects_user_id_idx ON projects(user_id);
CREATE INDEX IF NOT EXISTS projects_created_at_idx ON projects(created_at);

CREATE INDEX IF NOT EXISTS project_entries_project_id_idx ON project_entries(project_id);
CREATE INDEX IF NOT EXISTS project_entries_date_idx ON project_entries(date);

CREATE INDEX IF NOT EXISTS groups_user_id_idx ON groups(user_id);
CREATE INDEX IF NOT EXISTS groups_created_at_idx ON groups(created_at);

CREATE INDEX IF NOT EXISTS group_members_group_id_idx ON group_members(group_id);
CREATE INDEX IF NOT EXISTS shared_expenses_group_id_idx ON shared_expenses(group_id);
CREATE INDEX IF NOT EXISTS shared_expenses_created_at_idx ON shared_expenses(created_at);
