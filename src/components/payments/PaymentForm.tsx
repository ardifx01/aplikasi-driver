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

interface Booking {
  id: string;
  vehicle_id: string;
  vehicle_name?: string;
  booking_date: string;
  start_time: string;
  duration: number;
  status: string;
  payment_status: string;
  total_amount: number;
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
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [selectedBank, setSelectedBank] = useState("bca");
  const [isPaymentSuccess, setIsPaymentSuccess] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number | "">("");
  const [isPartialPayment, setIsPartialPayment] = useState(false);

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
    if (!booking || !vehicle) return;

    try {
      // Try to get current user, but don't require it for now
      let userId = null;
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        userId = user?.id;
      } catch (error) {
        console.log("No authenticated user, continuing as guest");
      }

      // Calculate payment amount
      const paymentAmountToProcess =
        isPartialPayment && paymentAmount !== ""
          ? Number(paymentAmount)
          : booking.total_amount - (booking.paid_amount || 0);

      // Create a payment record
      const { data, error } = await supabase
        .from("payments")
        .insert([
          {
            booking_id: booking.id,
            amount: paymentAmountToProcess,
            payment_method: paymentMethod,
            bank: paymentMethod === "transfer" ? selectedBank : null,
            status: "pending",
            user_id: userId,
          },
        ])
        .select();

      if (error) throw error;

      // Calculate new paid amount
      const newPaidAmount = (booking.paid_amount || 0) + paymentAmountToProcess;
      const newPaymentStatus =
        newPaidAmount >= booking.total_amount ? "paid" : "pending";

      // Calculate remaining payments
      const remainingPayments = booking.total_amount - newPaidAmount;

      // Update booking payment status, paid amount, and remaining payments
      const { error: updateError } = await supabase
        .from("bookings")
        .update({
          payment_status: newPaymentStatus,
          paid_amount: newPaidAmount,
          remaining_payments: remainingPayments,
        })
        .eq("id", booking.id);

      if (updateError) throw updateError;

      setIsPaymentSuccess(true);
    } catch (error) {
      console.error("Error processing payment:", error);
      setError("Failed to process payment. Please try again.");
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

      {isPaymentSuccess ? (
        <Card>
          <CardContent className="pt-6">
            <div className="py-12 flex flex-col items-center text-center">
              <div className="rounded-full bg-green-100 p-3 mb-4">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Payment Successful!</h2>
              <p className="text-muted-foreground mb-6">
                Your payment has been processed and is pending confirmation. You
                can check the status in your payment history.
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
                <p className="text-sm text-muted-foreground">{vehicle.type}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline">
                    {new Date(booking.booking_date).toLocaleDateString()}
                  </Badge>
                  <Badge variant="outline">{booking.start_time}</Badge>
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
                  <RadioGroupItem value="cash" id="cash" />
                  <Label htmlFor="cash">Cash</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="transfer" id="transfer" />
                  <Label htmlFor="transfer">Bank Transfer</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ewallet" id="ewallet" />
                  <Label htmlFor="ewallet">E-Wallet</Label>
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
                        booking.total_amount - booking.paid_amount,
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
                        booking.total_amount - (booking.paid_amount || 0),
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
                    max={booking.total_amount - (booking.paid_amount || 0)}
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
                      : booking.total_amount - (booking.paid_amount || 0),
                  )}
                </span>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handlePaymentSubmit} className="w-full">
              Complete Payment
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
};

export default PaymentForm;
