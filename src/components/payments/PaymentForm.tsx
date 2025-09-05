import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
// Using the shared supabase client instance
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, CreditCard, Globe, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Import supabase client from lib
import { supabase } from "@/lib/supabase";

// Function to update driver saldo via external API
const updateDriverSaldoAPI = async (
  driverId: string,
  saldo: number,
): Promise<boolean> => {
  try {
    // First, fetch the id_driver from the drivers table
    const { data: driverData, error: driverError } = await supabase
      .from("drivers")
      .select("id_driver")
      .eq("id", driverId)
      .single();

    if (driverError || !driverData) {
      console.error("Error fetching driver id_driver:", driverError);
      return false;
    }

    const response = await fetch(
      "https://appserverv2.travelincars.com/api/update-driver.php",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          driver_id: driverData.id_driver,
          saldo: saldo.toString(),
        }),
      },
    );

    if (!response.ok) {
      console.error(`External API HTTP error! status: ${response.status}`);
      return false;
    }

    const result = await response.json();
    console.log("External API response:", result);
    return true;
  } catch (error) {
    console.error("Error calling external API:", error);
    return false;
  }
};

interface Booking {
  id: string;
  vehicle_id: string;
  vehicle_name?: string;
  booking_date: string;
  start_time: string;
  duration: number;
  status: string;
  payment_status: string;
  paid_amount?: number;
}

interface Vehicle {
  id: string;
  name: string;
  type: string;
  image: string;
  price: number;
  status: string;
}

