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

-- Create indexes for better query performance
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

-- Create trigger to automatically update updated_at on row updates
DROP TRIGGER IF EXISTS update_ttn_data_updated_at ON ttn_data;
CREATE TRIGGER update_ttn_data_updated_at
    BEFORE UPDATE ON ttn_data
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE ttn_data IS 'Stores sensor data from TTN (The Things Network) devices for bike/saddle detection';
COMMENT ON COLUMN ttn_data.device_id IS 'Unique identifier for the TTN device';
COMMENT ON COLUMN ttn_data.received_at IS 'Timestamp when the data was received by TTN';
COMMENT ON COLUMN ttn_data.confidence_threshold IS 'Minimum confidence threshold used for predictions';
COMMENT ON COLUMN ttn_data.location IS 'Location identifier where the device is installed';
COMMENT ON COLUMN ttn_data.timestamp IS 'Timestamp when the sensor data was captured';
COMMENT ON COLUMN ttn_data.total_detected IS 'Total number of objects detected in this reading';
COMMENT ON COLUMN ttn_data.predictions IS 'JSON array containing detected objects with bounding boxes, categories, and confidence scores';
