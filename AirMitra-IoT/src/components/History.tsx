import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const History = () => {
  const [sensorHistory, setSensorHistory] = useState<any[]>([]);
  const [deviceHistory, setDeviceHistory] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [timePeriod, setTimePeriod] = useState<string>("24h");

  const getTimeRange = () => {
    const now = Date.now();
    switch (timePeriod) {
      case "1h": return now - 60 * 60 * 1000;
      case "6h": return now - 6 * 60 * 60 * 1000;
      case "24h": return now - 24 * 60 * 60 * 1000;
      case "7d": return now - 7 * 24 * 60 * 60 * 1000;
      case "30d": return now - 30 * 24 * 60 * 60 * 1000;
      default: return now - 24 * 60 * 60 * 1000;
    }
  };

  const formatTimeLabel = (timestamp: string) => {
    const date = new Date(timestamp);
    if (timePeriod === "1h" || timePeriod === "6h") {
      return format(date, "HH:mm");
    } else if (timePeriod === "24h") {
      return format(date, "HH:mm");
    } else {
      return format(date, "MM/dd HH:mm");
    }
  };

  useEffect(() => {
    const fetchHistory = async () => {
      const timeRange = new Date(getTimeRange()).toISOString();
      
      console.log(`📊 Fetching history for period: ${timePeriod} from ${timeRange}`);
      
      // Fetch sensor data for selected time period
      const { data: sensorData, error: sensorError } = await supabase
        .from("sensor_data")
        .select("*")
        .gte("timestamp", timeRange)
        .order("timestamp", { ascending: true });

      if (sensorError) {
        console.error("Error fetching sensor data:", sensorError);
      }

      if (sensorData) {
        console.log(`✅ Fetched ${sensorData.length} sensor records`);
        const motionCount = sensorData.filter(d => d.motion_detected).length;
        console.log(`🚶 Motion detected in ${motionCount} records`);
        
        setSensorHistory(sensorData.map(d => ({
          time: formatTimeLabel(d.timestamp),
          temperature: Number(d.temperature),
          humidity: Number(d.humidity),
          motion: d.motion_detected ? 100 : 0
        })));
      }

      // Fetch device states for selected time period
      const { data: deviceData, error: deviceError } = await supabase
        .from("device_states")
        .select("*")
        .gte("timestamp", timeRange)
        .order("timestamp", { ascending: true });

      if (deviceError) {
        console.error("Error fetching device data:", deviceError);
      }

      if (deviceData) {
        console.log(`✅ Fetched ${deviceData.length} device records`);
        const parsedData = deviceData.map(d => {
          // Parse RGB hex color into components
          const hex = d.rgb_color.replace('#', '');
          const r = parseInt(hex.substring(0, 2), 16);
          const g = parseInt(hex.substring(2, 4), 16);
          const b = parseInt(hex.substring(4, 6), 16);
          
          return {
            time: formatTimeLabel(d.timestamp),
            timestamp: d.timestamp,
            fanSpeed: d.fan_speed,
            bulbState: d.bulb_state === 'ON' ? 100 : 0,
            fanState: d.fan_state === 'ON' ? 100 : 0,
            rgbColor: d.rgb_color,
            red: r,
            green: g,
            blue: b
          };
        });
        
        console.log(`🎨 RGB data sample:`, parsedData.slice(0, 3).map(d => ({
          time: d.time,
          color: d.rgbColor,
          r: d.red,
          g: d.green,
          b: d.blue
        })));
        
        setDeviceHistory(parsedData);
      }

      // Fetch recent events for selected time period
      const { data: eventData } = await supabase
        .from("system_events")
        .select("*")
        .gte("timestamp", timeRange)
        .order("timestamp", { ascending: false })
        .limit(100);

      if (eventData) {
        console.log(`✅ Fetched ${eventData.length} events`);
        setEvents(eventData);
      }
    };

    fetchHistory();
  }, [timePeriod]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">History</h2>
        <Select value={timePeriod} onValueChange={setTimePeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Time Period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1h">Last Hour</SelectItem>
            <SelectItem value="6h">Last 6 Hours</SelectItem>
            <SelectItem value="24h">Last 24 Hours</SelectItem>
            <SelectItem value="7d">Last 7 Days</SelectItem>
            <SelectItem value="30d">Last 30 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="sensors" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sensors">Sensors</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
        </TabsList>

        <TabsContent value="sensors" className="mt-6">
          <Card className="p-6 bg-card border-border">
            <h3 className="text-lg font-semibold mb-4">Temperature, Humidity & Motion ({timePeriod})</h3>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={sensorHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))" 
                  }}
                  formatter={(value: number, name: string) => {
                    if (name === "Motion Detected") {
                      return value === 100 ? "DETECTED" : "NONE";
                    }
                    return value;
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="temperature" 
                  stroke="hsl(var(--destructive))" 
                  name="Temperature (°C)"
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="humidity" 
                  stroke="hsl(var(--primary))" 
                  name="Humidity (%)"
                  strokeWidth={2}
                />
                <Line 
                  type="stepAfter" 
                  dataKey="motion" 
                  stroke="hsl(var(--accent))" 
                  name="Motion Detected"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>

        <TabsContent value="devices" className="mt-6">
          <Card className="p-6 bg-card border-border">
            <h3 className="text-lg font-semibold mb-4">Device Status History ({timePeriod})</h3>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={deviceHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))" 
                  }}
                  formatter={(value: number, name: string) => {
                    if (name === "Bulb Status" || name === "Fan Status" || name === "Motion Detected") {
                      return value === 100 ? "ON" : "OFF";
                    }
                    return value;
                  }}
                />
                <Legend />
                <Line 
                  type="stepAfter" 
                  dataKey="bulbState" 
                  stroke="hsl(var(--primary))" 
                  name="Bulb Status"
                  strokeWidth={2}
                />
                <Line 
                  type="stepAfter" 
                  dataKey="fanState" 
                  stroke="hsl(var(--accent))" 
                  name="Fan Status"
                  strokeWidth={2}
                />
                <Line 
                  type="stepAfter" 
                  dataKey="fanSpeed" 
                  stroke="hsl(var(--secondary))" 
                  name="Fan Speed (%)"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-6 bg-card border-border mt-6">
            <h3 className="text-lg font-semibold mb-4">RGB Color Components ({timePeriod})</h3>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={deviceHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" domain={[0, 255]} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))" 
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="red" 
                  stroke="#ef4444" 
                  name="Red"
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="green" 
                  stroke="#22c55e" 
                  name="Green"
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="blue" 
                  stroke="#3b82f6" 
                  name="Blue"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="mt-6">
          <Card className="p-6 bg-card border-border">
            <h3 className="text-lg font-semibold mb-4">Recent Events</h3>
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {events.map((event) => (
                <div 
                  key={event.id} 
                  className="p-4 bg-muted/50 rounded-lg border border-border"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{event.event_type}</p>
                      <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                      {format(new Date(event.timestamp), "MMM d, HH:mm")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default History;
