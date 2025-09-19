-- Create table for storing Leezenbox (bike storage) information
CREATE TABLE IF NOT EXISTS leezenbox (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address VARCHAR(500) NOT NULL,
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    num_lockers_with_power INTEGER DEFAULT 0,
    postcode VARCHAR(10) NOT NULL,
    city VARCHAR(255) NOT NULL,
    capacity INTEGER NOT NULL,
    ttn_location_key VARCHAR(255) NOT NULL,
    demo BOOLEAN DEFAULT false,
    default_location BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    -- Create unique constraint for TTN location key
    CONSTRAINT unique_ttn_location_key UNIQUE (ttn_location_key)
);

-- Create table for storing TTN (The Things Network) sensor data
CREATE TABLE IF NOT EXISTS ttn_data (
    id SERIAL PRIMARY KEY,
    device_id VARCHAR(255) NOT NULL,
    received_at TIMESTAMPTZ NOT NULL,
    confidence_threshold DECIMAL(3,2) NOT NULL,
    location VARCHAR(255) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    total_detected INTEGER NOT NULL,
    predictions JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    -- Create unique constraint to prevent duplicate records
    CONSTRAINT unique_device_timestamp UNIQUE (device_id, timestamp)
);

-- Create indexes for better query performance on leezenbox
CREATE INDEX IF NOT EXISTS idx_leezenbox_ttn_location_key ON leezenbox(ttn_location_key);
CREATE INDEX IF NOT EXISTS idx_leezenbox_city ON leezenbox(city);
CREATE INDEX IF NOT EXISTS idx_leezenbox_postcode ON leezenbox(postcode);
CREATE INDEX IF NOT EXISTS idx_leezenbox_demo ON leezenbox(demo);
CREATE INDEX IF NOT EXISTS idx_leezenbox_default_location ON leezenbox(default_location);

-- Create indexes for better query performance on ttn_data
CREATE INDEX IF NOT EXISTS idx_ttn_data_device_id ON ttn_data(device_id);
CREATE INDEX IF NOT EXISTS idx_ttn_data_timestamp ON ttn_data(timestamp);
CREATE INDEX IF NOT EXISTS idx_ttn_data_location ON ttn_data(location);
CREATE INDEX IF NOT EXISTS idx_ttn_data_received_at ON ttn_data(received_at);

-- Create a GIN index on the predictions JSONB column for efficient JSON queries
CREATE INDEX IF NOT EXISTS idx_ttn_data_predictions ON ttn_data USING GIN(predictions);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at on row updates for leezenbox
DROP TRIGGER IF EXISTS update_leezenbox_updated_at ON leezenbox;
CREATE TRIGGER update_leezenbox_updated_at
    BEFORE UPDATE ON leezenbox
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to automatically update updated_at on row updates for ttn_data
DROP TRIGGER IF EXISTS update_ttn_data_updated_at ON ttn_data;
CREATE TRIGGER update_ttn_data_updated_at
    BEFORE UPDATE ON ttn_data
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation on leezenbox table
COMMENT ON TABLE leezenbox IS 'Stores information about Leezenbox bike storage locations';
COMMENT ON COLUMN leezenbox.id IS 'Unique identifier for the Leezenbox';
COMMENT ON COLUMN leezenbox.name IS 'Display name of the Leezenbox location';
COMMENT ON COLUMN leezenbox.address IS 'Street address of the Leezenbox';
COMMENT ON COLUMN leezenbox.latitude IS 'GPS latitude coordinate';
COMMENT ON COLUMN leezenbox.longitude IS 'GPS longitude coordinate';
COMMENT ON COLUMN leezenbox.num_lockers_with_power IS 'Number of lockers with power outlets';
COMMENT ON COLUMN leezenbox.postcode IS 'Postal code of the location';
COMMENT ON COLUMN leezenbox.city IS 'City where the Leezenbox is located';
COMMENT ON COLUMN leezenbox.capacity IS 'Total number of bike parking spaces';
COMMENT ON COLUMN leezenbox.ttn_location_key IS 'Location key used in TTN data for mapping sensor data to this Leezenbox';
COMMENT ON COLUMN leezenbox.demo IS 'Whether this is a demo/test location';
COMMENT ON COLUMN leezenbox.default_location IS 'Whether this location is shown by default in the interface';

-- Add comments for documentation on ttn_data table
COMMENT ON TABLE ttn_data IS 'Stores sensor data from TTN (The Things Network) devices for bike/saddle detection';
COMMENT ON COLUMN ttn_data.device_id IS 'Unique identifier for the TTN device';
COMMENT ON COLUMN ttn_data.received_at IS 'Timestamp when the data was received by TTN';
COMMENT ON COLUMN ttn_data.confidence_threshold IS 'Minimum confidence threshold used for predictions';
COMMENT ON COLUMN ttn_data.location IS 'Location identifier where the device is installed (maps to leezenbox.ttn_location_key)';
COMMENT ON COLUMN ttn_data.timestamp IS 'Timestamp when the sensor data was captured';
COMMENT ON COLUMN ttn_data.total_detected IS 'Total number of objects detected in this reading';
COMMENT ON COLUMN ttn_data.predictions IS 'JSON array containing detected objects with bounding boxes, categories, and confidence scores';

-- Insert seed data for Leezenbox locations
INSERT INTO leezenbox (id, name, address, latitude, longitude, num_lockers_with_power, postcode, city, capacity, ttn_location_key, demo, default_location) VALUES
(2, 'Leezenbox Bahnhof Amelsbühren', 'Deermannstr. 40', 51.88493280, 7.59955134, 0, '48163', 'Münster-Amelsbüren', 40, 'amelsbueren', true, true),
(3, 'Leezenbox Bahnhof Hiltrup', 'Bergiusstr. 5', 51.90502758, 7.65393653, 0, '48165', 'Münster-Hiltrup', 40, 'hiltrup', true, true),
(4, 'Leezenbox Bahnhof Roxel', 'Pienersallee', 51.94644583, 7.52669378, 9, '48161', 'Münster-Roxel', 40, 'roxel', true, true),
(5, 'Leezenbox Bahnhof Mecklenbeck', 'Weseler Straße', 51.92469046, 7.57946964, 0, '48163', 'Münster-Mecklenbeck', 40, 'Mecklenbeck', true, true),
(8, 'Leezenbox Bahnhof Albachten', 'Am Lindenkamp 17', 51.91461777, 7.52735748, 0, '48163', 'Münster-Albachten', 40, 'albachten', true, true),
(16, 'Dreizehner-Denkmal', 'Promenade', 51.95806000, 7.61650000, 0, '48149', 'Münster', 3, 'Rudolf-Harbig-Weg', false, true)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    address = EXCLUDED.address,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    num_lockers_with_power = EXCLUDED.num_lockers_with_power,
    postcode = EXCLUDED.postcode,
    city = EXCLUDED.city,
    capacity = EXCLUDED.capacity,
    ttn_location_key = EXCLUDED.ttn_location_key,
    demo = EXCLUDED.demo,
    default_location = EXCLUDED.default_location,
    updated_at = CURRENT_TIMESTAMP;

-- Update the sequence to ensure new inserts don't conflict with existing IDs
SELECT setval('leezenbox_id_seq', (SELECT MAX(id) FROM leezenbox));
