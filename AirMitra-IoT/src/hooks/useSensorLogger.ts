import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SensorData {
  temperature: number;
  humidity: number;
  motionState: boolean;
  bulbState: 'ON' | 'OFF';
  fanState: 'ON' | 'OFF';
  fanSpeed: number;
  rgbColor: string;
  mode: 'AUTO' | 'MANUAL';
}

export const useSensorLogger = (sensorData: SensorData) => {
  const lastLoggedData = useRef<string>('');
  const lastMotionState = useRef<boolean>(false);

  useEffect(() => {
    const interval = setInterval(async () => {
      const currentDataStr = JSON.stringify(sensorData);
      
      // Only log if data has changed
      if (currentDataStr === lastLoggedData.current) {
        return;
      }

      try {
        // Log sensor data
        const { error: sensorError } = await supabase
          .from('sensor_data')
          .insert({
            temperature: sensorData.temperature,
            humidity: sensorData.humidity,
            motion_detected: sensorData.motionState,
            timestamp: new Date().toISOString(),
          });

        if (sensorError) {
          console.error('Error logging sensor data:', sensorError);
        }

        // Log device states
        const { error: deviceError } = await supabase
          .from('device_states')
          .insert({
            bulb_state: sensorData.bulbState,
            fan_state: sensorData.fanState,
            fan_speed: sensorData.fanSpeed,
            rgb_color: sensorData.rgbColor,
            mode: sensorData.mode,
            timestamp: new Date().toISOString(),
          });

        if (deviceError) {
          console.error('Error logging device states:', deviceError);
        }

        // Log motion state change event if it changed
        if (sensorData.motionState !== lastMotionState.current) {
          await supabase.from('system_events').insert({
            event_type: 'motion_detection',
            event_data: { 
              motion_state: sensorData.motionState ? 'DETECTED' : 'NONE',
              temperature: sensorData.temperature,
              humidity: sensorData.humidity
            } as any,
            description: sensorData.motionState 
              ? 'Motion detected' 
              : 'Motion cleared (no motion for 30 seconds)',
            timestamp: new Date().toISOString(),
          });
          
          console.log(`🚶 Motion ${sensorData.motionState ? 'DETECTED' : 'CLEARED'} - logged to system events`);
          lastMotionState.current = sensorData.motionState;
        }

        // Log general data update event
        await supabase.from('system_events').insert({
          event_type: 'mqtt_data_logged',
          event_data: sensorData as any,
          description: `Logged sensor and device data`,
          timestamp: new Date().toISOString(),
        });

        lastLoggedData.current = currentDataStr;
        console.log('📝 Sensor and device data logged successfully');
      } catch (error) {
        console.error('Error in sensor logger:', error);
      }
    }, 10000); // Log every 10 seconds

    return () => clearInterval(interval);
  }, [sensorData]);
};
