-- Make sender_account and sender_name nullable in topup_requests table
ALTER TABLE topup_requests 
ALTER COLUMN sender_account DROP NOT NULL,
ALTER COLUMN sender_name DROP NOT NULL;