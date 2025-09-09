-- Drop sender_account and sender_name columns from topup_requests table
ALTER TABLE topup_requests 
DROP COLUMN IF EXISTS sender_account,
DROP COLUMN IF EXISTS sender_name;

-- Recreate v_topup_requests view without the dropped columns
DROP VIEW IF EXISTS v_topup_requests;

CREATE VIEW v_topup_requests AS
SELECT 
    id,
    user_id,
    amount,
    bank_name,
    destination_account,
    account_holder_received,
    proof_url,
    reference_no,
    method,
    status,
    request_by_role,
    created_at
FROM topup_requests;