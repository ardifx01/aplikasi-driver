-- Add function to update driver saldo when payment is made
CREATE OR REPLACE FUNCTION update_driver_saldo_on_payment()
RETURNS TRIGGER AS $
DECLARE
  v_booking_record RECORD;
  v_driver_id UUID;
  v_payment_amount NUMERIC;
  v_current_saldo NUMERIC;
  v_new_saldo NUMERIC;
BEGIN
  -- Only process if this is a successful payment with a booking_id
  -- Check both status and payment_status columns for 'completed' or 'paid'
  IF NEW.booking_id IS NULL OR (NEW.status != 'paid' AND NEW.payment_status != 'completed') THEN
    RETURN NEW;
  END IF;

  -- Get the payment amount
  v_payment_amount := COALESCE(NEW.total_amount, 0);
  
  -- Skip if payment amount is 0 or negative
  IF v_payment_amount <= 0 THEN
    RETURN NEW;
  END IF;

  -- Get the booking record to find the driver
  SELECT * INTO v_booking_record 
  FROM bookings 
  WHERE id = NEW.booking_id;

  IF NOT FOUND THEN
    -- Create debug_log table if it doesn't exist
    CREATE TABLE IF NOT EXISTS debug_log (
      id SERIAL PRIMARY KEY,
      message TEXT,
      data JSONB,
      created_at TIMESTAMP DEFAULT NOW()
    );
    
    -- Log the issue but don't fail the payment
    INSERT INTO debug_log(message, data) VALUES (
      'Booking not found for saldo update',
      jsonb_build_object(
        'payment_id', NEW.id,
        'booking_id', NEW.booking_id,
        'payment_amount', v_payment_amount
      )
    );
    RETURN NEW;
  END IF;

  -- Determine the driver ID (could be from user_id, customer_id, or driver_id)
  v_driver_id := COALESCE(v_booking_record.driver_id, v_booking_record.user_id, v_booking_record.customer_id);
  
  IF v_driver_id IS NULL THEN
    -- Create debug_log table if it doesn't exist
    CREATE TABLE IF NOT EXISTS debug_log (
      id SERIAL PRIMARY KEY,
      message TEXT,
      data JSONB,
      created_at TIMESTAMP DEFAULT NOW()
    );
    
    -- Log the issue but don't fail the payment
    INSERT INTO debug_log(message, data) VALUES (
      'No driver ID found for saldo update',
      jsonb_build_object(
        'payment_id', NEW.id,
        'booking_id', NEW.booking_id,
        'booking_record', to_jsonb(v_booking_record)
      )
    );
    RETURN NEW;
  END IF;

  -- Try to update driver saldo in drivers table first
  UPDATE drivers 
  SET 
    saldo = COALESCE(saldo, 0) - v_payment_amount,
    updated_at = NOW()
  WHERE id = v_driver_id;

  -- If no rows were affected, try users table
  IF NOT FOUND THEN
    UPDATE users 
    SET 
      saldo = COALESCE(saldo, 0) - v_payment_amount,
      updated_at = NOW()
    WHERE id = v_driver_id;
    
    IF NOT FOUND THEN
      -- Create debug_log table if it doesn't exist
      CREATE TABLE IF NOT EXISTS debug_log (
        id SERIAL PRIMARY KEY,
        message TEXT,
        data JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      );
      
      -- Log that no user/driver record was found
      INSERT INTO debug_log(message, data) VALUES (
        'Driver/User record not found for saldo update',
        jsonb_build_object(
          'payment_id', NEW.id,
          'driver_id', v_driver_id,
          'payment_amount', v_payment_amount
        )
      );
      RETURN NEW;
    END IF;
  END IF;

  -- Create debug_log table if it doesn't exist
  CREATE TABLE IF NOT EXISTS debug_log (
    id SERIAL PRIMARY KEY,
    message TEXT,
    data JSONB,
    created_at TIMESTAMP DEFAULT NOW()
  );
  
  -- Log successful saldo update
  INSERT INTO debug_log(message, data) VALUES (
    'Driver saldo updated successfully',
    jsonb_build_object(
      'payment_id', NEW.id,
      'driver_id', v_driver_id,
      'payment_amount', v_payment_amount,
      'saldo_deducted', v_payment_amount
    )
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Create debug_log table if it doesn't exist
  CREATE TABLE IF NOT EXISTS debug_log (
    id SERIAL PRIMARY KEY,
    message TEXT,
    data JSONB,
    created_at TIMESTAMP DEFAULT NOW()
  );
  
  -- Log error but don't fail the payment
  INSERT INTO debug_log(message, data) VALUES (
    'Error updating driver saldo',
    jsonb_build_object(
      'error', SQLERRM,
      'payment_id', NEW.id,
      'driver_id', v_driver_id,
      'payment_amount', v_payment_amount
    )
  );
  
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Create trigger to update driver saldo when payment is inserted
DROP TRIGGER IF EXISTS trigger_update_driver_saldo_on_payment ON payments;
CREATE TRIGGER trigger_update_driver_saldo_on_payment
  AFTER INSERT ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_driver_saldo_on_payment();

-- Also create trigger for payment updates (in case status changes from pending to paid or payment_status changes to completed)
DROP TRIGGER IF EXISTS trigger_update_driver_saldo_on_payment_update ON payments;
CREATE TRIGGER trigger_update_driver_saldo_on_payment_update
  AFTER UPDATE ON payments
  FOR EACH ROW
  WHEN ((OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'paid') OR 
        (OLD.payment_status IS DISTINCT FROM NEW.payment_status AND NEW.payment_status = 'completed'))
  EXECUTE FUNCTION update_driver_saldo_on_payment();

-- Create function to handle payment cancellation/deletion (restore saldo)
CREATE OR REPLACE FUNCTION restore_driver_saldo_on_payment_deletion()
RETURNS TRIGGER AS $$
DECLARE
  v_booking_record RECORD;
  v_driver_id UUID;
  v_payment_amount NUMERIC;
BEGIN
  -- Only process if this was a successful payment with a booking_id
  -- Check both status and payment_status columns for 'completed' or 'paid'
  IF OLD.booking_id IS NULL OR (OLD.status != 'paid' AND OLD.payment_status != 'completed') THEN
    RETURN OLD;
  END IF;

  -- Get the payment amount
  v_payment_amount := COALESCE(OLD.total_amount, 0);
  
  -- Skip if payment amount is 0 or negative
  IF v_payment_amount <= 0 THEN
    RETURN OLD;
  END IF;

  -- Get the booking record to find the driver
  SELECT * INTO v_booking_record 
  FROM bookings 
  WHERE id = OLD.booking_id;

  IF NOT FOUND THEN
    RETURN OLD;
  END IF;

  -- Determine the driver ID
  v_driver_id := COALESCE(v_booking_record.driver_id, v_booking_record.user_id, v_booking_record.customer_id);
  
  IF v_driver_id IS NULL THEN
    RETURN OLD;
  END IF;

  -- Try to restore driver saldo in drivers table first
  UPDATE drivers 
  SET 
    saldo = COALESCE(saldo, 0) + v_payment_amount,
    updated_at = NOW()
  WHERE id = v_driver_id;

  -- If no rows were affected, try users table
  IF NOT FOUND THEN
    UPDATE users 
    SET 
      saldo = COALESCE(saldo, 0) + v_payment_amount,
      updated_at = NOW()
    WHERE id = v_driver_id;
  END IF;

  -- Log saldo restoration
  INSERT INTO debug_log(message, data) VALUES (
    'Driver saldo restored after payment deletion',
    jsonb_build_object(
      'payment_id', OLD.id,
      'driver_id', v_driver_id,
      'payment_amount', v_payment_amount,
      'saldo_restored', v_payment_amount
    )
  );

  RETURN OLD;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail the deletion
  INSERT INTO debug_log(message, data) VALUES (
    'Error restoring driver saldo',
    jsonb_build_object(
      'error', SQLERRM,
      'payment_id', OLD.id,
      'driver_id', v_driver_id,
      'payment_amount', v_payment_amount
    )
  );
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for payment deletion/cancellation
DROP TRIGGER IF EXISTS trigger_restore_driver_saldo_on_payment_deletion ON payments;
CREATE TRIGGER trigger_restore_driver_saldo_on_payment_deletion
  AFTER DELETE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION restore_driver_saldo_on_payment_deletion();

-- Also handle status changes from paid to cancelled/failed or payment_status changes from completed to cancelled/failed
DROP TRIGGER IF EXISTS trigger_restore_driver_saldo_on_payment_cancel ON payments;
CREATE TRIGGER trigger_restore_driver_saldo_on_payment_cancel
  AFTER UPDATE ON payments
  FOR EACH ROW
  WHEN ((OLD.status = 'paid' AND NEW.status IN ('cancelled', 'failed', 'refunded')) OR
        (OLD.payment_status = 'completed' AND NEW.payment_status IN ('cancelled', 'failed', 'refunded')))
  EXECUTE FUNCTION restore_driver_saldo_on_payment_deletion();
