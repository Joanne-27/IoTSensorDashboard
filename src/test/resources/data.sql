-- 1. Clean up to avoid "Duplicate Entry" errors
DELETE FROM readings;
DELETE FROM devices;
DELETE FROM users;

-- 2. Insert users from your users.csv
INSERT INTO users (id, username, password_hash, role) VALUES
                                                          (1, 'admin@mail.com', '$2a$12$QZiCKIJqXdd88gb1QApHTe6RrKeflyF0WC2K1ldfl1K1A/s2kTJHm', 'ROLE_ADMIN'),
                                                          (2, 'joanne@mail.com', '$2a$12$8WqvaBNnEZqkcRrSGw.89Op80LBCztR4N1RECdYHlRaWOH4KYTOaK', 'ROLE_USER'),
                                                          (3, 'test@example.com', '$2a$10$r5fRKIylQANOK4kc8ESvFeu.TGAqr204zADtRA6JORS1Z1vuFSSwe', 'ROLE_USER'),
                                                          (4, 'bob@mail.com', '$2a$12$M6s1f3h4Jirf0oS7tvLLDeTNZaknSQ0pQkdKRS9lglvcNMRmqGlhK', 'ROLE_USER'),
                                                          (5, 'test-admin@example.com', '$2a$10$vKZXERyQUsYD6qwKdjkzneba3a5/AJoyKsubgjLlyZ65T0j7z3zS.', 'ROLE_ADMIN');

-- 3. Add at least one device for your Karate tests to find
INSERT INTO devices (id, name, type, unit, user_id)
VALUES (101, 'Main Sensor', 'Temperature', 'Celsius', 1);