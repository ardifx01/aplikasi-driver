import React, { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCircle, User, Phone } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface Driver {
  driver_id: string;
  driver_name: string;
  phone: string;
  email?: string;
  distance?: number;
  is_available?: boolean;
}

const DriverNotifications = () => {
  const [bookingCode, setBookingCode] = useState("");
  const [notifiedDrivers, setNotifiedDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getNotifiedDrivers = async () => {
    if (!bookingCode) {
      setError("Booking code is required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Call the Supabase RPC function
      const { data, error } = await supabase.rpc(
        "get_notified_drivers_for_airport_transfer",
        {
          booking_code: bookingCode,
        },
      );

      if (error) {
        console.error("Failed to get drivers:", error);
        setError(error.message || "Failed to get notified drivers");
      } else if (data) {
        setNotifiedDrivers(data);

        // Notify about each driver (for demonstration)
        data.forEach((driver) => {
          console.log("Notification to:", driver.driver_name);
          // Show toast notification
          toast({
            title: "Driver Notified",
            description: `${driver.driver_name} has been notified about the airport transfer.`,
          });
        });
      }
    } catch (err) {
      console.error("Error:", err);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="mt-4 sm:mt-0">
        <CardTitle className="flex items-center gap-2 mt-2">
          <Bell className="h-5 w-5 text-primary" />
          Driver Notifications for Airport Transfers
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter booking code"
              value={bookingCode}
              onChange={(e) => setBookingCode(e.target.value)}
              className="flex-1"
            />
            <Button onClick={getNotifiedDrivers} disabled={loading}>
              {loading ? "Loading..." : "Notify Drivers"}
            </Button>
          </div>

          {error && (
            <div className="p-3 text-sm bg-destructive/10 text-destructive rounded-md">
              {error}
            </div>
          )}

          {notifiedDrivers.length > 0 && (
            <div className="space-y-3 mt-4">
              <h3 className="font-medium">
                Notified Drivers ({notifiedDrivers.length})
              </h3>
              {notifiedDrivers.map((driver) => (
                <div
                  key={driver.driver_id}
                  className="p-3 border rounded-md flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{driver.driver_name}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {driver.phone}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3 text-green-500" /> Notified
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DriverNotifications;
