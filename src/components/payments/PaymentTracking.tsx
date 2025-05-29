import React, { useState, useEffect } from "react";
import { format, subDays, isAfter, isBefore } from "date-fns";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useNavigate, Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  CalendarIcon,
  CreditCard,
  DollarSign,
  Filter,
  Search,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

interface Payment {
  id: string;
  booking_id: string;
  vehicle_name: string;
  vehicle_model?: string;
  license_plate?: string;
  amount: number;
  paid_amount?: number;
  status: "paid" | "pending" | "overdue";
  date: Date;
  due_date?: Date;
  transaction_id?: string;
  payment_method?: string;
}

interface RemainingPayment {
  id: string;
  booking_id: string;
  vehicle_name: string;
  vehicle_model?: string;
  license_plate?: string;
  amount: number;
  paid_amount?: number;
  due_date: Date;
  status: "upcoming" | "overdue";
}

interface Booking {
  id: string;
  vehicle_id: string;
  vehicle_name: string;
  vehicle_model?: string;
  license_plate?: string;
  user_id: string;
  booking_date: Date;
  start_time: string;
  duration: number;
  status: string;
  payment_status: string;
  total_amount: number;
  paid_amount?: number;
  payment_method?: string;
  transaction_id?: string;
  created_at: Date;
  remaining_payments?: number;
}

interface PaymentTrackingProps {
  userId?: string;
  driverSaldo?: number;
}

