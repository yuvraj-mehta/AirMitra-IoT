import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, startDate, endDate } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Use provided date range or default to last 24 hours
    const start =
      startDate || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const end = endDate || new Date().toISOString();

    // Fetch data for the selected time frame
    const { data: sensorData } = await supabase
      .from("sensor_data")
      .select("*")
      .gte("timestamp", start)
      .lte("timestamp", end)
      .order("timestamp", { ascending: false })
      .limit(1000);

    const { data: deviceData } = await supabase
      .from("device_states")
      .select("*")
      .gte("timestamp", start)
      .lte("timestamp", end)
      .order("timestamp", { ascending: false })
      .limit(1000);

    const { data: events } = await supabase
      .from("system_events")
      .select("*")
      .gte("timestamp", start)
      .lte("timestamp", end)
      .order("timestamp", { ascending: false })
      .limit(500);

    // Calculate time range for context
    const startDateObj = new Date(start);
    const endDateObj = new Date(end);
    const hoursDiff = Math.round(
      (endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60)
    );

    // Prepare context for AI
    const context = `
Sensor Data Summary (${hoursDiff}h period from ${startDateObj.toLocaleString()} to ${endDateObj.toLocaleString()}):

Device States (${hoursDiff}h period):

Raw Data:
Sensor Data: ${JSON.stringify(sensorData?.slice(0, 50))}
Device Data: ${JSON.stringify(deviceData?.slice(0, 50))}
Events: ${JSON.stringify(events?.slice(0, 20))}

User Query: ${query}
`;

    // Log the analysis
    await supabase.from("system_events").insert({
      event_type: "ai_analysis",
      event_data: { query, analysis },
      description: `AI analysis performed: ${query.substring(0, 50)}...`,
    });

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error in analyze-data:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