const PaymentForm = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("ewallet");
  const [selectedBank, setSelectedBank] = useState("bca");
  const [isPaymentSuccess, setIsPaymentSuccess] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number | "">("");
  const [isPartialPayment, setIsPartialPayment] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isBookingFullyPaid, setIsBookingFullyPaid] = useState(false);

  useEffect(() => {
    const fetchBookingData = async () => {
      if (!bookingId) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch booking data
        const { data: bookingData, error: bookingError } = await supabase
          .from("bookings")
          .select("*")
          .eq("id", bookingId)
          .single();

        if (bookingError) throw bookingError;
        if (!bookingData) throw new Error("Booking not found");

        setBooking(bookingData);

        // Check if booking is fully paid
        const totalPaid = bookingData.paid_amount || 0;
        const totalAmount = bookingData.total_amount || 0;
        const isFullyPaid = totalPaid >= totalAmount;
        setIsBookingFullyPaid(isFullyPaid);

        // Fetch vehicle data
        const { data: vehicleData, error: vehicleError } = await supabase
          .from("vehicles")
          .select("*")
          .eq("id", bookingData.vehicle_id)
          .single();

        if (vehicleError) throw vehicleError;
        if (!vehicleData) throw new Error("Vehicle not found");

        setVehicle(vehicleData);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load booking data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchBookingData();
  }, [bookingId]);

  const handlePaymentSubmit = async () => {
    if (!booking || !vehicle || isProcessingPayment) return;

    try {
      setIsProcessingPayment(true);
      setError(null);

      // First, check if booking is already fully paid
      const currentPaidAmount = booking.paid_amount || 0;
      const totalBookingAmount = booking.total_amount || 0;

      if (currentPaidAmount >= totalBookingAmount) {
        console.log(
          "Booking is already fully paid, preventing duplicate payment",
        );
        setIsBookingFullyPaid(true);
        setIsPaymentSuccess(true);
        return;
      }

      // Calculate payment amount
      const remainingAmount = totalBookingAmount - currentPaidAmount;
      const paymentAmountToProcess =
        isPartialPayment && paymentAmount !== ""
          ? Number(paymentAmount)
          : remainingAmount;

      // Validate payment amount
      if (paymentAmountToProcess <= 0) {
        setError("Invalid payment amount");
        return;
      }

      if (currentPaidAmount + paymentAmountToProcess > totalBookingAmount) {
        setError("Payment amount exceeds remaining balance");
        return;
      }

      // Check for existing payments to prevent duplicates
      const { data: existingPayments, error: checkError } = await supabase
        .from("payments")
        .select("id, total_amount, status, created_at")
        .eq("booking_id", booking.id)
        .eq("status", "paid")
        .order("created_at", { ascending: false });

      if (checkError) {
        console.error("Error checking existing payments:", checkError);
      }

      // Check if there's already a payment with the same amount recently (within last 5 minutes)
      if (existingPayments && existingPayments.length > 0) {
        const recentPayment = existingPayments.find((payment) => {
          const paymentTime = new Date(payment.created_at).getTime();
          const now = new Date().getTime();
          const timeDiff = now - paymentTime;
          return (
            payment.total_amount === paymentAmountToProcess &&
            timeDiff < 5 * 60 * 1000
          ); // 5 minutes
        });

        if (recentPayment) {
          console.log(
            "Recent payment found, preventing duplicate:",
            recentPayment,
          );
          setIsPaymentSuccess(true);
          return;
        }
      }

      // Try to get current user
      let userId = null;
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        userId = user?.id;
      } catch (error) {
        console.log("No authenticated user, continuing as guest");
      }

      // Create payment data
      const paymentData = {
        booking_id: booking.id,
        total_amount: paymentAmountToProcess,
        payment_method:
          paymentMethod === "transfer"
            ? `transfer_${selectedBank}`
            : paymentMethod,
        status: "paid",
        notes: `Payment for ${vehicle.name} via ${paymentMethod}${paymentMethod === "transfer" ? ` (${selectedBank})` : ""}`,
        is_partial_payment: isPartialPayment,
        payment_date: new Date().toISOString().split("T")[0],
        user_id: userId,
      };

      console.log("Inserting payment data:", paymentData);

      const { data: insertedPayment, error: paymentError } = await supabase
        .from("payments")
        .insert(paymentData)
        .select()
        .single();

      if (paymentError) {
        console.error("Payment creation error:", paymentError);
        console.error("Payment data that failed:", paymentData);

        // Handle specific duplicate key error for ledger summary
        if (
          paymentError.code === "23505" &&
          paymentError.message.includes("unique_ledger_summary")
        ) {
          // Check if payment was actually created despite the error
          const { data: checkPayments } = await supabase
            .from("payments")
            .select("*")
            .eq("booking_id", booking.id)
            .eq("total_amount", paymentAmountToProcess)
            .eq("paid_amount", paymentAmountToProcess)
            .eq("payment_method", paymentData.payment_method)
            .eq("status", "paid")
            .order("created_at", { ascending: false })
            .limit(1);

          if (checkPayments && checkPayments.length > 0) {
            console.log(
              "Payment was created despite ledger summary error:",
              checkPayments[0],
            );
            setIsPaymentSuccess(true);
            return;
          }
        }

        setError(`Failed to create payment: ${paymentError.message}`);
        return;
      }

      console.log("Payment created successfully:", insertedPayment);

      // Update the booking state to reflect the new payment
      const updatedPaidAmount =
        (booking.paid_amount || 0) + paymentAmountToProcess;
      const isNowFullyPaid = updatedPaidAmount >= totalBookingAmount;

      // Update booking in database to reflect new payment status
      const updateData: any = {
        paid_amount: updatedPaidAmount,
        payment_status: isNowFullyPaid ? "paid" : "partial",
      };

      // Update booking status based on payment method
      if (paymentMethod === "cash") {
        updateData.status = "completed";
      } else if (paymentMethod === "transfer") {
        updateData.status = "pending";
      }

      // If booking is now fully paid, set remaining payments to 0
      if (isNowFullyPaid) {
        updateData.remaining_payments = 0;
      }

      const { error: updateError } = await supabase
        .from("bookings")
        .update(updateData)
        .eq("id", booking.id);

      if (updateError) {
        console.error("Error updating booking:", updateError);
        // Continue anyway as payment was successful
      }

      setBooking({
        ...booking,
        paid_amount: updatedPaidAmount,
        payment_status: isNowFullyPaid ? "paid" : "partial",
        status: isNowFullyPaid ? "paid" : booking.status,
        remaining_payments: isNowFullyPaid
          ? 0
          : booking.remaining_payments ||
            totalBookingAmount - updatedPaidAmount,
      });

      // Update the fully paid status
      setIsBookingFullyPaid(isNowFullyPaid);

      // Update driver saldo and status when using Saldo/E-Wallet payment method
      if (booking.driver_id && paymentMethod === "ewallet") {
        try {
          console.log(
            "Processing Saldo/E-Wallet payment for driver:",
            booking.driver_id,
          );

          // Get current driver saldo
          const { data: driverData, error: driverFetchError } = await supabase
            .from("drivers")
            .select("saldo, name")
            .eq("id", booking.driver_id)
            .single();

          if (driverFetchError) {
            console.error("Error fetching driver data:", driverFetchError);
            throw new Error("Failed to fetch driver data");
          }

          const currentDriverSaldo = driverData?.saldo || 0;
          const newDriverSaldo = currentDriverSaldo + paymentAmountToProcess;

          // Update driver saldo and status
          const { error: driverUpdateError } = await supabase
            .from("drivers")
            .update({
              saldo: newDriverSaldo,
              driver_status: "standby",
            })
            .eq("id", booking.driver_id);

          if (driverUpdateError) {
            console.error(
              "Error updating driver saldo and status:",
              driverUpdateError,
            );
            throw new Error("Failed to update driver saldo");
          }

          console.log(
            `Driver saldo updated: ${currentDriverSaldo} -> ${newDriverSaldo}`,
          );

          // Create histori_transaksi record
          const historiTransaksiData = {
            kode_booking: booking.code_booking || booking.id,
            nominal: paymentAmountToProcess,
            saldo_akhir: newDriverSaldo,
            keterangan: `Pembayaran Sewa Kendaraan ${vehicle.make} - ${paymentMethod}`,
            //trans_date: new Date().toISOString().split("T")[0],
            user_id: booking.driver_id,
            jenis_transaksi: "Sewa Kendaraan Driver",
          };

          const { error: historiError } = await supabase
            .from("histori_transaksi")
            .insert(historiTransaksiData);

          if (historiError) {
            console.error("Error creating histori_transaksi:", historiError);
            // Don't fail the payment if history creation fails, just log the error
          } else {
            console.log("Transaction history created successfully");
          }
        } catch (error) {
          console.error("Error in Saldo/E-Wallet payment processing:", error);
          // Don't fail the payment if driver update fails, just log the error
        }
      } else if (booking.driver_id) {
        // For non-ewallet payments, just update driver status
        try {
          console.log(
            "Updating driver status to 'standby' for driver:",
            booking.driver_id,
          );

          const { error: driverUpdateError } = await supabase
            .from("drivers")
            .update({ driver_status: "standby" })
            .eq("id", booking.driver_id);

          if (driverUpdateError) {
            console.error("Error updating driver status:", driverUpdateError);
          } else {
            console.log("Driver status successfully updated to 'standby'");
          }
        } catch (error) {
          console.error("Error in driver status update:", error);
          // Don't fail the payment if driver update fails, just log the error
        }
      }

      // Call RPC function to handle payment completion and update driver status to 'standby'
      if (booking.driver_id) {
        try {
          // Get current user ID for the RPC function
          const {
            data: { user },
          } = await supabase.auth.getUser();
          const currentUserId = user?.id;

          if (currentUserId) {
            console.log(
              "Calling pay_booking_and_set_driver_standby RPC function",
            );

            const { data: rpcResult, error: rpcError } = await supabase.rpc(
              "pay_booking_and_set_driver_standby",
              {
                booking_id: booking.id,
                payment_amount: paymentAmountToProcess,
                method:
                  paymentMethod === "transfer"
                    ? `transfer_${selectedBank}`
                    : paymentMethod,
                by: currentUserId,
              },
            );

            if (rpcError) {
              console.error(
                "Error calling pay_booking_and_set_driver_standby:",
                rpcError,
              );
              // Continue with manual update as fallback
              const { data: driverData, error: driverError } = await supabase
                .from("drivers")
                .select("saldo")
                .eq("id", booking.driver_id)
                .single();

              if (!driverError && driverData) {
                const currentSaldo = driverData.saldo || 0;
                const newSaldo = currentSaldo + paymentAmountToProcess;

                const { error: updateDriverError } = await supabase
                  .from("drivers")
                  .update({
                    saldo: newSaldo,
                    driver_status: "standby",
                  })
                  .eq("id", booking.driver_id);

                if (updateDriverError) {
                  console.error(
                    "Error updating driver manually:",
                    updateDriverError,
                  );
                } else {
                  console.log(
                    "Driver updated manually - saldo:",
                    newSaldo,
                    "status: standby",
                  );

                  // Call external API to update driver saldo
                  const apiSuccess = await updateDriverSaldoAPI(
                    booking.driver_id,
                    newSaldo,
                  );
                  if (!apiSuccess) {
                    console.warn(
                      "External API call failed, but payment process continues",
                    );
                  }
                }
              }
            } else {
              console.log("RPC function executed successfully:", rpcResult);
              console.log(
                "Driver status updated to 'standby' and saldo updated",
              );

              // Get updated saldo and call external API
              try {
                const { data: updatedDriverData, error: fetchError } =
                  await supabase
                    .from("drivers")
                    .select("saldo")
                    .eq("id", booking.driver_id)
                    .single();

                if (!fetchError && updatedDriverData) {
                  const apiSuccess = await updateDriverSaldoAPI(
                    booking.driver_id,
                    updatedDriverData.saldo || 0,
                  );
                  if (!apiSuccess) {
                    console.warn(
                      "External API call failed, but payment process continues",
                    );
                  }
                }
              } catch (error) {
                console.error("Error fetching updated driver data:", error);
              }
            }
          } else {
            console.error("No current user ID available for RPC function");
          }
        } catch (error) {
          console.error("Error in payment completion process:", error);
          // Don't fail the payment if driver update fails, just log the error
        }
      }

      setIsPaymentSuccess(true);
    } catch (error) {
      console.error("Error processing payment:", error);
      if (error.message) {
        setError(`Payment processing failed: ${error.message}`);
      } else {
        setError("Failed to process payment. Please try again.");
      }
    } finally {
      setIsProcessingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-6">
          <p>{error}</p>
          <Button
            variant="outline"
            className="mt-2"
            onClick={() => navigate(-1)}
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  if (!booking || !vehicle) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-6">
          <p>Booking or vehicle data not found.</p>
          <Button
            variant="outline"
            className="mt-2"
            onClick={() => navigate("/booking")}
          >
            Return to Booking
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 bg-gray-50">
      <div className="mb-4">
        <Button
          variant="outline"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Payment</h1>
        <p className="text-gray-600 mt-2">
          Complete your payment for booking #{booking.id}
        </p>
      </div>

      {isPaymentSuccess || isBookingFullyPaid ? (
        <Card>
          <CardContent className="pt-6">
            <div className="py-12 flex flex-col items-center text-center">
              <div className="rounded-full bg-green-100 p-3 mb-4">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2">
                {isPaymentSuccess
                  ? "Payment Successful!"
                  : "Booking Fully Paid"}
              </h2>
              <p className="text-muted-foreground mb-6">
                {isPaymentSuccess
                  ? "Your payment has been processed and is pending confirmation. You can check the status in your payment history."
                  : "This booking has been fully paid. No further payments are required."}
              </p>
              <div className="flex gap-4">
                <Button onClick={() => navigate("/booking-history")}>
                  View Booking History
                </Button>
                <Button onClick={() => navigate("/payments")} variant="outline">
                  View Payments
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Payment Details</CardTitle>
            <CardDescription>
              Complete your payment for the vehicle booking
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Booking Summary */}
            <div className="flex items-center gap-4 p-3 bg-muted rounded-lg">
              <div className="h-16 w-16 overflow-hidden rounded-md">
                <img
                  src={vehicle.image}
                  alt={vehicle.name}
                  className="h-full w-full object-cover"
                />
              </div>

              <div>
                <h3 className="font-medium">{vehicle.name}</h3>
                <p className="text-sm text-muted-foreground">
                  Type: <span className="font-medium">{vehicle.type}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Make: <span className="font-medium">{vehicle.make}</span> |
                  Model: <span className="font-medium">{vehicle.model}</span>
                </p>

                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge variant="outline">
                    Start Date:{" "}
                    {new Date(booking.booking_date).toLocaleDateString()}
                  </Badge>
                  <Badge variant="outline">
                    End Date: {new Date(booking.end_date).toLocaleDateString()}
                  </Badge>
                  <Badge variant="outline">
                    Start Time: {booking.start_time}
                  </Badge>
                  <Badge variant="outline">
                    Return Time: {booking.return_time}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="grid gap-2">
              <Label className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" /> Payment Method
              </Label>
              <RadioGroup
                value={paymentMethod}
                onValueChange={setPaymentMethod}
                className="flex flex-col space-y-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ewallet" id="ewallet" />
                  <Label htmlFor="ewallet">Saldo/E-Wallet</Label>
                </div>
              </RadioGroup>
            </div>

            {paymentMethod === "transfer" && (
              <div className="grid gap-2 mt-2">
                <Label className="flex items-center gap-2">
                  <Globe className="h-4 w-4" /> Select Bank
                </Label>
                <RadioGroup
                  value={selectedBank}
                  onValueChange={setSelectedBank}
                  className="flex flex-col space-y-1 border p-3 rounded-md"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="bca" id="bca" />
                    <Label htmlFor="bca">BCA - 1111</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="mandiri" id="mandiri" />
                    <Label htmlFor="mandiri">Mandiri - 2222</Label>
                  </div>
                </RadioGroup>
              </div>
            )}

            {/* Payment Summary */}
            <div className="bg-muted p-3 rounded-lg">
              <div className="flex justify-between mb-2">
                <span>Booking Amount</span>
                <span>
                  Rp{" "}
                  {new Intl.NumberFormat("id-ID").format(booking.total_amount)}
                </span>
              </div>

              {booking.paid_amount !== undefined && booking.paid_amount > 0 && (
                <div className="flex justify-between mb-2">
                  <span>Already Paid</span>
                  <span>
                    Rp{" "}
                    {new Intl.NumberFormat("id-ID").format(booking.paid_amount)}
                  </span>
                </div>
              )}

              {booking.paid_amount !== undefined &&
                booking.paid_amount < booking.total_amount && (
                  <div className="flex justify-between mb-2">
                    <span>Remaining Amount</span>
                    <span>
                      Rp{" "}
                      {new Intl.NumberFormat("id-ID").format(
                        (booking.total_amount || 0) -
                          (booking.paid_amount || 0),
                      )}
                    </span>
                  </div>
                )}

              {paymentMethod === "transfer" && (
                <div className="flex justify-between mb-2">
                  <span>Bank</span>
                  <span>
                    {selectedBank === "bca" ? "BCA - 1111" : "Mandiri - 2222"}
                  </span>
                </div>
              )}

              <div className="flex items-center mb-4 mt-2">
                <input
                  type="checkbox"
                  id="partialPayment"
                  checked={isPartialPayment}
                  onChange={(e) => {
                    setIsPartialPayment(e.target.checked);
                    if (!e.target.checked) {
                      setPaymentAmount(
                        (booking.total_amount || 0) -
                          (booking.paid_amount || 0),
                      );
                    } else {
                      setPaymentAmount("");
                    }
                  }}
                  className="mr-2"
                />
                <label htmlFor="partialPayment">Make partial payment</label>
              </div>

              {isPartialPayment && (
                <div className="mb-4">
                  <Label htmlFor="paymentAmount">Payment Amount</Label>
                  <Input
                    id="paymentAmount"
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => {
                      const value =
                        e.target.value === "" ? "" : Number(e.target.value);
                      setPaymentAmount(value);
                    }}
                    placeholder="Enter amount"
                    className="mt-1"
                    min={1}
                    max={
                      (booking.total_amount || 0) - (booking.paid_amount || 0)
                    }
                  />
                </div>
              )}

              <div className="flex justify-between font-bold pt-2 border-t">
                <span>Total to Pay Now</span>
                <span>
                  Rp{" "}
                  {new Intl.NumberFormat("id-ID").format(
                    isPartialPayment && paymentAmount !== ""
                      ? paymentAmount
                      : (booking.total_amount || 0) -
                          (booking.paid_amount || 0),
                  )}
                </span>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={handlePaymentSubmit}
              className="w-full"
              disabled={
                isProcessingPayment ||
                isBookingFullyPaid ||
                (booking.paid_amount || 0) >= (booking.total_amount || 0) ||
                (isPartialPayment &&
                  (paymentAmount === "" || Number(paymentAmount) <= 0))
              }
            >
              {isProcessingPayment
                ? "Processing Payment..."
                : isBookingFullyPaid ||
                    (booking.paid_amount || 0) >= (booking.total_amount || 0)
                  ? "Booking Fully Paid"
                  : "Complete Payment"}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
};

export default PaymentForm;