const PaymentTracking = ({
  userId,
  driverSaldo,
}: PaymentTrackingProps = {}) => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [remainingPayments, setRemainingPayments] = useState<
    RemainingPayment[]
  >([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userSaldo, setUserSaldo] = useState<number>(0);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
  const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

  const [date, setDate] = useState<Date | undefined>(new Date());
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        setError(null);

        let query = supabase.from("bookings").select(`
            id,
            vehicle_id,
            vehicle_name,
            plate_number,
            user_id,
            booking_date,
            start_time,
            duration,
            status,
            payment_status,
            total_amount,
            paid_amount,
            payment_method,
            transaction_id,
            created_at
          `);

        if (userId) {
          query = query.eq("user_id", userId);
          console.log("Filtering payments for user ID:", userId);
        } else {
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData?.session?.user?.id) {
            query = query.eq("user_id", sessionData.session.user.id);
            console.log(
              "Filtering payments for current user:",
              sessionData.session.user.id,
            );
          }
        }

        const { data, error } = await query;

        if (error) {
          throw error;
        }

        if (data) {
          console.log("Fetched bookings for payment tracking:", data.length);
          const transformedBookings: Booking[] = data.map((booking) => ({
            id: booking.id,
            vehicle_id: booking.vehicle_id,
            vehicle_name: booking.vehicle_name || "Unknown Vehicle",
            vehicle_model:
              booking.vehicle_model ||
              (booking.make && booking.model
                ? `${booking.make} ${booking.model}`
                : undefined),
            license_plate: booking.plate_number,
            user_id: booking.user_id,
            booking_date: new Date(booking.booking_date),
            start_time: booking.start_time,
            duration: booking.duration,
            status: booking.status,
            payment_status: booking.payment_status,
            total_amount: booking.total_amount,
            paid_amount: booking.paid_amount,
            payment_method: booking.payment_method,
            transaction_id: booking.transaction_id,
            created_at: new Date(booking.created_at),
            booking_code: booking.booking_code,
            remaining_payments: booking.remaining_payments,
          }));

          setBookings(transformedBookings);
          processBookingsIntoPayments(transformedBookings);
        }
      } catch (err) {
        console.error("Error fetching bookings:", err);
        setError("Failed to fetch bookings. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [userId]);

  const processBookingsIntoPayments = (bookings: Booking[]) => {
    const today = new Date();
    const processedPayments: Payment[] = [];
    const processedRemainingPayments: RemainingPayment[] = [];
    let pending = 0;

    bookings.forEach((booking) => {
      const paymentObj: Payment = {
        id: booking.id,
        booking_id: `BK-${booking.id}`,
        vehicle_name: booking.vehicle_name || "Unknown Vehicle",
        vehicle_model:
          booking.vehicle_model ||
          (booking.make && booking.model
            ? `${booking.make} ${booking.model}`
            : undefined),
        license_plate: booking.license_plate,
        amount: booking.total_amount,
        paid_amount: booking.paid_amount,
        status:
          booking.payment_status === "paid"
            ? "paid"
            : booking.payment_status === "pending"
              ? "pending"
              : "overdue",
        date: booking.created_at,
        due_date: booking.booking_date,
        transaction_id: booking.transaction_id,
        payment_method: booking.payment_method,
      };

      processedPayments.push(paymentObj);

      if (booking.remaining_payments && booking.remaining_payments > 0) {
        pending += booking.remaining_payments;
      } else if (
        booking.payment_status === "unpaid" ||
        booking.payment_status === "pending"
      ) {
        const remainingAmount =
          booking.total_amount - (booking.paid_amount || 0);
        if (remainingAmount > 0) {
          pending += remainingAmount;
        }
      }
    });

    setPayments(processedPayments);
    setRemainingPayments(processedRemainingPayments);
  };

  const processBookingsIntoRemainingPayments = (bookings: Booking[]) => {
    const today = new Date();
    const processedRemainingPayments: RemainingPayment[] = [];

    const paidBookings = new Set();

    bookings.forEach((booking) => {
      if (booking.payment_status === "paid") {
        paidBookings.add(booking.id);
      }
    });

    bookings.forEach((booking) => {
      if (paidBookings.has(booking.id)) {
        return;
      }

      // Check for remaining payments in two ways:
      // 1. If booking has remaining_payments field
      if (booking.remaining_payments && booking.remaining_payments > 0) {
        const remainingPaymentObj: RemainingPayment = {
          id: `${booking.id}-remaining`,
          booking_id: `BK-${booking.id}`,
          vehicle_name: booking.vehicle_name || "Unknown Vehicle",
          license_plate: booking.license_plate,
          amount: booking.remaining_payments,
          paid_amount: booking.paid_amount,
          due_date: booking.booking_date,
          status: isBefore(booking.booking_date, today)
            ? "overdue"
            : "upcoming",
        };

        processedRemainingPayments.push(remainingPaymentObj);
      }
      // 2. If booking has partial payment (paid_amount < total_amount)
      else if (
        booking.payment_status !== "paid" &&
        booking.paid_amount !== undefined &&
        booking.paid_amount < booking.total_amount
      ) {
        const remainingAmount =
          booking.total_amount - (booking.paid_amount || 0);

        const remainingPaymentObj: RemainingPayment = {
          id: `${booking.id}-remaining`,
          booking_id: `BK-${booking.id}`,
          vehicle_name: booking.vehicle_name || "Unknown Vehicle",
          license_plate: booking.license_plate,
          amount: remainingAmount,
          paid_amount: booking.paid_amount,
          due_date: booking.booking_date,
          status: isBefore(booking.booking_date, today)
            ? "overdue"
            : "upcoming",
        };

        processedRemainingPayments.push(remainingPaymentObj);
      }
    });

    setRemainingPayments(processedRemainingPayments);
  };

  const fetchVehicleDetails = async (vehicleId: string) => {
    try {
      const { data, error } = await supabase
        .from("vehicles")
        .select("name, plate_number")
        .eq("id", vehicleId)
        .single();

      if (error) {
        console.error("Error fetching vehicle details:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Error in fetchVehicleDetails:", error);
      return null;
    }
  };

  const filteredPayments = payments.filter(
    (payment) =>
      payment.vehicle_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.booking_id.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredRemainingPayments = remainingPayments.filter(
    (payment) =>
      payment.vehicle_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.booking_id.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const totalPaid = payments
    .filter((payment) => payment.status === "paid")
    .reduce((sum, payment) => sum + (payment.amount || 0), 0);

  const totalPending = [
    ...payments.filter((payment) => payment.status === "pending"),
    ...remainingPayments,
  ].reduce((sum, payment) => sum + (payment.amount || 0), 0);

  useEffect(() => {
    const fetchDriverSaldo = async () => {
      if (userId) {
        try {
          if (userId) {
            try {
              const { data, error } = await supabase
                .from("drivers")
                .select("saldo")
                .eq("id", userId)
                .single();

              if (error) {
                console.error("Error fetching driver saldo:", error);
                const { data: userData, error: userError } = await supabase
                  .from("users")
                  .select("saldo")
                  .eq("id", userId)
                  .single();

                if (!userError && userData && userData.saldo !== undefined) {
                  console.log(
                    "Driver saldo from users table in PaymentTracking:",
                    userData.saldo,
                  );
                  setUserSaldo(userData.saldo);
                  return;
                }
                return;
              }

              console.log("Driver saldo data in PaymentTracking:", data);
              if (data && data.saldo !== undefined) {
                setUserSaldo(data.saldo);
              }
            } catch (error) {
              console.error("Error in fetchDriverSaldo:", error);
            }
          }
        } catch (error) {
          console.error("Error in fetchDriverSaldo:", error);
        }
      }
    };

    if (driverSaldo !== undefined) {
      console.log(
        "Using driverSaldo from props in PaymentTracking:",
        driverSaldo,
      );
      setUserSaldo(driverSaldo);
    } else {
      fetchDriverSaldo();
    }
  }, [userId, driverSaldo]);

  return (
    <div className="bg-background p-6 rounded-lg w-full max-w-7xl mx-auto">
      {loading && (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading payment data...</span>
        </div>
      )}

      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-6">
          <p>{error}</p>
          <Button
            variant="outline"
            className="mt-2"
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        </div>
      )}

      {!loading && !error && (
        <>
          <Button
            variant="ghost"
            className="mb-4 flex items-center gap-1"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight mb-2">
              Payment Tracking
            </h1>
            <p className="text-muted-foreground">
              Manage and track your rental payments
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Paid
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <DollarSign className="mr-2 h-4 w-4 text-green-500" />
                  <span className="text-2xl font-bold">
                    Rp {totalPaid.toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Pending Payments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <CreditCard className="mr-2 h-4 w-4 text-yellow-500" />
                  <span className="text-2xl font-bold">
                    Rp {totalPending.toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Upcoming Due
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <CalendarIcon className="mr-2 h-4 w-4 text-blue-500" />
                  <span className="text-2xl font-bold">
                    {remainingPayments.length} Payments
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Driver Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <DollarSign className="mr-2 h-4 w-4 text-primary" />
                  <span className="text-2xl font-bold">
                    Rp{" "}
                    {typeof userSaldo === "number"
                      ? userSaldo.toLocaleString()
                      : "0"}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search by vehicle or booking ID..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-[240px] justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
          </div>

          <Tabs defaultValue="history" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="history">Payment History</TabsTrigger>
              <TabsTrigger value="remaining">Remaining Payments</TabsTrigger>
            </TabsList>

            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle>Payment History</CardTitle>
                  <CardDescription>
                    View all your past and pending payments
                    {searchQuery && (
                      <span className="ml-2 font-medium">
                        - Showing results for "{searchQuery}"
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {filteredPayments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      {searchQuery ? (
                        <p>No payments found matching "{searchQuery}"</p>
                      ) : (
                        <p>No payment history available</p>
                      )}
                    </div>
                  ) : (
                    <Accordion type="single" collapsible className="w-full">
                      {filteredPayments.map((payment) => (
                        <AccordionItem key={payment.id} value={payment.id}>
                          <AccordionTrigger className="hover:no-underline">
                            <div className="flex flex-1 items-center justify-between pr-4">
                              <div className="flex items-center">
                                <div className="mr-4">
                                  <p className="font-medium">
                                    {payment.booking_id}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {payment.vehicle_name}
                                  </p>
                                  {payment.license_plate && (
                                    <p className="text-sm text-muted-foreground">
                                      Plate: {payment.license_plate}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <p className="font-medium">
                                    Rp{" "}
                                    {payment.amount
                                      ? payment.amount.toLocaleString()
                                      : "0"}
                                  </p>
                                  {payment.paid_amount !== undefined &&
                                    payment.paid_amount < payment.amount && (
                                      <p className="text-xs text-muted-foreground">
                                        Paid: Rp{" "}
                                        {payment.paid_amount !== null
                                          ? payment.paid_amount.toLocaleString()
                                          : "0"}
                                      </p>
                                    )}
                                </div>
                                <Badge
                                  variant={
                                    payment.status === "paid"
                                      ? "default"
                                      : payment.status === "pending"
                                        ? "outline"
                                        : "destructive"
                                  }
                                >
                                  {payment.status === "paid"
                                    ? "Paid"
                                    : payment.status === "pending"
                                      ? "Pending"
                                      : "Overdue"}
                                </Badge>
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                              <div>
                                <p className="text-sm font-medium">
                                  Payment Date
                                </p>
                                <p className="text-sm">
                                  {format(payment.date, "PPP")}
                                </p>
                              </div>
                              {payment.due_date && (
                                <div>
                                  <p className="text-sm font-medium">
                                    Due Date
                                  </p>
                                  <p className="text-sm">
                                    {format(payment.due_date, "PPP")}
                                    {payment.status === "overdue" && (
                                      <span className="text-destructive ml-2">
                                        (Overdue)
                                      </span>
                                    )}
                                  </p>
                                </div>
                              )}
                              {payment.transaction_id && (
                                <div>
                                  <p className="text-sm font-medium">
                                    Transaction ID
                                  </p>
                                  <p className="text-sm">
                                    {payment.transaction_id}
                                  </p>
                                </div>
                              )}
                              {payment.payment_method && (
                                <div>
                                  <p className="text-sm font-medium">
                                    Payment Method
                                  </p>
                                  <p className="text-sm">
                                    {payment.payment_method}
                                  </p>
                                </div>
                              )}
                              {payment.paid_amount !== undefined &&
                                payment.paid_amount < payment.amount && (
                                  <div>
                                    <p className="text-sm font-medium">
                                      Payment Status
                                    </p>
                                    <p className="text-sm">
                                      Down Payment: Rp{" "}
                                      {payment.paid_amount !== null
                                        ? payment.paid_amount.toLocaleString()
                                        : "0"}
                                      <br />
                                      Remaining: Rp{" "}
                                      {payment.amount
                                        ? (
                                            payment.amount -
                                            (payment.paid_amount || 0)
                                          ).toLocaleString()
                                        : "0"}
                                    </p>
                                  </div>
                                )}
                              {payment.status !== "paid" && (
                                <div className="md:col-span-2 mt-2">
                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      navigate(
                                        `/payment/${payment.id.replace("-remaining", "")}`,
                                      )
                                    }
                                  >
                                    Make Payment
                                  </Button>
                                </div>
                              )}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="remaining">
              <Card>
                <CardHeader>
                  <CardTitle>Remaining Payments</CardTitle>
                  <CardDescription>
                    View and manage your upcoming payments
                    {searchQuery && (
                      <span className="ml-2 font-medium">
                        - Showing results for "{searchQuery}"
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {filteredRemainingPayments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      {searchQuery ? (
                        <p>
                          No remaining payments found matching "{searchQuery}"
                        </p>
                      ) : (
                        <p>No remaining payments available</p>
                      )}
                    </div>
                  ) : (
                    <Accordion type="single" collapsible className="w-full">
                      {filteredRemainingPayments.map((payment) => (
                        <AccordionItem key={payment.id} value={payment.id}>
                          <AccordionTrigger className="hover:no-underline">
                            <div className="flex flex-1 items-center justify-between pr-4">
                              <div className="flex items-center">
                                <div className="mr-4">
                                  <p className="font-medium">
                                    {payment.booking_id}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {payment.vehicle_name}
                                  </p>
                                  {payment.license_plate && (
                                    <p className="text-sm text-muted-foreground">
                                      Plate: {payment.license_plate}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <p className="font-medium">
                                    Rp{" "}
                                    {payment.amount
                                      ? payment.amount.toLocaleString()
                                      : "0"}
                                  </p>
                                  {payment.paid_amount !== undefined &&
                                    payment.paid_amount > 0 && (
                                      <p className="text-xs text-muted-foreground">
                                        Down Payment: Rp{" "}
                                        {payment.paid_amount !== null
                                          ? payment.paid_amount.toLocaleString()
                                          : "0"}
                                      </p>
                                    )}
                                </div>
                                <Badge
                                  variant={
                                    payment.status === "upcoming"
                                      ? "outline"
                                      : "destructive"
                                  }
                                >
                                  {payment.status === "upcoming"
                                    ? "Upcoming"
                                    : "Overdue"}
                                </Badge>
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                              <div>
                                <p className="text-sm font-medium">Due Date</p>
                                <p className="text-sm">
                                  {format(payment.due_date, "PPP")}
                                  {payment.status === "overdue" && (
                                    <span className="text-destructive ml-2">
                                      (Overdue)
                                    </span>
                                  )}
                                </p>
                              </div>
                              {payment.paid_amount !== undefined &&
                                payment.paid_amount > 0 && (
                                  <div>
                                    <p className="text-sm font-medium">
                                      Payment Status
                                    </p>
                                    <p className="text-sm">
                                      Down Payment: Rp{" "}
                                      {payment.paid_amount !== null
                                        ? payment.paid_amount.toLocaleString()
                                        : "0"}
                                      <br />
                                      Remaining: Rp{" "}
                                      {payment.amount
                                        ? payment.amount.toLocaleString()
                                        : "0"}
                                    </p>
                                  </div>
                                )}
                              <div className="md:col-span-2 mt-2">
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    navigate(
                                      `/payment/${payment.id.replace("-remaining", "")}`,
                                    )
                                  }
                                >
                                  Make Payment
                                </Button>
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default PaymentTracking;
