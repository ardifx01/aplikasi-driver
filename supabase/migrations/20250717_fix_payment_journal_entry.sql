-- Fix the payment journal entry issue where journal entry ID is NULL

-- Drop existing payment trigger to avoid conflicts
DROP TRIGGER IF EXISTS payment_journal_entries_trigger ON payments;
DROP FUNCTION IF EXISTS create_payment_journal_entries;

-- Ensure debug_log table exists for troubleshooting
CREATE TABLE IF NOT EXISTS debug_log (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  message TEXT,
  data JSONB
);

-- Create a function to handle the proper insert order: journal_entries -> journal_entry_items -> payments
CREATE OR REPLACE FUNCTION create_payment_with_journal_entry(
  p_booking_id UUID,
  p_amount NUMERIC,
  p_payment_method TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
AS $
DECLARE
  v_payment_id UUID := gen_random_uuid();
  v_journal_id UUID := gen_random_uuid();
  v_booking_record RECORD;
BEGIN
  -- Get booking information
  SELECT * INTO v_booking_record FROM bookings WHERE id = p_booking_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking with ID % not found', p_booking_id;
  END IF;

  -- Create journal entry first
  INSERT INTO journal_entries(
    id, 
    booking_id, 
    entry_type, 
    description, 
    total_amount, 
    reference_number,
    entry_date
  )
  VALUES (
    v_journal_id, 
    p_booking_id, 
    'PAYMENT_RECEIVED', 
    COALESCE(p_notes, 'Payment received'), 
    p_amount, 
    'PMT-' || v_payment_id::TEXT,
    CURRENT_DATE
  );

  -- Create payment with journal entry reference
  INSERT INTO payments(
    id, 
    booking_id, 
    amount, 
    payment_method, 
    status, 
    notes,
    journal_entry_id
  )
  VALUES (
    v_payment_id, 
    p_booking_id, 
    p_amount, 
    p_payment_method, 
    'paid', 
    p_notes,
    v_journal_id
  );

  RETURN v_payment_id;
END;
$;

-- Create a simplified trigger function that uses the new approach
CREATE OR REPLACE FUNCTION create_payment_journal_entries()
RETURNS TRIGGER AS $$ 
DECLARE
  v_journal_entry_id UUID;
  v_cash_account_id UUID;
  v_ar_account_id UUID;
  v_revenue_account_id UUID;
  v_unearned_revenue_id UUID;
  v_reference_number VARCHAR(50);
  v_description TEXT;
  v_booking_id UUID;
  v_vehicle_name TEXT;
  v_payment_amount DECIMAL(12, 2);
  v_total_amount DECIMAL(12, 2);
  v_is_full_payment BOOLEAN;
  v_current_date DATE;
BEGIN
  v_current_date := CURRENT_DATE;

  v_cash_account_id := 'c6774ca8-7b22-4db3-b70e-538959f44aca'::UUID;
  v_ar_account_id := 'c6774ca8-7b22-4db3-b70e-538959f44aca'::UUID;
  v_revenue_account_id := '60ec9e54-32fc-49de-acf4-04e5980198e1'::UUID;
  v_unearned_revenue_id := '60ec9e54-32fc-49de-acf4-04e5980198e1'::UUID;

  v_booking_id := NEW.booking_id;
  v_vehicle_name := 'unknown vehicle';
  v_payment_amount := NEW.amount;
  v_total_amount := NEW.amount;
  v_is_full_payment := FALSE;

  IF NEW.booking_id IS NOT NULL THEN
    SELECT 
      b.id, 
      COALESCE(b.vehicle_name, 'unknown vehicle'), 
      COALESCE(b.total_amount, 0),
      (NEW.amount >= COALESCE(b.total_amount, 0) - COALESCE(b.paid_amount, 0))
    INTO 
      v_booking_id, 
      v_vehicle_name, 
      v_total_amount,
      v_is_full_payment
    FROM bookings b 
    WHERE b.id = NEW.booking_id;
    
    IF NOT FOUND THEN
      INSERT INTO debug_log(message, data) VALUES (
        'Booking not found for payment', 
        jsonb_build_object(
          'payment_id', NEW.id,
          'booking_id', NEW.booking_id
        )
      );
      RETURN NEW;
    END IF;
  END IF;

  v_reference_number := 'PMT-' || NEW.id::TEXT;
  v_description := 'Payment for ' || v_vehicle_name || ' booking';

  -- Only create journal entry if one doesn't already exist for this payment
  IF NEW.journal_entry_id IS NULL THEN
    INSERT INTO journal_entries (
      entry_date, 
      booking_id, 
      payment_id, 
      entry_type, 
      description, 
      total_amount, 
      reference_number
    ) VALUES (
      v_current_date, 
      v_booking_id, 
      NEW.id, 
      'PAYMENT_RECEIVED', 
      v_description, 
      v_payment_amount, 
      v_reference_number
    ) RETURNING id INTO v_journal_entry_id;
  ELSE
    v_journal_entry_id := NEW.journal_entry_id;
  END IF;

  IF v_journal_entry_id IS NULL THEN
    RAISE EXCEPTION 'Failed to create journal entry for payment %', NEW.id;
  END IF;

  INSERT INTO journal_entry_items (
    journal_entry_id,
    account_id,
    debit,
    credit
  ) VALUES 
  (
    v_journal_entry_id,
    v_cash_account_id,
    v_payment_amount,
    0
  ),
  (
    v_journal_entry_id,
    v_ar_account_id,
    0,
    v_payment_amount
  );

  IF v_is_full_payment THEN
    INSERT INTO journal_entry_items (
      journal_entry_id,
      account_id,
      debit,
      credit
    ) VALUES 
    (
      v_journal_entry_id,
      v_unearned_revenue_id,
      v_total_amount,
      0
    ),
    (
      v_journal_entry_id,
      v_revenue_account_id,
      0,
      v_total_amount
    );
  END IF;

  INSERT INTO general_ledger (
    transaction_date, 
    booking_id, 
    payment_id, 
    account_id, 
    description, 
    debit, 
    credit, 
    reference_number
  ) VALUES 
  (
    v_current_date, 
    v_booking_id, 
    NEW.id, 
    v_cash_account_id, 
    v_description, 
    v_payment_amount, 
    0, 
    v_reference_number
  ),
  (
    v_current_date, 
    v_booking_id, 
    NEW.id, 
    v_ar_account_id, 
    v_description, 
    0, 
    v_payment_amount, 
    v_reference_number
  );

  IF v_is_full_payment THEN
    INSERT INTO general_ledger (
      transaction_date, 
      booking_id, 
      payment_id, 
      account_id, 
      description, 
      debit, 
      credit, 
      reference_number
    ) VALUES 
    (
      v_current_date, 
      v_booking_id, 
      NEW.id, 
      v_unearned_revenue_id, 
      v_description, 
      v_total_amount, 
      0, 
      v_reference_number
    ),
    (
      v_current_date, 
      v_booking_id, 
      NEW.id, 
      v_revenue_account_id, 
      v_description, 
      0, 
      v_total_amount, 
      v_reference_number
    );
  END IF;

  INSERT INTO debug_log(message, data) VALUES (
    'Payment journal entries created successfully', 
    jsonb_build_object(
      'journal_entry_id', v_journal_entry_id,
      'payment_id', NEW.id,
      'booking_id', v_booking_id
    )
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  INSERT INTO debug_log(message, data) VALUES (
    'Error creating payment journal entries', 
    jsonb_build_object(
      'error', SQLERRM,
      'payment_id', NEW.id,
      'booking_id', v_booking_id
    )
  );

  RAISE EXCEPTION 'Payment processing failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Update the journal entries constraint
ALTER TABLE journal_entries DROP CONSTRAINT IF EXISTS journal_entries_entry_type_check;
ALTER TABLE journal_entries ADD CONSTRAINT journal_entries_entry_type_check 
  CHECK (entry_type IN ('BOOKING_CREATED', 'PAYMENT_RECEIVED', 'FULL_PAYMENT', 'PARTIAL_PAYMENT'));

-- Create the payment trigger
CREATE TRIGGER payment_journal_entries_trigger
AFTER INSERT
ON payments
FOR EACH ROW
EXECUTE FUNCTION create_payment_journal_entries();

-- Fix missing journal entries
DROP FUNCTION IF EXISTS fix_missing_booking_journal_entries();
CREATE OR REPLACE FUNCTION fix_missing_booking_journal_entries()
RETURNS TABLE (booking_id UUID, status TEXT, journal_entry_id UUID) AS $$
DECLARE
  v_booking RECORD;
  v_journal_entry_id UUID;
  v_current_date DATE := CURRENT_DATE;
BEGIN
  FOR v_booking IN 
    SELECT b.id, b.vehicle_name, b.total_amount
    FROM bookings b
    LEFT JOIN journal_entries je ON je.booking_id = b.id AND je.entry_type = 'BOOKING_CREATED'
    WHERE je.id IS NULL
    ORDER BY b.created_at DESC
    LIMIT 50
  LOOP
    BEGIN
      INSERT INTO journal_entries (
        entry_date, 
        booking_id, 
        entry_type, 
        description, 
        total_amount, 
        reference_number
      ) VALUES (
        v_current_date, 
        v_booking.id, 
        'BOOKING_CREATED', 
        'Retroactively created journal entry for booking ' || COALESCE(v_booking.vehicle_name, 'unknown vehicle'), 
        COALESCE(v_booking.total_amount, 0), 
        'BK-FIX-' || v_booking.id::TEXT
      ) RETURNING id INTO v_journal_entry_id;

      INSERT INTO general_ledger (
        transaction_date, 
        booking_id, 
        account_id, 
        description, 
        debit, 
        credit, 
        reference_number
      ) VALUES 
      (
        v_current_date, 
        v_booking.id, 
        'c6774ca8-7b22-4db3-b70e-538959f44aca'::UUID, 
        'Retroactively created - Booking for ' || COALESCE(v_booking.vehicle_name, 'unknown vehicle'), 
        COALESCE(v_booking.total_amount, 0), 
        0, 
        'BK-FIX-' || v_booking.id::TEXT
      ),
      (
        v_current_date, 
        v_booking.id, 
        '60ec9e54-32fc-49de-acf4-04e5980198e1'::UUID, 
        'Retroactively created - Booking for ' || COALESCE(v_booking.vehicle_name, 'unknown vehicle'), 
        0, 
        COALESCE(v_booking.total_amount, 0), 
        'BK-FIX-' || v_booking.id::TEXT
      );

      booking_id := v_booking.id;
      status := 'FIXED';
      journal_entry_id := v_journal_entry_id;
      RETURN NEXT;
    EXCEPTION WHEN OTHERS THEN
      booking_id := v_booking.id;
      status := 'ERROR: ' || SQLERRM;
      journal_entry_id := NULL;
      RETURN NEXT;
    END;
  END LOOP;
  RETURN;
END;
$$ LANGUAGE plpgsql;

-- View for logs
CREATE OR REPLACE VIEW payment_debug_logs AS
SELECT 
  id,
  created_at,
  message,
  data
FROM debug_log
WHERE message ILIKE '%payment%' OR message ILIKE '%journal%'
ORDER BY created_at DESC;