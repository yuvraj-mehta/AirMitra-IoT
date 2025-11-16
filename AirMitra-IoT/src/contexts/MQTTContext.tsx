import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from "react";
import mqtt from "mqtt";

interface SensorData {
  temperature: number;
  humidity: number;
  motionState: boolean;
  bulbState: "ON" | "OFF";
  fanState: "ON" | "OFF";
  fanSpeed: number;
  rgbColor: string;
  mode: "AUTO" | "MANUAL";
}

interface MQTTContextType {
  isConnected: boolean;
  sensorData: SensorData;
  setBulb: (state: "ON" | "OFF") => void;
  setFan: (state: "ON" | "OFF") => void;
  setFanSpeed: (speed: number) => void;
  setRGBColor: (color: string) => void;
  toggleMode: () => void;
}

const defaultSensorData: SensorData = {
  temperature: 0,
  humidity: 0,
  motionState: false,
  bulbState: "OFF",
  fanState: "OFF",
  fanSpeed: 0,
  rgbColor: "#FFFFFF",
  mode: "AUTO",
};

const MQTTContext = createContext<MQTTContextType | undefined>(undefined);

export const MQTTProvider = ({ children }: { children: ReactNode }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [sensorData, setSensorData] = useState<SensorData>(defaultSensorData);
  const clientRef = useRef<mqtt.MqttClient | null>(null);
  const dataRef = useRef<SensorData>(defaultSensorData);

  useEffect(() => {
    console.log("🔌 Initializing MQTT connection...");

    clientRef.current = mqtt.connect("wss://broker.hivemq.com:8884/mqtt", {
      clientId: `AirMitra-IoT-${Math.random().toString(16).substr(2, 8)}`,
      clean: true,
      reconnectPeriod: 1000,
    });

    const client = clientRef.current;

    client.on("connect", () => {
      console.log("✅ MQTT Connected");
      setIsConnected(true);

      const topics = [
        "yuvraj/home/temp",
        "yuvraj/home/hum",
        "yuvraj/home/motion",
        "yuvraj/home/bulb",
        "yuvraj/home/fan",
        "yuvraj/home/fan/speed",
        "yuvraj/home/color",
        "yuvraj/home/mode",
      ];

      topics.forEach((topic) => {
        client.subscribe(topic, (err) => {
          if (!err) {
            console.log(`📡 Subscribed to ${topic}`);
          } else {
            console.error(`❌ Failed to subscribe to ${topic}:`, err);
          }
        });
      });
    });

    client.on("message", (topic, message) => {
      const payload = message.toString();
      console.log(`📩 MQTT [${topic}]: ${payload}`);

      const newData = { ...dataRef.current };

      if (topic === "yuvraj/home/temp") {
        newData.temperature = parseFloat(payload);
      } else if (topic === "yuvraj/home/hum") {
        newData.humidity = parseFloat(payload);
      } else if (topic === "yuvraj/home/motion") {
        newData.motionState = payload === "DETECTED";
      } else if (topic === "yuvraj/home/bulb") {
        newData.bulbState = payload as "ON" | "OFF";
      } else if (topic === "yuvraj/home/fan") {
        newData.fanState = payload as "ON" | "OFF";
      } else if (topic === "yuvraj/home/fan/speed") {
        newData.fanSpeed = parseInt(payload);
      } else if (topic === "yuvraj/home/color") {
        newData.rgbColor = payload;
      } else if (topic === "yuvraj/home/mode") {
        newData.mode = payload as "AUTO" | "MANUAL";
      }

      dataRef.current = newData;
      setSensorData(newData);
    });

    client.on("error", (err) => {
      console.error("❌ MQTT Error:", err);
      setIsConnected(false);
    });

    client.on("close", () => {
      console.log("🔌 MQTT Disconnected");
      setIsConnected(false);
    });

    // Cleanup only when app unmounts (page closes)
    return () => {
      console.log("👋 Closing MQTT connection");
      client.end();
    };
  }, []);

  const setBulb = (state: "ON" | "OFF") => {
    if (clientRef.current?.connected) {
      clientRef.current.publish("yuvraj/home/control/bulb", state);
      console.log(`💡 Published bulb command: ${state}`);
    }
  };

  const setFan = (state: "ON" | "OFF") => {
    if (clientRef.current?.connected) {
      clientRef.current.publish("yuvraj/home/control/fan", state);
      console.log(`🌬 Published fan command: ${state}`);
    }
  };

  const setFanSpeed = (speed: number) => {
    if (clientRef.current?.connected) {
      clientRef.current.publish(
        "yuvraj/home/control/fan/speed",
        speed.toString()
      );
      console.log(`🌀 Published fan speed: ${speed}`);
    }
  };

  const setRGBColor = (color: string) => {
    if (clientRef.current?.connected) {
      const upperCaseColor = color.toUpperCase();
      clientRef.current.publish("yuvraj/home/control/color", upperCaseColor);
      console.log(
        `🎨 Published RGB color to yuvraj/home/control/color: ${upperCaseColor}`
      );
    } else {
      console.error("❌ Cannot publish color: MQTT client not connected");
    }
  };

  const toggleMode = () => {
    if (clientRef.current?.connected) {
      clientRef.current.publish("yuvraj/home/control/mode", "TOGGLE");
      console.log("🔄 Published mode toggle");
    }
  };

  return (
    <MQTTContext.Provider
      value={{
        isConnected,
        sensorData,
        setBulb,
        setFan,
        setFanSpeed,
        setRGBColor,
        toggleMode,
      }}
    >
      {children}
    </MQTTContext.Provider>
  );
};

export const useMQTT = () => {
  const context = useContext(MQTTContext);
  if (context === undefined) {
    throw new Error("useMQTT must be used within an MQTTProvider");
  }
  return context;
};
