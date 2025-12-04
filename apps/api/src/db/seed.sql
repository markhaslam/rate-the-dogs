-- Seed breeds
INSERT OR IGNORE INTO breeds (name, slug) VALUES
  ('Labrador Retriever', 'labrador-retriever'),
  ('German Shepherd', 'german-shepherd'),
  ('Golden Retriever', 'golden-retriever'),
  ('French Bulldog', 'french-bulldog'),
  ('Bulldog', 'bulldog'),
  ('Poodle', 'poodle'),
  ('Beagle', 'beagle'),
  ('Rottweiler', 'rottweiler'),
  ('Dachshund', 'dachshund'),
  ('Corgi', 'corgi'),
  ('Husky', 'husky'),
  ('Boxer', 'boxer'),
  ('Shih Tzu', 'shih-tzu'),
  ('Pomeranian', 'pomeranian'),
  ('Border Collie', 'border-collie'),
  ('Mixed Breed', 'mixed-breed'),
  ('Unknown', 'unknown');

-- Seed sample dogs with placeholder images
INSERT OR IGNORE INTO dogs (id, name, image_key, breed_id, status) VALUES
  (1, 'Max', 'dogs/sample-1.jpg', 1, 'approved'),
  (2, 'Bella', 'dogs/sample-2.jpg', 3, 'approved'),
  (3, 'Charlie', 'dogs/sample-3.jpg', 4, 'approved'),
  (4, 'Luna', 'dogs/sample-4.jpg', 11, 'approved'),
  (5, 'Cooper', 'dogs/sample-5.jpg', 10, 'approved'),
  (6, 'Daisy', 'dogs/sample-6.jpg', 7, 'approved'),
  (7, 'Rocky', 'dogs/sample-7.jpg', 2, 'approved'),
  (8, 'Sadie', 'dogs/sample-8.jpg', 6, 'approved'),
  (9, 'Buddy', 'dogs/sample-9.jpg', 1, 'approved'),
  (10, 'Molly', 'dogs/sample-10.jpg', 3, 'approved'),
  (11, 'Duke', 'dogs/sample-11.jpg', 5, 'approved'),
  (12, 'Chloe', 'dogs/sample-12.jpg', 14, 'approved'),
  (13, 'Bear', 'dogs/sample-13.jpg', 8, 'approved'),
  (14, 'Zoey', 'dogs/sample-14.jpg', 9, 'approved'),
  (15, 'Tucker', 'dogs/sample-15.jpg', 15, 'approved'),
  (16, 'Maggie', 'dogs/sample-16.jpg', 13, 'approved'),
  (17, 'Oscar', 'dogs/sample-17.jpg', 12, 'approved'),
  (18, 'Sophie', 'dogs/sample-18.jpg', 2, 'approved'),
  (19, 'Winston', 'dogs/sample-19.jpg', 5, 'approved'),
  (20, 'Penny', 'dogs/sample-20.jpg', 16, 'approved'),
  (21, 'Murphy', 'dogs/sample-21.jpg', 1, 'approved'),
  (22, 'Gracie', 'dogs/sample-22.jpg', 3, 'approved'),
  (23, 'Bentley', 'dogs/sample-23.jpg', 4, 'approved'),
  (24, 'Rosie', 'dogs/sample-24.jpg', 7, 'approved'),
  (25, 'Zeus', 'dogs/sample-25.jpg', 11, 'approved');

-- Add some sample ratings
INSERT OR IGNORE INTO ratings (dog_id, value, anon_id) VALUES
  (1, 4.5, 'seed-user-1'),
  (1, 5.0, 'seed-user-2'),
  (2, 4.0, 'seed-user-1'),
  (2, 4.5, 'seed-user-2'),
  (3, 5.0, 'seed-user-1'),
  (4, 4.0, 'seed-user-1'),
  (5, 5.0, 'seed-user-1'),
  (5, 4.5, 'seed-user-2');
