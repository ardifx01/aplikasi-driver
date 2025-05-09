import React, { useState, useEffect, Fragment } from "react";
import { useNavigate } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { format, isValid } from "date-fns";
import dayjs from "dayjs";
import {
  CalendarIcon,
  ChevronDown,
  ChevronUp,
  Filter,
  CreditCard,
  Clock,
  DollarSign,
  Search,
  ArrowLeft,
  Globe,
} from "lucide-react";

interface Booking {
  id: string;
  vehicle_name: string;
  vehicle_type: string;
  booking_date: Date;
  start_time: string;
  duration: number;
  status: "pending" | "approved" | "rejected";
  payment_method: string;
  total_amount: number;
  user_id?: string;
}

interface Payment {
  id: string;
  booking_id: string;
  vehicle_name: string;
  amount: number;
  paid_amount?: number;
  status: "paid" | "pending" | "overdue";
  date: Date | null;

  due_date?: Date;
  transaction_id?: string;
  payment_method?: string;
}

interface RemainingPayment {
  id: string;
  booking_id: string;
  vehicle_name: string;
  amount: number;
  paid_amount?: number;
  due_date: Date;
  status: "upcoming" | "overdue";
  payment_method?: string;
  transaction_id?: string;
}

// Import supabase client from lib
import { supabase } from "@/lib/supabase";

interface BookingHistoryProps {
  userId?: string;
  driverSaldo?: number;
}

