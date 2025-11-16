-- Add motion_detected column to sensor_data table
ALTER TABLE public.sensor_data 
ADD COLUMN motion_detected boolean NOT NULL DEFAULT false;