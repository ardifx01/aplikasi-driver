// This is a Supabase Edge Function to get notified drivers for airport transfers

Deno.serve(async (req) => {
  // This is needed if you're planning to invoke your function from a browser
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers":
          "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    // Get the booking code from the request
    const { booking_code } = await req.json();

    if (!booking_code) {
      throw new Error("Booking code is required");
    }

    // Get the Supabase client
    const supabaseClient = Deno.env.get("SUPABASE_CLIENT");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    // Mock data for demonstration purposes
    // In a real implementation, you would query the database for drivers
    // who should be notified about this airport transfer
    const mockDrivers = [
      { driver_id: "1", driver_name: "Budi Santoso", phone: "+6281234567890" },
      { driver_id: "2", driver_name: "Dewi Putri", phone: "+6281234567891" },
      { driver_id: "3", driver_name: "Ahmad Rizki", phone: "+6281234567892" },
    ];

    // Return the list of drivers
    return new Response(JSON.stringify(mockDrivers), {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      status: 400,
    });
  }
});
