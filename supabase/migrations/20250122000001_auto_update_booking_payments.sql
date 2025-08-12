-- Create function to automatically update booking payment amounts
CREATE OR REPLACE FUNCTION update_booking_payment_amounts()
RETURNS TRIGGER AS $
DECLARE
  v_booking_record RECORD;
  v_total_paid NUMERIC;
  v_remaining NUMERIC;
  v_payment_status TEXT;
  v_payment_amount NUMERIC;
BEGIN
  -- Only process if this is a payment with a booking_id
  IF NEW.booking_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get the booking record
  SELECT * INTO v_booking_record 
  FROM bookings 
  WHERE id = NEW.booking_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking with ID % not found', NEW.booking_id;
  END IF;

  -- Get the payment amount from the current payment
  v_payment_amount := COALESCE(NEW.total_amount, 0);

  -- Calculate total paid amount for this booking (including current payment)
  -- Count all successful payments regardless of partial status
  SELECT COALESCE(SUM(total_amount), 0) INTO v_total_paid
  FROM payments 
  WHERE booking_id = NEW.booking_id 
    AND (status IS NULL OR status = 'paid' OR status = 'completed' OR status = 'success');

  -- Calculate remaining amount
  v_remaining := v_booking_record.total_amount - v_total_paid;
  
  -- Ensure remaining amount is not negative
  IF v_remaining < 0 THEN
    v_remaining := 0;
  END IF;

  -- Determine payment status based on amounts
  IF v_total_paid >= v_booking_record.total_amount THEN
    v_payment_status := 'paid';
  ELSIF v_total_paid > 0 THEN
    v_payment_status := 'partial';
  ELSE
    v_payment_status := 'unpaid';
  END IF;

  -- Update the booking record with correct paid_amount and remaining_payments
  UPDATE bookings 
  SET 
    paid_amount = v_total_paid,
    remaining_payments = v_remaining,
    payment_status = v_payment_status,
    updated_at = NOW()
  WHERE id = NEW.booking_id;

  -- Log the update for debugging (only if debug_log table exists)
  BEGIN
    INSERT INTO debug_log(message, data) VALUES (
      'Booking payment amounts updated',
      jsonb_build_object(
        'booking_id', NEW.booking_id,
        'payment_id', NEW.id,
        'payment_amount', v_payment_amount,
        'is_partial_payment', NEW.is_partial_payment,
        'total_paid', v_total_paid,
        'remaining', v_remaining,
        'payment_status', v_payment_status,
        'booking_total_amount', v_booking_record.total_amount
      )
    );
  EXCEPTION WHEN undefined_table THEN
    -- Ignore if debug_log table doesn't exist
    NULL;
  END;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Try to log error if possible, but don't fail the payment
  BEGIN
    INSERT INTO debug_log(message, data) VALUES (
      'Error updating booking payment amounts',
      jsonb_build_object(
        'error', SQLERRM,
        'booking_id', NEW.booking_id,
        'payment_id', NEW.id,
        'payment_amount', v_payment_amount
      )
    );
  EXCEPTION WHEN OTHERS THEN
    -- Ignore logging errors
    NULL;
  END;
  
  -- Don't fail the payment insertion, just log the error
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Create trigger to automatically update booking payment amounts when payments are inserted or updated
DROP TRIGGER IF EXISTS trigger_update_booking_payments ON payments;
CREATE TRIGGER trigger_update_booking_payments
  AFTER INSERT OR UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_booking_payment_amounts();

-- Also create a function to handle payment deletions (in case payments are cancelled)
CREATE OR REPLACE FUNCTION handle_payment_deletion()
RETURNS TRIGGER AS $
DECLARE
  v_booking_record RECORD;
  v_total_paid NUMERIC;
  v_remaining NUMERIC;
  v_payment_status TEXT;
BEGIN
  -- Only process if this payment had a booking_id
  IF OLD.booking_id IS NULL THEN
    RETURN OLD;
  END IF;

  -- Get the booking record
  SELECT * INTO v_booking_record 
  FROM bookings 
  WHERE id = OLD.booking_id;

  IF NOT FOUND THEN
    RETURN OLD;
  END IF;

  -- Recalculate total paid amount for this booking (excluding the deleted payment)
  SELECT COALESCE(SUM(total_amount), 0) INTO v_total_paid
  FROM payments 
  WHERE booking_id = OLD.booking_id 
    AND (status IS NULL OR status = 'paid' OR status = 'completed' OR status = 'success')
    AND id != OLD.id;

  -- Calculate remaining amount after deletion
  v_remaining := v_booking_record.total_amount - v_total_paid;
  
  -- Ensure remaining amount is not negative
  IF v_remaining < 0 THEN
    v_remaining := 0;
  END IF;

  -- Determine payment status after deletion
  IF v_total_paid >= v_booking_record.total_amount THEN
    v_payment_status := 'paid';
  ELSIF v_total_paid > 0 THEN
    v_payment_status := 'partial';
  ELSE
    v_payment_status := 'unpaid';
  END IF;

  -- Update the booking record with recalculated amounts
  UPDATE bookings 
  SET 
    paid_amount = v_total_paid,
    remaining_payments = v_remaining,
    payment_status = v_payment_status,
    updated_at = NOW()
  WHERE id = OLD.booking_id;

  -- Log the deletion handling (only if debug_log table exists)
  BEGIN
    INSERT INTO debug_log(message, data) VALUES (
      'Booking payment amounts updated after payment deletion',
      jsonb_build_object(
        'booking_id', OLD.booking_id,
        'deleted_payment_id', OLD.id,
        'deleted_amount', OLD.total_amount,
        'recalculated_total_paid', v_total_paid,
        'recalculated_remaining', v_remaining,
        'new_payment_status', v_payment_status
      )
    );
  EXCEPTION WHEN undefined_table THEN
    -- Ignore if debug_log table doesn't exist
    NULL;
  END;

  RETURN OLD;
EXCEPTION WHEN OTHERS THEN
  -- Try to log error if possible
  BEGIN
    INSERT INTO debug_log(message, data) VALUES (
      'Error handling payment deletion',
      jsonb_build_object(
        'error', SQLERRM,
        'booking_id', OLD.booking_id,
        'payment_id', OLD.id
      )
    );
  EXCEPTION WHEN OTHERS THEN
    -- Ignore logging errors
    NULL;
  END;
  
  RETURN OLD;
END;
$ LANGUAGE plpgsql;

-- Create trigger for payment deletions
DROP TRIGGER IF EXISTS trigger_handle_payment_deletion ON payments;
CREATE TRIGGER trigger_handle_payment_deletion
  AFTER DELETE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION handle_payment_deletion();

-- Bookings table is already enabled for realtime
