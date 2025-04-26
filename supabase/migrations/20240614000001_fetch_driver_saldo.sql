-- Create a function to fetch driver saldo
CREATE OR REPLACE FUNCTION get_driver_saldo(driver_id UUID)
RETURNS INTEGER AS $$
DECLARE
    driver_saldo INTEGER;
BEGIN
    SELECT saldo INTO driver_saldo FROM drivers WHERE id = driver_id;
    RETURN COALESCE(driver_saldo, 0);
END;
$$ LANGUAGE plpgsql;

-- Enable realtime for drivers table if not already enabled
alter publication supabase_realtime add table drivers;
