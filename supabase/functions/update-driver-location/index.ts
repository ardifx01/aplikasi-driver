import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.6";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Only allow POST requests
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse request body
    const { user_id, latitude, longitude, status } = await req.json();

    // Validate required fields
    if (
      !user_id ||
      latitude === undefined ||
      longitude === undefined ||
      !status
    ) {
      return new Response(
        JSON.stringify({
          error:
            "Missing required fields: user_id, latitude, longitude, status",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Validate latitude and longitude ranges
    if (
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return new Response(
        JSON.stringify({
          error: "Invalid latitude or longitude values",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Validate status values
    if (!["online", "offline"].includes(status)) {
      return new Response(
        JSON.stringify({
          error: 'Status must be either "online" or "offline"',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // UPSERT location data
    const { data, error } = await supabase
      .from("users_locations")
      .upsert(
        {
          user_id,
          latitude,
          longitude,
          status,
          role: "driver",
          last_active: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
        },
      )
      .select();

    if (error) {
      console.error("Database error:", error);
      return new Response(
        JSON.stringify({
          error: "Failed to update location",
          details: error.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: "Location updated successfully",
        data: data?.[0] || null,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
