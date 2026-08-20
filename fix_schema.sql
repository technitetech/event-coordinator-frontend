USE event_coordinator;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    phone VARCHAR(40),
    role VARCHAR(20) DEFAULT 'customer',
    password_hash VARCHAR(255) NOT NULL
);

ALTER TABLE event_bookings 
    ADD COLUMN user_id INT,
    ADD COLUMN theme VARCHAR(40),
    ADD COLUMN venue_name VARCHAR(120),
    ADD COLUMN menu_name VARCHAR(120),
    ADD COLUMN decoration_name VARCHAR(120),
    ADD COLUMN budget INT;

ALTER TABLE event_bookings ADD CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
