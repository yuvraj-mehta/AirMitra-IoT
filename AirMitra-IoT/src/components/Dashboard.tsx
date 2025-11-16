import { Card } from "@/components/ui/card";
import SensorCard from "./dashboard/SensorCard";
import DeviceControls from "./dashboard/DeviceControls";
import ModeIndicator from "./dashboard/ModeIndicator";
import {
  Thermometer,
  Droplets,
  Lightbulb,
  Fan,
  Palette,
  Activity,
} from "lucide-react";
import { useMQTT } from "@/contexts/MQTTContext";
import { useSensorLogger } from "@/hooks/useSensorLogger";

const Dashboard = () => {
  const {
    isConnected,
    sensorData,
    setBulb,
    setFan,
    setFanSpeed,
    setRGBColor,
    toggleMode,
  } = useMQTT();

  // Log sensor data to database
  useSensorLogger(sensorData);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            AirMitra-IoT Dashboard
          </h1>
          <p className="text-muted-foreground">
            Real-time monitoring and control via MQTT
          </p>
          <div
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
              isConnected
                ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? "bg-primary animate-pulse" : "bg-muted-foreground"
              }`}
            />
            {isConnected ? "Connected to MQTT" : "Connecting..."}
          </div>
        </div>

        <ModeIndicator mode={sensorData.mode} isConnected={isConnected} />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
          <SensorCard
            icon={<Thermometer />}
            title="Temperature"
            value={`${sensorData.temperature.toFixed(1)}°C`}
            color="text-primary"
          />
          <SensorCard
            icon={<Droplets />}
            title="Humidity"
            value={`${sensorData.humidity.toFixed(1)}%`}
            color="text-accent"
          />
          <SensorCard
            icon={<Activity />}
            title="Motion"
            value={sensorData.motionState ? "DETECTED" : "NONE"}
            color={
              sensorData.motionState
                ? "text-destructive"
                : "text-muted-foreground"
            }
          />
          <SensorCard
            icon={<Lightbulb />}
            title="Bulb Status"
            value={sensorData.bulbState}
            color={
              sensorData.bulbState === "ON"
                ? "text-primary"
                : "text-muted-foreground"
            }
          />
          <SensorCard
            icon={<Fan />}
            title="Fan Status"
            value={`${sensorData.fanState} (${sensorData.fanSpeed}%)`}
            color={
              sensorData.fanState === "ON"
                ? "text-accent"
                : "text-muted-foreground"
            }
          />
          <SensorCard
            icon={<Palette />}
            title="RGB Color"
            value={
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded border border-border"
                  style={{ backgroundColor: sensorData.rgbColor }}
                />
                <span className="font-mono text-sm">{sensorData.rgbColor}</span>
              </div>
            }
            color="text-secondary"
          />
        </div>

        <DeviceControls
          currentState={{
            bulb_state: sensorData.bulbState,
            fan_state: sensorData.fanState,
            fan_speed: sensorData.fanSpeed,
            rgb_color: sensorData.rgbColor,
            mode: sensorData.mode,
          }}
          onBulbChange={setBulb}
          onFanChange={setFan}
          onFanSpeedChange={setFanSpeed}
          onColorChange={setRGBColor}
          onModeToggle={toggleMode}
        />
      </div>
    </div>
  );
};

export default Dashboard;
