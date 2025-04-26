-- Add mock vehicles with proper columns
INSERT INTO vehicles (id, name, model, type, image, price, status)
VALUES 
('v1', 'Toyota Avanza 2022', 'Toyota Avanza', 'MPV', 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&q=80', 250000, 'available'),
('v2', 'Toyota Avanza 2021', 'Toyota Avanza', 'MPV', 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&q=80', 230000, 'available'),
('v3', 'Honda Jazz RS', 'Honda Jazz', 'Hatchback', 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&q=80', 300000, 'available'),
('v4', 'Honda Jazz S', 'Honda Jazz', 'Hatchback', 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&q=80', 280000, 'available'),
('v5', 'Suzuki Ertiga', 'Suzuki Ertiga', 'MPV', 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800&q=80', 270000, 'available')
ON CONFLICT (id) DO NOTHING;