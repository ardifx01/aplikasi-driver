-- Add verification and debugging for booking journal entries

-- Create a function to verify journal entries for a booking
CREATE OR REPLACE FUNCTION verify_booking_journal_entries(booking_id UUID)
RETURNS TABLE (has_entries BOOLEAN, entry_count INTEGER, journal_ids UUID[], gl_entries INTEGER) AS $$
DECLARE
  v_journal_count INTEGER;
  v_gl_count INTEGER;
  v_journal_ids UUID[];
BEGIN
  -- Count journal entries for this booking
  SELECT COUNT(*), ARRAY_AGG(id) 
  INTO v_journal_count, v_journal_ids 
  FROM journal_entries 
  WHERE booking_id = $1;
  
  -- Count general ledger entries for this booking
  SELECT COUNT(*) 
  INTO v_gl_count 
  FROM general_ledger 
  WHERE booking_id = $1;
  
  RETURN QUERY SELECT 
    v_journal_count > 0, 
    v_journal_count, 
    v_journal_ids, 
    v_gl_count;
END;
$$ LANGUAGE plpgsql;

-- Create a function to manually create journal entries for a booking if missing
CREATE OR REPLACE FUNCTION create_missing_booking_journal_entry(p_booking_id UUID)
RETURNS UUID AS $$
DECLARE
  v_journal_entry_id UUID;
  v_ar_account_id UUID := 'c6774ca8-7b22-4db3-b70e-538959f44aca'; -- For debit side
  v_unearned_revenue_id UUID := '60ec9e54-32fc-49de-acf4-04e5980198e1'; -- For credit side
  v_booking RECORD;
  v_reference_number VARCHAR(50);
  v_description TEXT;
  v_entry_type VARCHAR(50) := 'BOOKING_CREATED_MANUAL';
BEGIN
  -- Get booking details
  SELECT * INTO v_booking FROM bookings WHERE id = p_booking_id;
  
  IF v_booking IS NULL THEN
    RAISE EXCEPTION 'Booking with ID % not found', p_booking_id;
  END IF;
  
  -- Check if journal entry already exists
  IF EXISTS (SELECT 1 FROM journal_entries WHERE booking_id = p_booking_id AND entry_type = 'BOOKING_CREATED') THEN
    RAISE NOTICE 'Journal entry already exists for booking %', p_booking_id;
    SELECT id INTO v_journal_entry_id FROM journal_entries WHERE booking_id = p_booking_id AND entry_type = 'BOOKING_CREATED' LIMIT 1;
    RETURN v_journal_entry_id;
  END IF;
  
  -- Generate reference number
  v_reference_number := 'BK-MANUAL-' || p_booking_id;
  
  -- Create description
  v_description := 'Manually created journal entry for booking ' || 
    COALESCE(v_booking.vehicle_name, 'unknown vehicle');
  
  -- Insert journal entry header
  INSERT INTO journal_entries (
    entry_date, booking_id, entry_type, description, total_amount, reference_number
  ) VALUES (
    CURRENT_DATE, p_booking_id, v_entry_type, v_description, v_booking.total_amount, v_reference_number
  ) RETURNING id INTO v_journal_entry_id;
  
  -- Insert general ledger entries
  -- Debit Accounts Receivable
  INSERT INTO general_ledger (
    transaction_date, booking_id, account_id, description, debit, credit, reference_number
  ) VALUES (
    CURRENT_DATE, p_booking_id, v_ar_account_id, v_description, v_booking.total_amount, 0, v_reference_number
  );
  
  -- Credit Unearned Revenue
  INSERT INTO general_ledger (
    transaction_date, booking_id, account_id, description, debit, credit, reference_number
  ) VALUES (
    CURRENT_DATE, p_booking_id, v_unearned_revenue_id, v_description, 0, v_booking.total_amount, v_reference_number
  );
  
  RAISE NOTICE 'Created journal entry % for booking %', v_journal_entry_id, p_booking_id;
  
  RETURN v_journal_entry_id;
END;
$$ LANGUAGE plpgsql;

-- Add enhanced logging to the booking journal entries trigger
CREATE OR REPLACE FUNCTION log_booking_journal_entry()
RETURNS TRIGGER AS $$
BEGIN
  -- Log the journal entry creation
  RAISE NOTICE 'Journal entry created: ID=%, Type=%, Amount=%, Booking=%', 
    NEW.id, 
    NEW.entry_type, 
    NEW.total_amount,
    NEW.booking_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to log journal entry creation
DROP TRIGGER IF EXISTS log_booking_journal_entry_trigger ON journal_entries;
CREATE TRIGGER log_booking_journal_entry_trigger
AFTER INSERT
ON journal_entries
FOR EACH ROW
WHEN (NEW.booking_id IS NOT NULL)
EXECUTE FUNCTION log_booking_journal_entry();

-- Add realtime for journal_entries and general_ledger if not already added
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'journal_entries'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE journal_entries;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'general_ledger'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE general_ledger;
  END IF;
END
$$;

-- Create a function to check for bookings without journal entries and fix them
CREATE OR REPLACE FUNCTION fix_missing_journal_entries()
RETURNS TABLE (booking_id UUID, journal_entry_id UUID, status TEXT) AS $$
DECLARE
  v_booking RECORD;
  v_journal_entry_id UUID;
BEGIN
  FOR v_booking IN 
    SELECT b.id 
    FROM bookings b
    LEFT JOIN journal_entries je ON je.booking_id = b.id
    WHERE je.id IS NULL
    ORDER BY b.created_at DESC
    LIMIT 100
  LOOP
    BEGIN
      v_journal_entry_id := create_missing_booking_journal_entry(v_booking.id);
      booking_id := v_booking.id;
      journal_entry_id := v_journal_entry_id;
      status := 'FIXED';
      RETURN NEXT;
    EXCEPTION WHEN OTHERS THEN
      booking_id := v_booking.id;
      journal_entry_id := NULL;
      status := 'ERROR: ' || SQLERRM;
      RETURN NEXT;
    END;
  END LOOP;
  
  RETURN;
END;
$$ LANGUAGE plpgsql;

-- Ensure the booking_journal_entries_trigger is properly set up
DROP TRIGGER IF EXISTS booking_journal_entries_trigger ON bookings;
CREATE TRIGGER booking_journal_entries_trigger
AFTER INSERT OR UPDATE OF payment_status
ON bookings
FOR EACH ROW
EXECUTE FUNCTION create_booking_journal_entries();