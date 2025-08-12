-- Rename amount column to total_amount in payments table
ALTER TABLE payments RENAME COLUMN amount TO total_amount;

-- Update any functions that reference the old column name
DROP FUNCTION IF EXISTS create_payment_journal_entries();
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
  v_payment_amount := NEW.total_amount;
  v_total_amount := NEW.total_amount;
  v_is_full_payment := FALSE;

  IF NEW.booking_id IS NOT NULL THEN
    SELECT 
      b.id, 
      COALESCE(b.vehicle_name, 'unknown vehicle'), 
      COALESCE(b.total_amount, 0),
      (NEW.total_amount >= COALESCE(b.total_amount, 0) - COALESCE(b.paid_amount, 0))
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

-- Update the create_payment_with_journal_entry function
DROP FUNCTION IF EXISTS create_payment_with_journal_entry(UUID, NUMERIC, TEXT, TEXT);
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
    total_amount, 
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
