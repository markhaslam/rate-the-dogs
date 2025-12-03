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
  (8, 'Sadie', 'dogs/sample-8.jpg', 6, 'approved');

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
