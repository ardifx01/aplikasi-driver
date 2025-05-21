import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  CheckCircle,
  X,
  MapPin,
  Calendar,
  Clock,
  User,
  RefreshCw,
  CheckCheck,
  Plane,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface AirportTransfer {
  id: number;
  booking_code: string;
  customer_name: string;
  pickup_location: string;
  dropoff_location: string;
  pickup_date?: string;
  pickup_time?: string;
  status: "pending" | "confirmed" | "completed" | "canceled";
  driver_id?: string;
  price?: number;
}

interface DriverNotificationsProps {
  showAll?: boolean;
  historyMode?: boolean;
}

const DriverNotifications = ({
  showAll = false,
  historyMode = false,
}: DriverNotificationsProps) => {
  const [bookingCode, setBookingCode] = useState("");
  const [transfers, setTransfers] = useState<AirportTransfer[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showAllTransfers, setShowAllTransfers] = useState(showAll);
  const [isHistoryView, setIsHistoryView] = useState(false);
  const [driverId, setDriverId] = useState<string | null>(null);

  const fetchAirportTransfers = async () => {
    setLoading(true);
    setError(null);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error("User fetch error:", userError);
        setError("Driver not authenticated");
        setLoading(false);
        return;
      }

      // ✅ Ambil driver_id dari tabel drivers berdasarkan email
      const { data: driverData, error: driverError } = await supabase
        .from("drivers")
        .select("id")
        .ilike("email", user.email)

        .maybeSingle();

      if (driverError) {
        console.error("Driver fetch error:", driverError);
        setError("Driver lookup failed");
        setLoading(false);
        return;
      }

      if (!driverData) {
        console.warn("No driver found for email:", user.email);
        setError("Driver ID not found for current user");
        setLoading(false);
        return;
      }

      const currentDriverId = driverData.id;
      setDriverId(currentDriverId);

      // ✅ Ambil airport transfers berdasarkan driver_id dan status
      let query = supabase
        .from("airport_transfer")
        .select("*")
        .eq("driver_id", currentDriverId);

      if (historyMode) {
        query = query.in("status", ["completed", "canceled"]);
      } else {
        query = query.in("status", ["pending", "confirmed"]);
      }

      const { data, error: transferError } = await query;

      if (transferError) {
        console.error("Transfer fetch error:", transferError);
        setError("Failed to get airport transfers");
      } else {
        console.log("Airport transfers fetched:", data);
        setTransfers(data || []);
        if (!data || data.length === 0) {
          setError(
            historyMode
              ? "No airport transfer history found."
              : "No pending transfers assigned to you.",
          );
        }
      }
    } catch (err: any) {
      console.error("Unexpected error:", err.message || err);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAirportTransfers();
  }, [showAllTransfers, isHistoryView]);

  const handleAccept = async (transferId: number) => {
    try {
      // Get the current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        toast({
          title: "Error",
          description: "Driver not authenticated.",
          variant: "destructive",
        });
        return;
      }

      // Get driver ID from drivers table
      const { data: driverData, error: driverError } = await supabase
        .from("drivers")
        .select("id")
        .eq("email", user.email)
        .single();

      if (driverError || !driverData) {
        console.error("Driver ID not found:", driverError);
        toast({
          title: "Error",
          description: "Driver ID not found.",
          variant: "destructive",
        });
        return;
      }

      const currentDriverId = driverData.id;

      console.log("Accepting transfer ID:", transferId);
      console.log("Driver ID:", currentDriverId);

      // Update the airport_transfer record
      const { data: updated, error: updateError } = await supabase
        .from("airport_transfer")
        .update({
          status: "confirmed",
          driver_id: currentDriverId,
        })
        .eq("id", transferId)
        .select();

      if (updateError) {
        console.error("Failed to accept transfer:", updateError);
        toast({
          title: "Error",
          description: "Failed to accept the transfer.",
          variant: "destructive",
        });
        return;
      }

      console.log("Transfer accepted:", updated);

      // Update local state
      setTransfers((prevTransfers) => {
        return prevTransfers.map((item) => {
          if (item.id === transferId) {
            return {
              ...item,
              status: "confirmed",
              driver_id: currentDriverId,
            };
          }
          return item;
        });
      });

      toast({
        title: "Success",
        description: "Transfer accepted and driver assigned.",
      });

      // Refresh the transfers list
      fetchAirportTransfers();
    } catch (err) {
      console.error("Unhandled error:", err);
      toast({
        title: "Error",
        description: "Something went wrong while accepting the transfer.",
        variant: "destructive",
      });
    }
  };

  const handleDecline = async (transferId: number) => {
    try {
      // Update transfer status to canceled
      const { error: transferError } = await supabase
        .from("airport_transfer")
        .update({ status: "canceled" })
        .eq("id", transferId);

      if (transferError) {
        console.error("Failed to cancel transfer:", transferError);
        toast({
          title: "Error",
          description: "Failed to cancel the transfer.",
          variant: "destructive",
        });
        return;
      }

      // Update local state
      setTransfers((prevTransfers) => {
        return prevTransfers.map((item) => {
          if (item.id === transferId) {
            return {
              ...item,
              status: "canceled",
            };
          }
          return item;
        });
      });

      toast({
        title: "Transfer Declined",
        description: "You have declined the airport transfer.",
      });

      // Refresh the transfers list
      fetchAirportTransfers();
    } catch (err) {
      console.error("Error declining transfer:", err);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  const handleComplete = async (transferId: number) => {
    try {
      const { error: transferError } = await supabase
        .from("airport_transfer")
        .update({ status: "completed" })
        .eq("id", transferId);

      if (transferError) {
        console.error("Failed to complete transfer:", transferError);
        toast({
          title: "Error",
          description: "Failed to mark the transfer as completed.",
          variant: "destructive",
        });
        return;
      }

      // Update local state
      setTransfers((prevTransfers) => {
        return prevTransfers.map((item) => {
          if (item.id === transferId) {
            return {
              ...item,
              status: "completed",
            };
          }
          return item;
        });
      });

      toast({
        title: "Transfer Completed",
        description: "Pesanan sudah Selesai",
        variant: "success",
      });

      // Refresh the transfers list
      fetchAirportTransfers();
    } catch (err) {
      console.error("Error completing transfer:", err);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full bg-white">
      <CardHeader className="mt-4 sm:mt-0">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isHistoryView ? (
              <>
                <Plane className="h-5 w-5 text-primary" />
                Airport Transfer History
              </>
            ) : (
              <>
                <Bell className="h-5 w-5 text-primary" />
                Driver Notifications for Airport Transfers
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setIsHistoryView(!isHistoryView)}
              size="sm"
              variant="outline"
              className="mr-2"
            >
              {isHistoryView ? "View Notifications" : "View Airport Transfers"}
            </Button>
            {!isHistoryView && showAll && (
              <Button
                onClick={() => setShowAllTransfers(!showAllTransfers)}
                size="sm"
                variant="outline"
              >
                {showAllTransfers ? "Show Pending Only" : "Show All Transfers"}
              </Button>
            )}
            <Button
              onClick={fetchAirportTransfers}
              disabled={loading}
              size="sm"
              variant="outline"
              className="flex items-center gap-1"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              {loading ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {error && (
            <div className="p-3 text-sm bg-destructive/10 text-destructive rounded-md">
              {error}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Customer</th>
                  <th className="text-left py-3 px-4">Booking Code</th>
                  <th className="text-left py-3 px-4">Pickup</th>
                  <th className="text-left py-3 px-4">Dropoff</th>
                  <th className="text-left py-3 px-4">Date & Time</th>
                  <th className="text-left py-3 px-4">Price</th>
                  <th className="text-right py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {transfers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="text-center py-8 text-muted-foreground"
                    >
                      {loading
                        ? "Loading transfers..."
                        : "No airport transfers found"}
                    </td>
                  </tr>
                ) : (
                  transfers.map((transfer) => (
                    <tr
                      key={transfer.id}
                      className="border-b hover:bg-muted/20"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <span className="font-medium">
                            {transfer.customer_name ?? "-"}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">{transfer.booking_code}</td>
                      <td className="py-3 px-4">{transfer.pickup_location}</td>
                      <td className="py-3 px-4">{transfer.dropoff_location}</td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          {transfer.pickup_date && (
                            <span className="text-sm flex items-center gap-1">
                              <Calendar className="h-3 w-3" />{" "}
                              {transfer.pickup_date}
                            </span>
                          )}
                          {transfer.pickup_time && (
                            <span className="text-sm flex items-center gap-1">
                              <Clock className="h-3 w-3" />{" "}
                              {transfer.pickup_time}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="capitalize">
                          Rp {transfer.price?.toLocaleString("id-ID") ?? "-"}
                        </Badge>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          {!isHistoryView && transfer.status === "pending" && (
                            <>
                              <Button
                                onClick={() => handleAccept(transfer.id)}
                                size="sm"
                                variant="default"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" /> Accept
                              </Button>

                              <Button
                                onClick={() => handleDecline(transfer.id)}
                                size="sm"
                                variant="outline"
                              >
                                <X className="h-4 w-4 mr-1" /> Decline
                              </Button>
                            </>
                          )}

                          {!isHistoryView &&
                            transfer.status === "confirmed" && (
                              <Button
                                onClick={() => handleComplete(transfer.id)}
                                size="sm"
                                variant="default"
                                className="bg-yellow-500 hover:bg-yellow-600"
                              >
                                <CheckCheck className="h-4 w-4 mr-1" /> Complete
                              </Button>
                            )}

                          {transfer.status === "canceled" && (
                            <Badge
                              variant="outline"
                              className="bg-red-100 text-red-800 border-red-200"
                            >
                              Declined
                            </Badge>
                          )}

                          {transfer.status === "completed" && (
                            <Badge
                              variant="outline"
                              className="bg-green-100 text-green-800 border-green-200 flex items-center gap-1"
                            >
                              <CheckCheck className="h-3 w-3" /> Completed
                            </Badge>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DriverNotifications;
