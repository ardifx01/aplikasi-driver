-- Rename pickup_date to tanggalmulai and return_date to tanggalselesai
ALTER TABLE bookings
RENAME COLUMN pickup_date TO tanggalmulai;

ALTER TABLE bookings
RENAME COLUMN return_date TO tanggalselesai;
