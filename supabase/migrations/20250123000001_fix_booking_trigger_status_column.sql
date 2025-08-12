-- Fix the update_booking_payment_amounts trigger function to remove references to the old 'status' column
-- The 'status' column in bookings table was renamed to 'bookings_status'

CREATE OR REPLACE FUNCTION update_booking_payment_amounts()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the booking's paid_amount and remaining_payments
    UPDATE bookings 
    SET 
        paid_amount = COALESCE((
            SELECT SUM(total_amount) 
            FROM payments 
            WHERE booking_id = NEW.booking_id
        ), 0),
        remaining_payments = GREATEST(0, total_amount - COALESCE((
            SELECT SUM(total_amount) 
            FROM payments 
            WHERE booking_id = NEW.booking_id
        ), 0))
    WHERE id = NEW.booking_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Also update the handle_payment_deletion function
CREATE OR REPLACE FUNCTION handle_payment_deletion()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the booking's paid_amount and remaining_payments after deletion
    UPDATE bookings 
    SET 
        paid_amount = COALESCE((
            SELECT SUM(total_amount) 
            FROM payments 
            WHERE booking_id = OLD.booking_id
        ), 0),
        remaining_payments = GREATEST(0, total_amount - COALESCE((
            SELECT SUM(total_amount) 
            FROM payments 
            WHERE booking_id = OLD.booking_id
        ), 0))
    WHERE id = OLD.booking_id;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;
