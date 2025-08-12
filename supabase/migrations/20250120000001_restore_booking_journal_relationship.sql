-- Restore the connection between bookings and journal entries, and extend it to include journal entry items

-- Add journal_entry_id column back to bookings table
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS journal_entry_id UUID;

-- Add foreign key constraint to reference journal_entries table (only if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_bookings_journal_entry' 
        AND table_name = 'bookings'
    ) THEN
        ALTER TABLE bookings ADD CONSTRAINT fk_bookings_journal_entry 
            FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id);
    END IF;
END $$;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_bookings_journal_entry_id ON bookings(journal_entry_id);

-- Update journal_entries entry_type constraint to allow BOOKING_CREATED
ALTER TABLE journal_entries DROP CONSTRAINT IF EXISTS journal_entries_entry_type_check;
ALTER TABLE journal_entries
ADD CONSTRAINT journal_entries_entry_type_check
CHECK (entry_type IN ('debit', 'credit', 'payment', 'booking', 'BOOKING_CREATED', 'PAYMENT_RECEIVED'));

-- Drop existing functions to avoid conflicts
DROP FUNCTION IF EXISTS create_booking_with_journal_entry CASCADE;
DROP FUNCTION IF EXISTS create_booking_simple CASCADE;

-- Create the create_booking_with_journal_entry function to create journal entries and journal entry items
CREATE OR REPLACE FUNCTION create_booking_with_journal_entry(
  p_vehicle_id UUID,
  p_driver_option TEXT,
  p_vehicle_type TEXT,
  p_booking_date DATE,
  p_start_time TIME,
  p_return_time TIME,
  p_duration INTEGER,
  p_total_amount NUMERIC,
  p_start_date DATE,
  p_end_date DATE,
  p_user_id UUID,
  p_vehicle_name TEXT,
  p_services_id UUID,
  p_partner_id UUID,
  p_account_id UUID DEFAULT 'b98f49fb-54c1-487d-943a-7840621f0b6e'::UUID,
  p_driver_name TEXT DEFAULT NULL,
  p_driver_id UUID DEFAULT NULL
)
RETURNS TABLE(
  booking_id UUID,
  journal_entry_id UUID,
  status TEXT
)
LANGUAGE plpgsql
AS $
DECLARE
  v_booking_id UUID;
  v_journal_entry_id UUID;
  v_reference_number TEXT;
  v_ar_account_id UUID;
  v_unearned_revenue_id UUID;
BEGIN
  -- Generate new booking ID
  v_booking_id := gen_random_uuid();
  
  -- Generate reference number
  v_reference_number := 'BK-' || UPPER(SUBSTRING(v_booking_id::TEXT, 1, 8));
  
  -- Get account IDs from chart_of_accounts or use fallback
  SELECT id INTO v_ar_account_id FROM chart_of_accounts WHERE account_code = '1-10002' LIMIT 1;
  SELECT id INTO v_unearned_revenue_id FROM chart_of_accounts WHERE account_code = '2-20001' LIMIT 1;
  
  -- Use fallback account IDs if not found in chart_of_accounts
  IF v_ar_account_id IS NULL THEN
    v_ar_account_id := 'c6774ca8-7b22-4db3-b70e-538959f44aca';
  END IF;
  
  IF v_unearned_revenue_id IS NULL THEN
    v_unearned_revenue_id := '60ec9e54-32fc-49de-acf4-04e5980198e1';
  END IF;
  
  -- Create journal entry first
  INSERT INTO journal_entries (
    entry_date,
    booking_id,
    entry_type,
    description,
    total_amount,
    reference_number,
    date,
    account_id
  ) VALUES (
    CURRENT_DATE,
    v_booking_id,
    'BOOKING_CREATED',
    'Booking created for ' || p_vehicle_name || ' - ' || p_driver_option,
    p_total_amount,
    v_reference_number,
    CURRENT_DATE,
    p_account_id
  ) RETURNING id INTO v_journal_entry_id;
  
  -- Create journal entry items
  -- Debit Accounts Receivable
  INSERT INTO journal_entry_items (
    journal_entry_id,
    account_id,
    debit,
    credit,
    date
  ) VALUES (
    v_journal_entry_id,
    v_ar_account_id,
    p_total_amount,
    0,
    CURRENT_DATE
  );
  
  -- Credit Unearned Revenue
  INSERT INTO journal_entry_items (
    journal_entry_id,
    account_id,
    debit,
    credit,
    date
  ) VALUES (
    v_journal_entry_id,
    v_unearned_revenue_id,
    0,
    p_total_amount,
    CURRENT_DATE
  );
  
  -- Create general ledger entries
  -- Debit Accounts Receivable
  INSERT INTO general_ledger (
    date,
    transaction_date,
    booking_id,
    account_id,
    description,
    debit,
    credit,
    reference_number,
    journal_entry_id
  ) VALUES (
    CURRENT_DATE,
    CURRENT_DATE,
    v_booking_id,
    v_ar_account_id,
    'Booking created for ' || p_vehicle_name || ' - ' || p_driver_option,
    p_total_amount,
    0,
    v_reference_number,
    v_journal_entry_id
  );
  
  -- Credit Unearned Revenue
  INSERT INTO general_ledger (
    date,
    transaction_date,
    booking_id,
    account_id,
    description,
    debit,
    credit,
    reference_number,
    journal_entry_id
  ) VALUES (
    CURRENT_DATE,
    CURRENT_DATE,
    v_booking_id,
    v_unearned_revenue_id,
    'Booking created for ' || p_vehicle_name || ' - ' || p_driver_option,
    0,
    p_total_amount,
    v_reference_number,
    v_journal_entry_id
  );
  
  -- Create the booking with journal_entry_id
  INSERT INTO bookings (
    id,
    vehicle_id,
    driver_option,
    vehicle_type,
    booking_date,
    start_time,
    return_time,
    duration,
    status,
    payment_status,
    payment_method,
    total_amount,
    paid_amount,
    remaining_payments,
    start_date,
    end_date,
    user_id,
    vehicle_name,
    services_id,
    partner_id,
    driver_name,
    driver_id,
    journal_entry_id
  ) VALUES (
    v_booking_id,
    p_vehicle_id,
    p_driver_option,
    p_vehicle_type,
    p_booking_date,
    p_start_time,
    p_return_time,
    p_duration,
    'pending',
    'unpaid',
    'Cash',
    p_total_amount,
    0,
    p_total_amount,
    p_start_date,
    p_end_date,
    p_user_id,
    p_vehicle_name,
    p_services_id,
    p_partner_id,
    p_driver_name,
    p_driver_id,
    v_journal_entry_id
  );
  
  -- Return the results
  RETURN QUERY SELECT 
    v_booking_id as booking_id,
    v_journal_entry_id as journal_entry_id,
    'SUCCESS'::TEXT as status;
    