const BookingHistory = ({ userId, driverSaldo }: BookingHistoryProps = {}) => {
  const navigate = useNavigate();
  const [mainTab, setMainTab] = useState<string>("bookings");
  const [bookingTab, setBookingTab] = useState<string>("all");
  const [paymentTab, setPaymentTab] = useState<string>("history");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [vehicleFilter, setVehicleFilter] = useState<string>("all");
  const [expandedBooking, setExpandedBooking] = useState<string | null>(null);
  const [expandedPayment, setExpandedPayment] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userSaldo, setUserSaldo] = useState<number>(0);

  // Bookings data - fetched from Supabase
  const [mockBookings, setMockBookings] = useState<Booking[]>([]);

  // Payments data - fetched from Supabase
  const [payments, setPayments] = useState<Payment[]>([]);

  // Remaining payments data - fetched from Supabase
  const [remainingPayments, setRemainingPayments] = useState<
    RemainingPayment[]
  >([]);

  // Fetch bookings from Supabase
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);

        // Create a query that can be filtered by user_id if provided
        let query = supabase.from("bookings").select(
          `
            id,
            license_plate,
            make,
            status,
            booking_date,
            total_amount,
            vehicle_name,
            vehicle_type,
            start_time,
            duration,
            payment_method,
            user_id
          `,
        );

        // Filter by user_id if provided
        if (userId) {
          query = query.eq("user_id", userId);
        }

        const { data, error } = await query;

        console.log("Bookings data for user:", userId, data);

        if (error) {
          throw error;
        }

        // Transform the data to match our Booking interface
        const formattedBookings = data.map((booking) => ({
          id: booking.id,
          vehicle_name: booking.vehicle_name || "Unknown Vehicle",
          vehicle_type: booking.vehicle_type || "Unknown Type",
          booking_date: new Date(booking.booking_date),
          start_time: booking.start_time || "00:00",
          duration: booking.duration || 0,
          status: booking.status || "pending",
          payment_method: booking.payment_method || "Unknown",
          total_amount: booking.total_amount || 0,
          user_id: booking.user_id,
          license_plate: booking.license_plate,
          vehicle_make: booking.make || "Unknown Make",
        }));

        setMockBookings(formattedBookings);
      } catch (error) {
        console.error("Error fetching bookings:", error);
        setError("Failed to fetch bookings");
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [userId]); // Add userId as dependency to refetch when it changes

  // Date range filter state
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });

  // Fetch payments from Supabase
  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setLoading(true);
        let query = supabase
          .from("payments")
          .select(
            "id, booking_id, amount, paid_amount, status, created_at, due_date, transaction_id, payment_method, bookings(vehicle_name)",
          );

        // Apply date filter if set
        if (dateRange.from) {
          const fromDate = format(dateRange.from, "yyyy-MM-dd");
          query = query.gte("date", fromDate);
        }

        if (dateRange.to) {
          const toDate = format(dateRange.to, "yyyy-MM-dd");
          query = query.lte("date", toDate);
        }

        const { data, error } = await query;

        if (error) {
          throw error;
        }
        console.log("Raw payment data:", data);
        console.log("Payments data:", data);

        // Transform the data to match our Payment interface
        const formattedPayments = data.map((payment) => ({
          id: payment.id,
          booking_id: payment.booking_id || "",
          vehicle_name: payment.bookings?.vehicle_name || "Unknown Vehicle",
          amount: payment.amount || 0,
          paid_amount: payment.paid_amount,
          status: payment.status || "pending",
          date: payment.created_at ? new Date(payment.created_at) : null,
          due_date: payment.due_date ? new Date(payment.due_date) : undefined,
          transaction_id: payment.transaction_id,
          payment_method: payment.payment_method,
        }));

        setPayments(formattedPayments);
      } catch (error) {
        console.error("Error fetching payments:", error);
        setError("Failed to fetch payments");
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [dateRange.from, dateRange.to]);

  // Check for overdue payments - Fix for Maximum update depth exceeded error
  useEffect(() => {
    const today = new Date();
    let needsUpdate = false;

    // Update payment status based on due date
    const updatedPayments = payments.map((payment) => {
      if (
        payment.status !== "paid" &&
        payment.due_date &&
        payment.due_date < today
      ) {
        needsUpdate = true;
        return { ...payment, status: "overdue" };
      }
      return payment;
    });

    // Update remaining payments status based on due date
    const updatedRemainingPayments = remainingPayments.map((payment) => {
      if (payment.due_date < today && payment.status !== "overdue") {
        needsUpdate = true;
        return { ...payment, status: "overdue" };
      }
      return payment;
    });

    // Only update if there are actual changes to avoid infinite loops
    if (needsUpdate) {
      setPayments(updatedPayments);
      setRemainingPayments(updatedRemainingPayments);
    }
  }, [payments, remainingPayments]);

  // Fetch remaining payments from Supabase with payments data
  useEffect(() => {
    const fetchRemainingPayments = async () => {
      try {
        setLoading(true);
        let query = supabase.from("remaining_payments").select(`
            *,
            bookings(vehicle_name, user_id),
            payments(id, status, payment_method, transaction_id, paid_amount)
          `);

        // Filter by user_id if provided
        if (userId) {
          // Filter remaining payments where the associated booking belongs to the user
          query = query.eq("bookings.user_id", userId);
        }

        // Apply date filter if set
        if (dateRange.from) {
          const fromDate = format(dateRange.from, "yyyy-MM-dd");
          query = query.gte("due_date", fromDate);
        }

        if (dateRange.to) {
          const toDate = format(dateRange.to, "yyyy-MM-dd");
          query = query.lte("due_date", toDate);
        }

        const { data, error } = await query;

        if (error) {
          throw error;
        }

        // Transform the data to match our RemainingPayment interface
        const formattedRemainingPayments = data.map((payment) => ({
          id: payment.id,
          booking_id: payment.booking_id || "",
          vehicle_name: payment.bookings?.vehicle_name || "Unknown Vehicle",
          amount: payment.amount || 0,
          paid_amount: payment.payments?.paid_amount || payment.paid_amount,
          due_date: new Date(payment.due_date),
          status:
            payment.payments?.status === "overdue"
              ? "overdue"
              : payment.status || "upcoming",
          payment_method: payment.payments?.payment_method,
          transaction_id: payment.payments?.transaction_id,
        }));

        console.log(
          "Remaining payments with payment data:",
          formattedRemainingPayments,
        );
        setRemainingPayments(formattedRemainingPayments);
      } catch (error) {
        console.error("Error fetching remaining payments:", error);
        setError("Failed to fetch remaining payments");
      } finally {
        setLoading(false);
      }
    };

    fetchRemainingPayments();
  }, [dateRange.from, dateRange.to, userId]);

  // Helper function to check if a date is valid
  const isValidDate = (date: Date): boolean => {
    return date instanceof Date && !isNaN(date.getTime()) && isValid(date);
  };

  // Format date safely using dayjs for consistency
  const formatDate = (date: any, formatStr: string): string => {
    try {
      const parsed = dayjs(date); // tanpa .add()

      if (!parsed.isValid()) return "Invalid date";

      if (formatStr === "PPP") return parsed.format("DD/MM/YYYY");
      if (formatStr === "dd MMM yyyy") return parsed.format("DD MMM YYYY");
      if (formatStr === "yyyy-MM-dd") return parsed.format("YYYY-MM-DD");

      return parsed.format(formatStr);
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date";
    }
  };

  const calculateEndDate = (booking: Booking): string => {
    try {
      if (!isValidDate(booking.booking_date)) return "Invalid date";
      const dateStr = dayjs(booking.booking_date).format("YYYY-MM-DD");
      const [hours, minutes] = booking.start_time.split(":").map(Number);
      const startDateTime = new Date(`${dateStr}T${booking.start_time}`);
      startDateTime.setHours(hours);
      startDateTime.setMinutes(minutes);
      const endDate = new Date(
        startDateTime.getTime() + booking.duration * 60 * 60 * 1000,
      );

      return endDate.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    } catch (error) {
      console.error("Error calculating end date:", error);
      return "Invalid date";
    }
  };

  // Calculate end time safely
  const calculateEndTime = (booking: Booking): string => {
    try {
      if (!isValidDate(booking.booking_date)) return "Invalid time";
      const startDate = dayjs(
        `${dayjs(booking.booking_date).format("YYYY-MM-DD")}T${booking.start_time}`,
      );

      // Anggap durasi dalam satuan hari
      const endDate = startDate.add(booking.duration, "day");

      return endDate.format("DD MMM YYYY, HH:mm");
    } catch (error) {
      console.error("Error calculating end time:", error);
      return "Invalid time";
    }
  };

  // Filter bookings based on selected tab, date, and vehicle
  const filteredBookings = mockBookings.filter((booking) => {
    // Filter by status
    if (bookingTab !== "all" && booking.status !== bookingTab) return false;

    // Filter by date
    if (date && isValidDate(date)) {
      if (!isValidDate(booking.booking_date)) return false;
      try {
        const bookingDateStr = formatDate(booking.booking_date, "YYYY-MM-DD");
        const filterDateStr = formatDate(date, "YYYY-MM-DD");
        if (bookingDateStr !== filterDateStr) return false;
      } catch (error) {
        console.error("Error comparing dates:", error);
        return false;
      }
    }

    // Filter by vehicle
    if (vehicleFilter !== "all" && booking.vehicle_name !== vehicleFilter)
      return false;

    return true;
  });

  // Filter payments based on search query
  const filteredPayments = payments.filter(
    (payment) =>
      payment.vehicle_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.booking_id.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Filter remaining payments based on search query
  const filteredRemainingPayments = remainingPayments.filter(
    (payment) =>
      payment.vehicle_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.booking_id.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Get unique vehicle names for the filter dropdown
  const vehicleOptions = [
    "all",
    ...new Set(mockBookings.map((booking) => booking.vehicle_name)),
  ];

  // Toggle expanded booking details
  const toggleBookingDetails = (bookingId: string) => {
    if (expandedBooking === bookingId) {
      setExpandedBooking(null);
    } else {
      setExpandedBooking(bookingId);
    }
  };

  // Toggle expanded payment details
  const togglePaymentDetails = (paymentId: string) => {
    if (expandedPayment === paymentId) {
      setExpandedPayment(null);
    } else {
      setExpandedPayment(paymentId);
    }
  };

  // Get status badge color
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "approved":
        return "secondary";
      case "pending":
        return "default";
      case "rejected":
        return "destructive";
      default:
        return "default";
    }
  };

  // Reset all filters
  const resetFilters = () => {
    setBookingTab("all");
    setDate(undefined);
    setVehicleFilter("all");
    setSearchQuery("");
    setHistorySearchQuery("");
    setRemainingSearchQuery("");
  };

  // Calculate total paid amount
  const totalPaid = payments
    .filter((payment) => payment.status === "paid")
    .reduce((sum, payment) => sum + payment.amount, 0);

  // Calculate total pending amount
  const totalPending = [
    ...payments.filter((payment) => payment.status === "pending"),
    ...remainingPayments,
  ].reduce((sum, payment) => sum + payment.amount, 0);

  // Create a separate search state for each tab to avoid sharing the same search query
  const [historySearchQuery, setHistorySearchQuery] = useState("");
  const [remainingSearchQuery, setRemainingSearchQuery] = useState("");

  // Use the appropriate search query based on the active tab
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (paymentTab === "history") {
      setHistorySearchQuery(value);
    } else {
      setRemainingSearchQuery(value);
    }
  };

  // Get the current search query based on the active tab
  const currentSearchQuery =
    paymentTab === "history" ? historySearchQuery : remainingSearchQuery;

  // Filter payments based on the appropriate search query
  const filteredPaymentsByTab = payments.filter(
    (payment) =>
      payment.vehicle_name
        .toLowerCase()
        .includes(currentSearchQuery.toLowerCase()) ||
      payment.booking_id
        .toLowerCase()
        .includes(currentSearchQuery.toLowerCase()),
  );

  // Filter remaining payments based on the appropriate search query
  const filteredRemainingPaymentsByTab = remainingPayments.filter(
    (payment) =>
      payment.vehicle_name
        .toLowerCase()
        .includes(currentSearchQuery.toLowerCase()) ||
      payment.booking_id
        .toLowerCase()
        .includes(currentSearchQuery.toLowerCase()),
  );

  // Fetch driver saldo if not provided via props
  useEffect(() => {
    const fetchDriverSaldo = async () => {
      if (userId) {
        try {
          // First try to get from drivers table
          const { data, error } = await supabase
            .from("drivers")
            .select("saldo")
            .eq("id", userId)
            .single();

          if (error) {
            console.error("Error fetching driver saldo:", error);
            // Try users table as fallback
            const { data: userData, error: userError } = await supabase
              .from("users")
              .select("saldo")
              .eq("id", userId)
              .single();

            if (!userError && userData && userData.saldo !== undefined) {
              console.log("Driver saldo from users table:", userData.saldo);
              setUserSaldo(userData.saldo);
              return;
            }
            return;
          }

          console.log("Driver saldo data:", data);
          if (data && data.saldo !== undefined) {
            setUserSaldo(data.saldo);
          }
        } catch (error) {
          console.error("Error in fetchDriverSaldo:", error);
        }
      }
    };

    // If driverSaldo is provided via props, use it
    if (driverSaldo !== undefined) {
      setUserSaldo(driverSaldo);
    } else {
      fetchDriverSaldo();
    }
  }, [userId, driverSaldo]);

  return (
    <div className="w-full bg-background p-4 md:p-6">
      {loading && (
        <div className="flex justify-center items-center h-40">
          <p className="text-muted-foreground">Loading data...</p>
        </div>
      )}

      {error && (
        <div className="flex justify-center items-center h-40">
          <p className="text-destructive">{error}</p>
        </div>
      )}

      {!loading && !error && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <Button
              variant="ghost"
              className="flex items-center gap-1"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Kembali</span>
            </Button>
            <Button variant="outline" size="icon" className="rounded-full">
              <Globe className="h-4 w-4" />
            </Button>
          </div>
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">
                Riwayat & Pembayaran
              </CardTitle>
              <CardDescription>
                Lihat dan kelola pemesanan dan pembayaran Anda
              </CardDescription>

              <Tabs
                value={mainTab}
                onValueChange={setMainTab}
                className="w-full mt-4"
              >
                <TabsList className="grid grid-cols-2 w-full md:w-[400px]">
                  <TabsTrigger value="bookings" className="flex items-center">
                    <Clock className="mr-2 h-4 w-4" />
                    Riwayat Pemesanan
                  </TabsTrigger>
                  <TabsTrigger value="payments" className="flex items-center">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Riwayat Pembayaran
                  </TabsTrigger>
                </TabsList>

                <CardContent>
                  <TabsContent value="bookings" className="mt-0">
                    <div className="flex flex-col md:flex-row gap-4 mb-4">
                      <Tabs
                        value={bookingTab}
                        onValueChange={setBookingTab}
                        className="w-full md:w-auto"
                      >
                        <TabsList className="grid grid-cols-4 w-full md:w-[500px]">
                          <TabsTrigger value="all">Semua</TabsTrigger>
                          <TabsTrigger value="pending">Tertunda</TabsTrigger>
                          <TabsTrigger value="approved">Disetujui</TabsTrigger>
                          <TabsTrigger value="cancelled">
                            Dibatalkan
                          </TabsTrigger>
                        </TabsList>
                      </Tabs>

                      <div className="flex flex-col md:flex-row gap-2 md:ml-auto">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full md:w-auto justify-start text-left font-normal"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {date && isValidDate(date) ? (
                                formatDate(date, "PPP")
                              ) : (
                                <span>Pilih tanggal</span>
                              )}
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

                        <Select
                          value={vehicleFilter}
                          onValueChange={setVehicleFilter}
                        >
                          <SelectTrigger className="w-full md:w-[200px]">
                            <SelectValue placeholder="Filter berdasarkan kendaraan" />
                          </SelectTrigger>
                          <SelectContent>
                            {vehicleOptions.map((vehicle) => (
                              <SelectItem key={vehicle} value={vehicle}>
                                {vehicle === "all"
                                  ? "Semua Kendaraan"
                                  : vehicle}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Button
                          variant="ghost"
                          onClick={resetFilters}
                          className="w-full md:w-auto"
                        >
                          <Filter className="mr-2 h-4 w-4" />
                          Reset Filter
                        </Button>
                      </div>
                    </div>

                    {filteredBookings.length > 0 ? (
                      <div className="hidden md:block">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Kendaraan</TableHead>
                              <TableHead>Tanggal Pemesanan</TableHead>
                              <TableHead>Waktu Mulai</TableHead>
                              <TableHead>Durasi</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Pembayaran</TableHead>
                              <TableHead>Aksi</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredBookings.map((booking) => (
                              <React.Fragment key={booking.id}>
                                <TableRow>
                                  <TableCell className="font-medium">
                                    {booking.vehicle_name}
                                  </TableCell>
                                  <TableCell>
                                    {formatDate(
                                      booking.booking_date,
                                      "dd MMM yyyy",
                                    )}
                                  </TableCell>
                                  <TableCell>{booking.start_time}</TableCell>
                                  <TableCell>{booking.duration} Hari</TableCell>
                                  <TableCell>
                                    <Badge
                                      variant={getStatusBadgeVariant(
                                        booking.status,
                                      )}
                                    >
                                      {booking.status.charAt(0).toUpperCase() +
                                        booking.status.slice(1)}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    Rp {booking.total_amount.toLocaleString()}
                                  </TableCell>
                                  <TableCell>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="w-full justify-center"
                                      onClick={() =>
                                        toggleBookingDetails(booking.id)
                                      }
                                    >
                                      <div className="flex items-center">
                                        <ChevronDown className="h-4 w-4 mr-1" />{" "}
                                        Lihat Detail
                                      </div>
                                    </Button>
                                  </TableCell>
                                </TableRow>
                                {expandedBooking === booking.id && (
                                  <TableRow>
                                    <TableCell
                                      colSpan={7}
                                      className="bg-muted/50"
                                    >
                                      <div className="p-4">
                                        <h4 className="font-semibold mb-2">
                                          Detail Pemesanan
                                        </h4>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                          <div>
                                            <p className="text-sm text-muted-foreground">
                                              Tipe Kendaraan
                                            </p>
                                            <p>{booking.vehicle_type}</p>
                                          </div>
                                          <div>
                                            <p className="text-sm text-muted-foreground">
                                              Model Kendaraan
                                            </p>
                                            <p> {booking.vehicle_name}</p>
                                            <p>{booking.license_plate}</p>
                                          </div>
                                          <div>
                                            <p className="text-sm text-muted-foreground">
                                              Metode Pembayaran
                                            </p>
                                            <p>{booking.payment_method}</p>
                                          </div>
                                          <div>
                                            <p className="text-sm text-muted-foreground">
                                              Waktu Selesai
                                            </p>
                                            {(() => {
                                              const endDate = dayjs(
                                                `${dayjs(booking.booking_date).format("YYYY-MM-DD")}T${booking.start_time}`,
                                              ).add(booking.duration, "day");

                                              return (
                                                <div key="end-date-display">
                                                  <p>
                                                    Tanggal:{" "}
                                                    {endDate.format(
                                                      "DD MMM YYYY",
                                                    )}
                                                  </p>
                                                  <p>
                                                    Jam:{" "}
                                                    {endDate.format("HH:mm")}
                                                  </p>
                                                </div>
                                              );
                                            })()}
                                          </div>
                                          <div>
                                            <p className="text-sm text-muted-foreground">
                                              ID Pemesanan
                                            </p>
                                            <p>#{booking.id}</p>
                                          </div>
                                        </div>
                                        {(booking.status === "pending" ||
                                          booking.status === "approved") && (
                                          <div className="mt-4">
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              className="mr-2"
                                            >
                                              Batalkan Pemesanan
                                            </Button>
                                            <Button size="sm">
                                              Hubungi Dukungan
                                            </Button>
                                          </div>
                                        )}
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                )}
                              </React.Fragment>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center py-10">
                        <p className="text-muted-foreground">
                          Tidak ada pemesanan yang sesuai dengan filter Anda.
                        </p>
                        <Button
                          variant="outline"
                          onClick={resetFilters}
                          className="mt-4"
                        >
                          Reset Filter
                        </Button>
                      </div>
                    )}

                    {/* Mobile view */}
                    <div className="md:hidden space-y-4">
                      {filteredBookings.length > 0 ? (
                        filteredBookings.map((booking) => (
                          <Card key={booking.id} className="overflow-hidden">
                            <CardHeader className="p-4 pb-2">
                              <div className="flex justify-between items-start">
                                <div>
                                  <CardTitle className="text-lg">
                                    {booking.vehicle_name}
                                  </CardTitle>
                                  <CardDescription>
                                    {formatDate(
                                      booking.booking_date,
                                      "dd MMM yyyy",
                                    )}{" "}
                                    at {booking.start_time}
                                  </CardDescription>
                                </div>
                                <Badge
                                  variant={getStatusBadgeVariant(
                                    booking.status,
                                  )}
                                >
                                  {booking.status.charAt(0).toUpperCase() +
                                    booking.status.slice(1)}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
                              <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                                <div>
                                  <p className="text-muted-foreground">
                                    Durasi
                                  </p>
                                  <p>{booking.duration} day</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">
                                    Pembayaran
                                  </p>
                                  <p>
                                    Rp {booking.total_amount.toLocaleString()}
                                  </p>
                                </div>
                              </div>

                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full justify-center"
                                onClick={() => toggleBookingDetails(booking.id)}
                              >
                                <span className="flex items-center">
                                  <ChevronDown className="h-4 w-4 mr-1" /> Lihat
                                  Detail
                                </span>
                              </Button>

                              {expandedBooking === booking.id && (
                                <div className="mt-3 pt-3 border-t">
                                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                                    <div>
                                      <p className="text-muted-foreground">
                                        Tipe Kendaraan
                                      </p>
                                      <p>{booking.vehicle_type}</p>
                                    </div>
                                    <div>
                                      <p className="text-muted-foreground">
                                        Metode Pembayaran
                                      </p>
                                      <p>{booking.payment_method}</p>
                                    </div>
                                    <div>
                                      <p className="text-muted-foreground">
                                        Waktu Selesai2
                                      </p>
                                      <p>{calculateEndTime(booking)}</p>
                                    </div>
                                    <div>
                                      <p className="text-muted-foreground">
                                        ID Pemesanan
                                      </p>
                                      <p>#{booking.id}</p>
                                    </div>
                                  </div>
                                  {(booking.status === "pending" ||
                                    booking.status === "approved") && (
                                    <div className="flex gap-2 mt-3">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1"
                                        onClick={() => {
                                          // Handle cancel booking
                                          if (
                                            confirm(
                                              "Apakah Anda yakin ingin membatalkan pemesanan ini?",
                                            )
                                          ) {
                                            supabase
                                              .from("bookings")
                                              .update({ status: "cancelled" })
                                              .eq("id", booking.id)
                                              .then(({ error }) => {
                                                if (error) {
                                                  alert(
                                                    "Gagal membatalkan pemesanan: " +
                                                      error.message,
                                                  );
                                                } else {
                                                  alert(
                                                    "Pemesanan berhasil dibatalkan",
                                                  );
                                                  // Update the booking status in the UI
                                                  setMockBookings(
                                                    (prevBookings) =>
                                                      prevBookings.map((b) =>
                                                        b.id === booking.id
                                                          ? {
                                                              ...b,
                                                              status:
                                                                "cancelled",
                                                            }
                                                          : b,
                                                      ),
                                                  );
                                                }
                                              });
                                          }
                                        }}
                                      >
                                        Batalkan
                                      </Button>
                                      <Button size="sm" className="flex-1">
                                        Hubungi Dukungan
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))
                      ) : (
                        <div className="text-center py-10">
                          <p className="text-muted-foreground">
                            Tidak ada pemesanan yang sesuai dengan filter Anda.
                          </p>
                          <Button
                            variant="outline"
                            onClick={resetFilters}
                            className="mt-4"
                          >
                            Reset Filter
                          </Button>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="payments" className="mt-0">
                    <Tabs
                      value={paymentTab}
                      onValueChange={setPaymentTab}
                      className="w-full mb-4"
                    >
                      <TabsList className="mb-4">
                        <TabsTrigger value="history">
                          Riwayat Pembayaran
                        </TabsTrigger>
                        <TabsTrigger value="remaining">
                          Pembayaran Tersisa
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="history" className="mt-0">
                        {/* Date Range Filter */}
                        <div className="flex flex-col md:flex-row gap-4 mb-6">
                          <div className="flex-1">
                            <p className="text-sm font-medium mb-2">
                              Dari Tanggal
                            </p>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className="w-full justify-start text-left font-normal"
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {dateRange.from ? (
                                    formatDate(dateRange.from, "PPP")
                                  ) : (
                                    <span>Pilih tanggal mulai</span>
                                  )}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent
                                className="w-auto p-0"
                                align="start"
                              >
                                <Calendar
                                  mode="single"
                                  selected={dateRange.from}
                                  onSelect={(date) =>
                                    setDateRange({ ...dateRange, from: date })
                                  }
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium mb-2">
                              Sampai Tanggal
                            </p>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className="w-full justify-start text-left font-normal"
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {dateRange.to ? (
                                    formatDate(dateRange.to, "PPP")
                                  ) : (
                                    <span>Pilih tanggal akhir</span>
                                  )}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent
                                className="w-auto p-0"
                                align="start"
                              >
                                <Calendar
                                  mode="single"
                                  selected={dateRange.to}
                                  onSelect={(date) =>
                                    setDateRange({ ...dateRange, to: date })
                                  }
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                          <div className="flex items-end">
                            <Button
                              variant="outline"
                              onClick={() =>
                                setDateRange({ from: undefined, to: undefined })
                              }
                              className="w-full md:w-auto"
                            >
                              <Filter className="mr-2 h-4 w-4" />
                              Reset Filter
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm font-medium text-muted-foreground">
                                Total Dibayar
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
                                Pembayaran Tertunda
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
                                Jatuh Tempo
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="flex items-center">
                                <CalendarIcon className="mr-2 h-4 w-4 text-blue-500" />
                                <span className="text-2xl font-bold">
                                  {remainingPayments.length} Pembayaran
                                </span>
                              </div>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm font-medium text-muted-foreground">
                                Saldo Driver
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="flex items-center">
                                <DollarSign className="mr-2 h-4 w-4 text-primary" />
                                <span className="text-2xl font-bold">
                                  Rp {userSaldo.toLocaleString()}
                                </span>
                              </div>
                            </CardContent>
                          </Card>
                        </div>

                        <div className="mb-4">
                          <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="search"
                              placeholder="Cari berdasarkan kendaraan atau ID pemesanan..."
                              className="pl-8"
                              value={historySearchQuery}
                              onChange={handleSearchChange}
                            />
                          </div>
                        </div>

                        <Accordion type="single" collapsible className="w-full">
                          {filteredPaymentsByTab.map((payment) => (
                            <AccordionItem key={payment.id} value={payment.id}>
                              <AccordionTrigger className="hover:no-underline">
                                <div className="flex flex-1 items-center justify-between pr-4">
                                  <div className="flex items-center">
                                    <div className="mr-4">
                                      <p className="font-medium">
                                        {payment.vehicle_name}
                                      </p>
                                      <p className="text-sm text-muted-foreground">
                                        {payment.booking_id}
                                      </p>
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
                                        payment.paid_amount <
                                          payment.amount && (
                                          <p className="text-xs text-muted-foreground">
                                            Dibayar: Rp{" "}
                                            {payment.paid_amount
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
                                        ? "Dibayar"
                                        : payment.status === "pending"
                                          ? "Tertunda"
                                          : "Terlambat"}
                                      {payment.paid_amount !== undefined &&
                                        payment.paid_amount < payment.amount &&
                                        " (Sebagian)"}
                                    </Badge>
                                  </div>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                  <div>
                                    <p className="text-sm font-medium">
                                      Tanggal Pembayaran
                                    </p>
                                    <p className="text-sm">
                                      {payment.date && isValidDate(payment.date)
                                        ? formatDate(payment.date, "PPP")
                                        : "Tanggal tidak tersedia"}
                                    </p>
                                  </div>
                                  {payment.due_date && (
                                    <div>
                                      <p className="text-sm font-medium">
                                        Tanggal Jatuh Tempo
                                      </p>
                                      <p className="text-sm">
                                        {formatDate(payment.due_date, "PPP")}
                                        {payment.status === "overdue" && (
                                          <span className="text-destructive ml-2">
                                            (Terlambat)
                                          </span>
                                        )}
                                      </p>
                                    </div>
                                  )}
                                  {payment.transaction_id && (
                                    <div>
                                      <p className="text-sm font-medium">
                                        ID Transaksi
                                      </p>
                                      <p className="text-sm">
                                        {payment.transaction_id}
                                      </p>
                                    </div>
                                  )}
                                  {payment.payment_method && (
                                    <div>
                                      <p className="text-sm font-medium">
                                        Metode Pembayaran
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
                                          Status Pembayaran
                                        </p>
                                        <p className="text-sm">
                                          Uang Muka: Rp{" "}
                                          {payment.paid_amount
                                            ? payment.paid_amount.toLocaleString()
                                            : "0"}
                                          <br />
                                          Sisa: Rp{" "}
                                          {payment.amount && payment.paid_amount
                                            ? (
                                                payment.amount -
                                                payment.paid_amount
                                              ).toLocaleString()
                                            : "0"}
                                        </p>
                                      </div>
                                    )}
                                  {payment.status !== "paid" && (
                                    <div className="md:col-span-2 mt-2">
                                      <Button
                                        size="sm"
                                        className="mr-2"
                                        onClick={() => {
                                          // Handle payment process
                                          alert(
                                            `Proses pembayaran untuk ID: ${payment.id} dengan jumlah: Rp ${payment.amount.toLocaleString()}`,
                                          );
                                        }}
                                      >
                                        Bayar Penuh
                                      </Button>
                                      {payment.paid_amount === undefined && (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => {
                                            // Handle partial payment process
                                            alert(
                                              `Proses uang muka untuk ID: ${payment.id} dengan jumlah: Rp ${Math.floor(payment.amount * 0.3).toLocaleString()}`,
                                            );
                                          }}
                                        >
                                          Bayar Uang Muka
                                        </Button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </TabsContent>

                      <TabsContent value="remaining" className="mt-0">
                        <div className="mb-4">
                          <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="search"
                              placeholder="Cari berdasarkan kendaraan atau ID pemesanan..."
                              className="pl-8"
                              value={remainingSearchQuery}
                              onChange={handleSearchChange}
                            />
                          </div>
                        </div>

                        <Accordion type="single" collapsible className="w-full">
                          {filteredRemainingPaymentsByTab.map((payment) => (
                            <AccordionItem key={payment.id} value={payment.id}>
                              <AccordionTrigger className="hover:no-underline">
                                <div className="flex flex-1 items-center justify-between pr-4">
                                  <div className="flex items-center">
                                    <div className="mr-4">
                                      <p className="font-medium">
                                        {payment.vehicle_name}
                                      </p>
                                      <p className="text-sm text-muted-foreground">
                                        {payment.booking_id}
                                      </p>
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
                                            Uang Muka: Rp{" "}
                                            {payment.paid_amount
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
                                        ? "Akan Datang"
                                        : "Terlambat"}
                                    </Badge>
                                  </div>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                  <div>
                                    <p className="text-sm font-medium">
                                      Tanggal Jatuh Tempo
                                    </p>
                                    <p className="text-sm">
                                      {formatDate(payment.due_date, "PPP")}
                                      {payment.status === "overdue" && (
                                        <span className="text-destructive ml-2">
                                          (Terlambat)
                                        </span>
                                      )}
                                    </p>
                                  </div>
                                  {payment.paid_amount !== undefined &&
                                    payment.paid_amount > 0 && (
                                      <div>
                                        <p className="text-sm font-medium">
                                          Status Pembayaran
                                        </p>
                                        <p className="text-sm">
                                          Uang Muka: Rp{" "}
                                          {payment.paid_amount
                                            ? payment.paid_amount.toLocaleString()
                                            : "0"}
                                          <br />
                                          Sisa: Rp{" "}
                                          {payment.amount
                                            ? payment.amount.toLocaleString()
                                            : "0"}
                                        </p>
                                      </div>
                                    )}
                                  {payment.payment_method && (
                                    <div>
                                      <p className="text-sm font-medium">
                                        Metode Pembayaran
                                      </p>
                                      <p className="text-sm">
                                        {payment.payment_method}
                                      </p>
                                    </div>
                                  )}
                                  {payment.transaction_id && (
                                    <div>
                                      <p className="text-sm font-medium">
                                        ID Transaksi
                                      </p>
                                      <p className="text-sm">
                                        {payment.transaction_id}
                                      </p>
                                    </div>
                                  )}
                                  <div className="md:col-span-2 mt-2">
                                    <Button
                                      size="sm"
                                      className="mr-2"
                                      onClick={() => {
                                        // Handle payment process
                                        alert(
                                          `Proses pembayaran untuk ID: ${payment.id} dengan jumlah: Rp ${payment.amount.toLocaleString()}`,
                                        );
                                      }}
                                    >
                                      Bayar Penuh
                                    </Button>
                                    {payment.paid_amount === undefined && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          // Handle partial payment process
                                          alert(
                                            `Proses uang muka untuk ID: ${payment.id} dengan jumlah: Rp ${Math.floor(payment.amount * 0.3).toLocaleString()}`,
                                          );
                                        }}
                                      >
                                        Bayar Uang Muka
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </TabsContent>
                    </Tabs>
                  </TabsContent>
                </CardContent>
              </Tabs>
            </CardHeader>
          </Card>
        </div>
      )}
    </div>
  );
};

export default BookingHistory;
