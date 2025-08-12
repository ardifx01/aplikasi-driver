-- Fix payment processing to only create payment records when actual payments are made
-- Payments should not be created during booking creation, only when payment is processed
-- The paid_amount column should reflect actual payments made

-- Updated trigger function to handle payment processing correctly
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

  -- Get the payment amount from the current payment (use total_amount column)
  v_payment_amount := COALESCE(NEW.total_amount, 0);

  -- CRITICAL: Always ensure paid_amount is set correctly in the payments table
  -- Set paid_amount to match the payment amount for INSERT operations
  IF TG_OP = 'INSERT' THEN
    NEW.paid_amount := v_payment_amount;
  END IF;
  
  -- For UPDATE operations, ensure paid_amount is consistent with total_amount
  IF TG_OP = 'UPDATE' AND (NEW.paid_amount IS NULL OR NEW.paid_amount != v_payment_amount) THEN
    NEW.paid_amount := v_payment_amount;
  END IF;

  -- Calculate total paid amount for this booking (including current payment)
  -- Only count successful payments
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
    bookings_status = CASE 
      WHEN v_total_paid >= total_amount THEN 'paid'
      WHEN v_total_paid > 0 THEN 'partial'
      ELSE COALESCE(bookings_status, 'pending')
    END,
    updated_at = NOW()
  WHERE id = NEW.booking_id;

  -- Log the update for debugging (only if debug_log table exists)
  BEGIN
    INSERT INTO debug_log(message, data) VALUES (
      'Booking payment amounts updated - PAYMENT ONLY ON ACTUAL PAYMENT',
      jsonb_build_object(
        'trigger_operation', TG_OP,
        'booking_id', NEW.booking_id,
        'payment_id', NEW.id,
        'payment_amount_from_total_amount_column', v_payment_amount,
        'payment_paid_amount_column', NEW.paid_amount,
        'is_partial_payment', NEW.is_partial_payment,
        'calculated_total_paid', v_total_paid,
        'calculated_remaining', v_remaining,
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
      'Error updating booking payment amounts - PAYMENT ONLY VERSION',
      jsonb_build_object(
        'error', SQLERRM,
        'booking_id', NEW.booking_id,
        'payment_id', NEW.id,
        'payment_amount', v_payment_amount,
        'trigger_operation', TG_OP
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

-- Updated payment deletion handler
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
  -- Use total_amount column from payments table
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
      'Booking payment amounts updated after payment deletion - PAYMENT ONLY VERSION',
      jsonb_build_object(
        'booking_id', OLD.booking_id,
        'deleted_payment_id', OLD.id,
        'deleted_amount_from_total_amount_column', OLD.total_amount,
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
      'Error handling payment deletion - PAYMENT ONLY VERSION',
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

-- Update existing payments to populate paid_amount column
-- This fixes existing records where paid_amount is NULL but total_amount has values
UPDATE payments 
SET paid_amount = total_amount 
WHERE paid_amount IS NULL AND total_amount IS NOT NULL AND total_amount > 0;

-- Recreate the triggers to use the updated functions
DROP TRIGGER IF EXISTS trigger_update_booking_payments ON payments;
CREATE TRIGGER trigger_update_booking_payments
  AFTER INSERT OR UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_booking_payment_amounts();

DROP TRIGGER IF EXISTS trigger_handle_payment_deletion ON payments;
CREATE TRIGGER trigger_handle_payment_deletion
  AFTER DELETE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION handle_payment_deletion();
