-- Add request_by_role column to topup_requests table
ALTER TABLE IF EXISTS topup_requests ADD COLUMN IF NOT EXISTS request_by_role TEXT;
