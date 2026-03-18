-- SmartPark Parking Reservation System
-- PostgreSQL Schema (translated from Oracle specification)

CREATE TABLE users (
    user_id       SERIAL PRIMARY KEY,
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role          VARCHAR(20) NOT NULL
                  CHECK (role IN ('driver', 'admin')),
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE vehicles (
    vehicle_id    SERIAL PRIMARY KEY,
    user_id       INT NOT NULL,
    license_plate VARCHAR(20) UNIQUE NOT NULL,
    make          VARCHAR(50) NOT NULL,
    model         VARCHAR(50) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE parking_lots (
    lot_id         SERIAL PRIMARY KEY,
    name           VARCHAR(100) NOT NULL,
    total_capacity INT NOT NULL
);

CREATE TABLE parking_slots (
    lot_id      INT NOT NULL,
    slot_number VARCHAR(10) NOT NULL,
    floor_level INT NOT NULL,
    CONSTRAINT pk_parking_slots PRIMARY KEY (lot_id, slot_number),
    FOREIGN KEY (lot_id) REFERENCES parking_lots(lot_id) ON DELETE CASCADE
);

CREATE TABLE reservations (
    reservation_id SERIAL PRIMARY KEY,
    user_id        INT NOT NULL,
    vehicle_id     INT NOT NULL,
    lot_id         INT NOT NULL,
    slot_number    VARCHAR(10) NOT NULL,
    start_time     TIMESTAMP NOT NULL,
    end_time       TIMESTAMP NOT NULL,
    status         VARCHAR(20) NOT NULL
                   CHECK (status IN ('active', 'completed', 'cancelled')),

    CONSTRAINT chk_reservation_times CHECK (end_time > start_time),
    CONSTRAINT uq_slot_booking UNIQUE (lot_id, slot_number, start_time, end_time),

    FOREIGN KEY (user_id)    REFERENCES users(user_id),
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(vehicle_id),
    FOREIGN KEY (lot_id, slot_number) REFERENCES parking_slots(lot_id, slot_number)
);

-- Speeds up overlap checks used when creating reservations and querying availability
CREATE INDEX idx_reservations_slot_time
    ON reservations (lot_id, slot_number, start_time, end_time)
    WHERE status = 'active';

CREATE INDEX idx_reservations_user
    ON reservations (user_id, start_time DESC);

CREATE TABLE payments (
    payment_id     SERIAL PRIMARY KEY,
    reservation_id INT NOT NULL UNIQUE,
    amount         DECIMAL(10, 2) NOT NULL,
    payment_date   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    payment_status VARCHAR(20) NOT NULL
                   CHECK (payment_status IN ('pending', 'paid', 'failed')),
    FOREIGN KEY (reservation_id) REFERENCES reservations(reservation_id)
);

-- Seed data: Test users (password: password)
INSERT INTO users (email, password_hash, role) VALUES
('alice@test.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'driver'),
('bob@test.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'driver'),
('carol@test.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'driver'),
('dave@test.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'driver');

-- Seed data: Parking lots
INSERT INTO parking_lots (name, total_capacity) VALUES
('North Campus Lot', 30),
('South Campus Lot', 24),
('Central Garage', 48);

-- Seed data: Parking slots for North Campus Lot (lot_id=1)
INSERT INTO parking_slots (lot_id, slot_number, floor_level) VALUES
(1, 'A-01', 1), (1, 'A-02', 1), (1, 'A-03', 1), (1, 'A-04', 1), (1, 'A-05', 1),
(1, 'A-06', 1), (1, 'A-07', 1), (1, 'A-08', 1), (1, 'A-09', 1), (1, 'A-10', 1),
(1, 'B-01', 1), (1, 'B-02', 1), (1, 'B-03', 1), (1, 'B-04', 1), (1, 'B-05', 1),
(1, 'B-06', 1), (1, 'B-07', 1), (1, 'B-08', 1), (1, 'B-09', 1), (1, 'B-10', 1),
(1, 'C-01', 1), (1, 'C-02', 1), (1, 'C-03', 1), (1, 'C-04', 1), (1, 'C-05', 1),
(1, 'C-06', 1), (1, 'C-07', 1), (1, 'C-08', 1), (1, 'C-09', 1), (1, 'C-10', 1);

-- Seed data: Parking slots for South Campus Lot (lot_id=2)
INSERT INTO parking_slots (lot_id, slot_number, floor_level) VALUES
(2, 'A-01', 1), (2, 'A-02', 1), (2, 'A-03', 1), (2, 'A-04', 1), (2, 'A-05', 1),
(2, 'A-06', 1), (2, 'A-07', 1), (2, 'A-08', 1), (2, 'A-09', 1), (2, 'A-10', 1),
(2, 'A-11', 1), (2, 'A-12', 1),
(2, 'B-01', 1), (2, 'B-02', 1), (2, 'B-03', 1), (2, 'B-04', 1), (2, 'B-05', 1),
(2, 'B-06', 1), (2, 'B-07', 1), (2, 'B-08', 1), (2, 'B-09', 1), (2, 'B-10', 1),
(2, 'B-11', 1), (2, 'B-12', 1);

-- Seed data: Parking slots for Central Garage (lot_id=3), multi-floor
INSERT INTO parking_slots (lot_id, slot_number, floor_level) VALUES
(3, '1-A01', 1), (3, '1-A02', 1), (3, '1-A03', 1), (3, '1-A04', 1),
(3, '1-A05', 1), (3, '1-A06', 1), (3, '1-A07', 1), (3, '1-A08', 1),
(3, '1-B01', 1), (3, '1-B02', 1), (3, '1-B03', 1), (3, '1-B04', 1),
(3, '1-B05', 1), (3, '1-B06', 1), (3, '1-B07', 1), (3, '1-B08', 1),
(3, '2-A01', 2), (3, '2-A02', 2), (3, '2-A03', 2), (3, '2-A04', 2),
(3, '2-A05', 2), (3, '2-A06', 2), (3, '2-A07', 2), (3, '2-A08', 2),
(3, '2-B01', 2), (3, '2-B02', 2), (3, '2-B03', 2), (3, '2-B04', 2),
(3, '2-B05', 2), (3, '2-B06', 2), (3, '2-B07', 2), (3, '2-B08', 2),
(3, '3-A01', 3), (3, '3-A02', 3), (3, '3-A03', 3), (3, '3-A04', 3),
(3, '3-A05', 3), (3, '3-A06', 3), (3, '3-A07', 3), (3, '3-A08', 3),
(3, '3-B01', 3), (3, '3-B02', 3), (3, '3-B03', 3), (3, '3-B04', 3),
(3, '3-B05', 3), (3, '3-B06', 3), (3, '3-B07', 3), (3, '3-B08', 3);

-- Seed data: Test vehicles (users 1-4 = alice, bob, carol, dave)
INSERT INTO vehicles (user_id, license_plate, make, model) VALUES
(1, 'ABC-1234', 'Toyota', 'Camry'),
(1, 'XYZ-5678', 'Honda', 'Civic'),
(2, 'DEF-9012', 'Ford', 'F-150'),
(2, 'GHI-3456', 'Chevrolet', 'Malibu'),
(3, 'JKL-7890', 'Tesla', 'Model 3'),
(4, 'MNO-2345', 'Nissan', 'Altima'),
(4, 'PQR-6789', 'Hyundai', 'Sonata');

-- Seed data: Test reservations (lots of bookings across past, active, future, and cancelled)
-- Completed reservations (past)
INSERT INTO reservations (user_id, vehicle_id, lot_id, slot_number, start_time, end_time, status) VALUES
(1, 1, 1, 'A-01', CURRENT_TIMESTAMP - INTERVAL '7 days', CURRENT_TIMESTAMP - INTERVAL '7 days' + INTERVAL '2 hours', 'completed'),
(1, 1, 1, 'A-02', CURRENT_TIMESTAMP - INTERVAL '6 days', CURRENT_TIMESTAMP - INTERVAL '6 days' + INTERVAL '3 hours', 'completed'),
(2, 3, 1, 'B-01', CURRENT_TIMESTAMP - INTERVAL '5 days', CURRENT_TIMESTAMP - INTERVAL '5 days' + INTERVAL '1 hour', 'completed'),
(3, 5, 2, 'A-01', CURRENT_TIMESTAMP - INTERVAL '4 days', CURRENT_TIMESTAMP - INTERVAL '4 days' + INTERVAL '4 hours', 'completed'),
(4, 6, 2, 'A-05', CURRENT_TIMESTAMP - INTERVAL '3 days', CURRENT_TIMESTAMP - INTERVAL '3 days' + INTERVAL '2 hours', 'completed'),
(1, 2, 3, '1-A01', CURRENT_TIMESTAMP - INTERVAL '2 days', CURRENT_TIMESTAMP - INTERVAL '2 days' + INTERVAL '1 hour', 'completed'),
(2, 4, 3, '1-B02', CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP - INTERVAL '1 day' + INTERVAL '5 hours', 'completed'),
(3, 5, 1, 'C-01', CURRENT_TIMESTAMP - INTERVAL '10 days', CURRENT_TIMESTAMP - INTERVAL '10 days' + INTERVAL '2 hours', 'completed'),
(4, 7, 2, 'B-01', CURRENT_TIMESTAMP - INTERVAL '8 days', CURRENT_TIMESTAMP - INTERVAL '8 days' + INTERVAL '3 hours', 'completed');

-- Active reservations (overlapping with now or near future)
INSERT INTO reservations (user_id, vehicle_id, lot_id, slot_number, start_time, end_time, status) VALUES
(1, 1, 1, 'A-03', CURRENT_TIMESTAMP - INTERVAL '30 minutes', CURRENT_TIMESTAMP + INTERVAL '1 hour', 'active'),
(2, 3, 1, 'A-04', CURRENT_TIMESTAMP - INTERVAL '1 hour', CURRENT_TIMESTAMP + INTERVAL '2 hours', 'active'),
(3, 5, 1, 'A-05', CURRENT_TIMESTAMP + INTERVAL '1 hour', CURRENT_TIMESTAMP + INTERVAL '3 hours', 'active'),
(4, 6, 1, 'A-06', CURRENT_TIMESTAMP + INTERVAL '2 hours', CURRENT_TIMESTAMP + INTERVAL '4 hours', 'active'),
(1, 2, 1, 'B-02', CURRENT_TIMESTAMP + INTERVAL '30 minutes', CURRENT_TIMESTAMP + INTERVAL '2 hours', 'active'),
(2, 4, 2, 'A-02', CURRENT_TIMESTAMP - INTERVAL '15 minutes', CURRENT_TIMESTAMP + INTERVAL '1 hour', 'active'),
(3, 5, 2, 'A-03', CURRENT_TIMESTAMP + INTERVAL '3 hours', CURRENT_TIMESTAMP + INTERVAL '5 hours', 'active'),
(4, 7, 2, 'A-04', CURRENT_TIMESTAMP + INTERVAL '4 hours', CURRENT_TIMESTAMP + INTERVAL '6 hours', 'active'),
(1, 1, 3, '1-A02', CURRENT_TIMESTAMP + INTERVAL '6 hours', CURRENT_TIMESTAMP + INTERVAL '8 hours', 'active'),
(2, 3, 3, '1-A03', CURRENT_TIMESTAMP + INTERVAL '12 hours', CURRENT_TIMESTAMP + INTERVAL '14 hours', 'active'),
(3, 5, 3, '2-A01', CURRENT_TIMESTAMP + INTERVAL '1 day', CURRENT_TIMESTAMP + INTERVAL '1 day' + INTERVAL '2 hours', 'active'),
(4, 6, 3, '2-A02', CURRENT_TIMESTAMP + INTERVAL '1 day' + INTERVAL '2 hours', CURRENT_TIMESTAMP + INTERVAL '1 day' + INTERVAL '4 hours', 'active');

-- Future active reservations
INSERT INTO reservations (user_id, vehicle_id, lot_id, slot_number, start_time, end_time, status) VALUES
(1, 2, 1, 'A-07', CURRENT_TIMESTAMP + INTERVAL '2 days', CURRENT_TIMESTAMP + INTERVAL '2 days' + INTERVAL '2 hours', 'active'),
(2, 4, 1, 'A-08', CURRENT_TIMESTAMP + INTERVAL '2 days' + INTERVAL '3 hours', CURRENT_TIMESTAMP + INTERVAL '2 days' + INTERVAL '5 hours', 'active'),
(3, 5, 1, 'B-03', CURRENT_TIMESTAMP + INTERVAL '3 days', CURRENT_TIMESTAMP + INTERVAL '3 days' + INTERVAL '1 hour', 'active'),
(4, 7, 2, 'A-06', CURRENT_TIMESTAMP + INTERVAL '3 days', CURRENT_TIMESTAMP + INTERVAL '3 days' + INTERVAL '3 hours', 'active'),
(1, 1, 2, 'A-07', CURRENT_TIMESTAMP + INTERVAL '4 days', CURRENT_TIMESTAMP + INTERVAL '4 days' + INTERVAL '4 hours', 'active'),
(2, 3, 3, '2-B01', CURRENT_TIMESTAMP + INTERVAL '4 days', CURRENT_TIMESTAMP + INTERVAL '4 days' + INTERVAL '2 hours', 'active'),
(3, 5, 3, '3-A01', CURRENT_TIMESTAMP + INTERVAL '5 days', CURRENT_TIMESTAMP + INTERVAL '5 days' + INTERVAL '6 hours', 'active'),
(4, 6, 1, 'C-02', CURRENT_TIMESTAMP + INTERVAL '5 days', CURRENT_TIMESTAMP + INTERVAL '5 days' + INTERVAL '1 hour', 'active');

-- Cancelled reservations
INSERT INTO reservations (user_id, vehicle_id, lot_id, slot_number, start_time, end_time, status) VALUES
(1, 1, 1, 'A-09', CURRENT_TIMESTAMP - INTERVAL '3 days', CURRENT_TIMESTAMP - INTERVAL '3 days' + INTERVAL '1 hour', 'cancelled'),
(2, 3, 1, 'A-10', CURRENT_TIMESTAMP - INTERVAL '2 days', CURRENT_TIMESTAMP - INTERVAL '2 days' + INTERVAL '2 hours', 'cancelled'),
(3, 5, 2, 'A-08', CURRENT_TIMESTAMP + INTERVAL '1 day', CURRENT_TIMESTAMP + INTERVAL '1 day' + INTERVAL '1 hour', 'cancelled'),
(4, 7, 2, 'A-09', CURRENT_TIMESTAMP + INTERVAL '6 days', CURRENT_TIMESTAMP + INTERVAL '6 days' + INTERVAL '2 hours', 'cancelled'),
(1, 2, 3, '1-B03', CURRENT_TIMESTAMP - INTERVAL '5 days', CURRENT_TIMESTAMP - INTERVAL '5 days' + INTERVAL '3 hours', 'cancelled');

-- Seed data: Payments for reservations (linked to reservation_id)
INSERT INTO payments (reservation_id, amount, payment_status) VALUES
(1, 5.00, 'paid'),
(2, 7.50, 'paid'),
(3, 2.50, 'paid'),
(4, 10.00, 'paid'),
(5, 5.00, 'paid'),
(6, 2.50, 'paid'),
(7, 12.50, 'paid'),
(8, 5.00, 'paid'),
(9, 7.50, 'paid'),
(10, 5.00, 'paid'),
(11, 5.00, 'paid'),
(12, 5.00, 'pending'),
(13, 7.50, 'pending'),
(14, 5.00, 'pending'),
(15, 5.00, 'pending'),
(16, 5.00, 'pending'),
(17, 5.00, 'paid'),
(18, 5.00, 'pending'),
(19, 5.00, 'pending'),
(20, 7.50, 'pending'),
(21, 5.00, 'pending'),
(22, 5.00, 'pending'),
(23, 5.00, 'pending'),
(24, 10.00, 'pending'),
(25, 5.00, 'pending'),
(26, 5.00, 'pending'),
(27, 15.00, 'pending'),
(28, 2.50, 'pending'),
(29, 2.50, 'pending'),
(30, 5.00, 'failed'),
(31, 2.50, 'failed'),
(32, 5.00, 'failed'),
(33, 2.50, 'failed'),
(34, 7.50, 'failed');
