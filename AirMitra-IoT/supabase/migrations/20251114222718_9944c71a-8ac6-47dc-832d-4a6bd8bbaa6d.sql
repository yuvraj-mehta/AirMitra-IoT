-- Create enum for device states
CREATE TYPE device_state AS ENUM ('ON', 'OFF');

-- Create enum for mode
CREATE TYPE device_mode AS ENUM ('AUTO', 'MANUAL');

-- Table for storing sensor readings (temp, humidity)
CREATE TABLE sensor_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  temperature DECIMAL(5,2) NOT NULL,
  humidity DECIMAL(5,2) NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table for device states (bulb, fan)
CREATE TABLE device_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bulb_state device_state NOT NULL,
  fan_state device_state NOT NULL,
  fan_speed INTEGER NOT NULL CHECK (fan_speed >= 0 AND fan_speed <= 100),
  rgb_color VARCHAR(7) NOT NULL DEFAULT '#FFFFFF',
  mode device_mode NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table for events/logs
CREATE TABLE system_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(50) NOT NULL,
  event_data JSONB NOT NULL,
  description TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE sensor_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_events ENABLE ROW LEVEL SECURITY;

-- Create policies (public read for dashboard, backend write via service role)
CREATE POLICY "Allow public read access" ON sensor_data FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON sensor_data FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read access" ON device_states FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON device_states FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read access" ON system_events FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON system_events FOR INSERT WITH CHECK (true);

-- Create indexes for better query performance
CREATE INDEX idx_sensor_data_timestamp ON sensor_data(timestamp DESC);
CREATE INDEX idx_device_states_timestamp ON device_states(timestamp DESC);
CREATE INDEX idx_system_events_timestamp ON system_events(timestamp DESC);
CREATE INDEX idx_system_events_type ON system_events(event_type);

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE sensor_data;
ALTER PUBLICATION supabase_realtime ADD TABLE device_states;
ALTER PUBLICATION supabase_realtime ADD TABLE system_events;