EXCEPTION WHEN OTHERS THEN
  -- Log error for debugging
  INSERT INTO debug_log(message, data) VALUES (
    'Error in create_booking_with_journal_entry', 
    jsonb_build_object(
      'error', SQLERRM,
      'vehicle_id', p_vehicle_id,
      'user_id', p_user_id
    )
  );
  
  -- Re-raise the exception
  RAISE;
END;
$$;

-- Create the simplified function as well
CREATE OR REPLACE FUNCTION create_booking_simple(
  p_vehicle_id UUID,
  p_driver_option TEXT,
  p_vehicle_type TEXT,
  p_booking_date DATE,
  p_start_time TIME,
  p_return_time TIME,
  p_duration INTEGER,
  p_total_amount NUMERIC,
  p_start_date DATE,
  p_end_date DATE,
  p_user_id UUID,
  p_vehicle_name TEXT,
  p_services_id UUID DEFAULT '60ec9e54-32fc-49de-acf4-04e5980198e1'::UUID,
  p_partner_id UUID DEFAULT 'e025c00a-908f-40d3-9e03-1efa40f96951'::UUID,
  p_account_id UUID DEFAULT 'b98f49fb-54c1-487d-943a-7840621f0b6e'::UUID,
  p_driver_name TEXT DEFAULT NULL,
  p_driver_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_result RECORD;
BEGIN
  -- Call the main function
  SELECT * INTO v_result FROM create_booking_with_journal_entry(
    p_vehicle_id,
    p_driver_option,
    p_vehicle_type,
    p_booking_date,
    p_start_time,
    p_return_time,
    p_duration,
    p_total_amount,
    p_start_date,
    p_end_date,
    p_user_id,
    p_vehicle_name,
    p_services_id,
    p_partner_id,
    p_account_id,
    p_driver_name,
    p_driver_id
  );
  
  -- Return just the booking ID
  RETURN v_result.booking_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_booking_with_journal_entry TO authenticated;
GRANT EXECUTE ON FUNCTION create_booking_simple TO authenticated;

-- Update existing bookings to link them with their journal entries where possible
UPDATE bookings 
SET journal_entry_id = (
  SELECT je.id 
  FROM journal_entries je 
  WHERE je.booking_id = bookings.id 
  AND je.entry_type = 'BOOKING_CREATED'
  LIMIT 1
)
WHERE journal_entry_id IS NULL
AND EXISTS (
  SELECT 1 
  FROM journal_entries je 
  WHERE je.booking_id = bookings.id 
  AND je.entry_type = 'BOOKING_CREATED'
);