-- Διαγραφή και επαναδημιουργία της βάσης
DROP DATABASE IF EXISTS restaurant_reservation;
CREATE DATABASE restaurant_reservation;
USE restaurant_reservation;

-- Δημιουργία του πίνακα users
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Δημιουργία του πίνακα restaurants
CREATE TABLE restaurants (
    restaurant_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Δημιουργία του πίνακα reservations
CREATE TABLE reservations (
    reservation_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    restaurant_id INT NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    people_count INT NOT NULL,
    status ENUM('active', 'cancelled') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(restaurant_id) ON DELETE CASCADE
);

-- Προσθήκη εστιατορίων δοκιμής
INSERT INTO restaurants (name, location, description) VALUES
('Ελληνική Γωνιά', 'Αθήνα', 'Παραδοσιακή ελληνική κουζίνα με θέα την Ακρόπολη'),
('Ιταλικό Τραττόρια', 'Θεσσαλονίκη', 'Αυθεντική ιταλική κουζίνα με χειροποίητα ζυμαρικά'),
('Σούσι Εμπειρία', 'Πειραιάς', 'Η καλύτερη ιαπωνική κουζίνα στην πόλη');

-- Προσθήκη δοκιμαστικού χρήστη
INSERT INTO users (name, email, password) VALUES
('Maria', 'maria@example.com', '$2b$10$XrZ8kp3QGyVKZszPgByjqOG9i09KK3PRyY4QdkpqbDZw6bBEkFyWu');