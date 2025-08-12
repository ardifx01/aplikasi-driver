-- Change the services_id column type in bookings table from varchar(10) to UUID
ALTER TABLE bookings ALTER COLUMN services_id TYPE UUID USING services_id::UUID;
