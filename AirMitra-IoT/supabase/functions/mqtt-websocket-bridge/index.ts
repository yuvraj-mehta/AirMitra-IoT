import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import mqtt from "https://esm.sh/mqtt@5.3.5";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// MQTT Client (shared across requests)
let mqttClient: any = null;

function connectMQTT(supabase: any) {
  if (mqttClient && mqttClient.connected) {
    return mqttClient;
  }

  console.log("🔌 Connecting to MQTT broker via WebSocket...");
  mqttClient = mqtt.connect("wss://broker.hivemq.com:8884/mqtt", {
    clientId: `supabase-bridge-${Math.random().toString(16).slice(2, 8)}`,
  });

  mqttClient.on("connect", () => {
    console.log("✅ MQTT Connected");
    
    // Subscribe to all ESP32 publish topics
    mqttClient.subscribe("yuvraj/home/temp");
    mqttClient.subscribe("yuvraj/home/hum");
    mqttClient.subscribe("yuvraj/home/bulb");
    mqttClient.subscribe("yuvraj/home/fan");
    mqttClient.subscribe("yuvraj/home/fan/speed");
    mqttClient.subscribe("yuvraj/home/color");
    mqttClient.subscribe("yuvraj/home/mode");
    
    console.log("📡 Subscribed to all ESP32 topics");
  });

  // Handle incoming MQTT messages
  mqttClient.on("message", async (topic: string, message: Uint8Array) => {
    const payload = new TextDecoder().decode(message);
    console.log(`📩 MQTT [${topic}]: ${payload}`);

    try {
      // Store sensor data
      if (topic === "yuvraj/home/temp" || topic === "yuvraj/home/hum") {
        const temp = topic === "yuvraj/home/temp" ? parseFloat(payload) : null;
        const hum = topic === "yuvraj/home/hum" ? parseFloat(payload) : null;
        
        if (temp !== null || hum !== null) {
          // Get latest row or create new one
          const { data: latest } = await supabase
            .from('sensor_data')
            .select('*')
            .order('timestamp', { ascending: false })
            .limit(1)
            .single();
          
          const now = new Date().toISOString();
          
          if (latest && new Date(latest.timestamp).getTime() > Date.now() - 3000) {
            // Update recent row
            await supabase
              .from('sensor_data')
              .update({
                temperature: temp ?? latest.temperature,
                humidity: hum ?? latest.humidity,
                timestamp: now
              })
              .eq('id', latest.id);
          } else {
            // Insert new row
            await supabase.from('sensor_data').insert({
              temperature: temp ?? 25,
              humidity: hum ?? 50,
              timestamp: now
            });
          }
        }
      }

      // Store device states
      if (["yuvraj/home/bulb", "yuvraj/home/fan", "yuvraj/home/fan/speed", 
           "yuvraj/home/color", "yuvraj/home/mode"].includes(topic)) {
        
        // Get latest state
        const { data: latest } = await supabase
          .from('device_states')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(1)
          .single();

        const now = new Date().toISOString();
        const updates: any = { timestamp: now };

        if (topic === "yuvraj/home/bulb") updates.bulb_state = payload;
        if (topic === "yuvraj/home/fan") updates.fan_state = payload;
        if (topic === "yuvraj/home/fan/speed") updates.fan_speed = parseInt(payload);
        if (topic === "yuvraj/home/color") updates.rgb_color = payload;
        if (topic === "yuvraj/home/mode") updates.mode = payload;

        if (latest && new Date(latest.timestamp).getTime() > Date.now() - 3000) {
          await supabase
            .from('device_states')
            .update(updates)
            .eq('id', latest.id);
        } else {
          await supabase.from('device_states').insert({
            bulb_state: latest?.bulb_state ?? "OFF",
            fan_state: latest?.fan_state ?? "OFF",
            fan_speed: latest?.fan_speed ?? 0,
            rgb_color: latest?.rgb_color ?? "#FFFFFF",
            mode: latest?.mode ?? "AUTO",
            ...updates
          });
        }
      }

      // Log event
      await supabase.from('system_events').insert({
        event_type: 'mqtt_received',
        event_data: { topic, payload },
        description: `Received from ${topic}: ${payload}`
      });

    } catch (error) {
      console.error("Error processing MQTT message:", error);
    }
  });

  mqttClient.on("error", (err: Error) => {
    console.error("❌ MQTT Error:", err);
  });

  return mqttClient;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Ensure MQTT client is connected
  const mqtt = connectMQTT(supabase);

  // Handle WebSocket upgrade for real-time updates
  const upgrade = req.headers.get("upgrade") || "";
  if (upgrade.toLowerCase() === "websocket") {
    const { socket, response } = Deno.upgradeWebSocket(req);

    socket.onopen = () => {
      console.log("🔌 WebSocket client connected");
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Forward control commands to MQTT
        if (data.topic && data.payload) {
          mqtt.publish(data.topic, data.payload);
          console.log(`📤 Sent to MQTT [${data.topic}]: ${data.payload}`);
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
      }
    };

    socket.onclose = () => console.log("❌ WebSocket client disconnected");

    return response;
  }

  // HTTP endpoint for commands
  try {
    const body = await req.json();
    
    // Handle ping/start requests
    if (body.action === 'start' || body.action === 'ping') {
      console.log(`🏓 Bridge ping received, MQTT connected: ${mqtt.connected}`);
      return new Response(
        JSON.stringify({ success: true, connected: mqtt.connected }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }
    
    const { topic, payload } = body;
    
    if (!topic || !payload) {
      return new Response(
        JSON.stringify({ error: "Missing topic or payload" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    mqtt.publish(topic, payload);
    console.log(`📤 HTTP Command sent to MQTT [${topic}]: ${payload}`);

    await supabase.from('system_events').insert({
      event_type: 'mqtt_command',
      event_data: { topic, payload },
      description: `Command sent to ${topic}: ${payload}`
    });

    return new Response(
      JSON.stringify({ success: true, topic, payload }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
