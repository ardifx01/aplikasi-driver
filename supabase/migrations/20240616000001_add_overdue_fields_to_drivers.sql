-- Add overdue_days and total_overdue columns to drivers table
ALTER TABLE drivers
ADD COLUMN IF NOT EXISTS overdue_days INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_overdue DECIMAL(15, 2) DEFAULT 0.0;
