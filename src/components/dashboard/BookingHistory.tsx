import React, { useState, useEffect } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { format, isValid, parseISO } from "date-fns";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);
import { id } from "date-fns/locale";
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
  status: "pending" | "approved" | "rejected" | "cancelled";
  payment_method: string;
  total_amount: number;
  paid_amount?: number;
  remaining_payments?: number;
  user_id?: string;
  notes_driver?: string;
  license_plate?: string;
  vehicle_make?: string;
  created_at?: string;
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
  const [cancelDialogOpen, setCancelDialogOpen] = useState<string | null>(null);
  const [cancellationReason, setCancellationReason] = useState<string>("");

  // Bookings data - fetched from Supabase
  const [mockBookings, setMockBookings] = useState<Booking[]>([]);

  const createdAtWIB = dayjs("2025-09-05 10:27:07+00")
    .tz("Asia/Jakarta")
    .format("DD MMM YYYY, HH:mm");

  console.log(createdAtWIB); // "05 Sep 2025, 17:27"

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
        setError(null);

        // Get current session first
        const { data: sessionData } = await supabase.auth.getSession();
        let currentUserId = userId;

        if (!currentUserId && sessionData?.session?.user?.id) {
          currentUserId = sessionData.session.user.id;
        }

        if (!currentUserId) {
          console.error("No user ID available for fetching bookings");
          setError("No user ID available");
          setLoading(false);
          return;
        }

        console.log(
          "BookingHistory - Fetching bookings for user ID:",
          currentUserId,
        );
        console.log(
          "BookingHistory - Session user ID:",
          sessionData?.session?.user?.id,
        );
        console.log("BookingHistory - Prop user ID:", userId);

        // Try multiple approaches to find bookings
        let bookingsData = null;
        let bookingsError = null;

        // First try with the current user ID
        const { data: directBookings, error: directError } = await supabase
          .from("bookings")
          .select(
            `
            id,
            created_at,
            created_at_tz,
            code_booking,
            notes_driver,
            license_plate,
            plate_number,
            make,
            model,
            bookings_status,
            status,
            booking_date,
            total_amount,
            vehicle_name,
            vehicle_type,
            start_time,
            duration,
            payment_method,
            user_id,
            customer_id,
            paid_amount,
            remaining_payments
          `,
          )
          .eq("user_id", currentUserId);

        console.log(
          "BookingHistory - Direct bookings query result:",
          directBookings?.length || 0,
        );
        console.log("BookingHistory - Direct bookings error:", directError);

        if (directBookings && directBookings.length > 0) {
          bookingsData = directBookings;
        } else {
          // If no bookings found with user_id, try with customer_id
          const { data: customerBookings, error: customerError } =
            await supabase
              .from("bookings")
              .select(
                `
              id,
              created_at,
              notes_driver,
              license_plate,
              plate_number,
              make,
              model,
              bookings_status,
              status,
              booking_date,
              total_amount,
              vehicle_name,
              vehicle_type,
              start_time,
              duration,
              payment_method,
              user_id,
              customer_id,
              paid_amount,
              remaining_payments
            `,
              )
              .eq("customer_id", currentUserId);

          console.log(
            "BookingHistory - Customer bookings query result:",
            customerBookings?.length || 0,
          );
          console.log(
            "BookingHistory - Customer bookings error:",
            customerError,
          );

          if (customerBookings && customerBookings.length > 0) {
            bookingsData = customerBookings;
          } else {
            // If still no bookings, try to find by email if available
            if (sessionData?.session?.user?.email) {
              const userEmail = sessionData.session.user.email;
              console.log(
                "BookingHistory - Trying to find user by email:",
                userEmail,
              );

              // Check if there's a user record with this email that has bookings
              const { data: userByEmail } = await supabase
                .from("users")
                .select("id")
                .eq("email", userEmail)
                .maybeSingle();

              const { data: driverByEmail } = await supabase
                .from("drivers")
                .select("id")
                .eq("email", userEmail)
                .maybeSingle();

              const emailUserId = userByEmail?.id || driverByEmail?.id;

              if (emailUserId && emailUserId !== currentUserId) {
                console.log(
                  "BookingHistory - Found user by email with ID:",
                  emailUserId,
                );
                const { data: emailBookings, error: emailError } =
                  await supabase
                    .from("bookings")
                    .select(
                      `
                    id,
                    created_at,
                    notes_driver,
                    license_plate,
                    plate_number,
                    make,
                    model,
                    bookings_status,
                    status,
                    booking_date,
                    total_amount,
                    vehicle_name,
                    vehicle_type,
                    start_time,
                    duration,
                    payment_method,
                    user_id,
                    customer_id,
                    paid_amount,
                    remaining_payments
                  `,
                    )
                    .or(
                      `user_id.eq.${emailUserId},customer_id.eq.${emailUserId}`,
                    );

                console.log(
                  "BookingHistory - Email bookings query result:",
                  emailBookings?.length || 0,
                );
                if (emailBookings && emailBookings.length > 0) {
                  bookingsData = emailBookings;
                }
              }
            }
          }
        }

        if (bookingsData && bookingsData.length > 0) {
          console.log(
            "BookingHistory - Successfully fetched bookings:",
            bookingsData.length,
          );
          // Transform the data to match our Booking interface
          const formattedBookings = bookingsData.map((booking) => {
            // Parse booking_date properly to ensure it's in local timezone
            let bookingDate;
            try {
              if (booking.booking_date) {
                // If booking_date is already a date string, parse it in local timezone
                bookingDate = dayjs(booking.booking_date)
                  .tz("Asia/Jakarta")
                  .toDate();
              } else {
                bookingDate = new Date();
              }
            } catch (error) {
              console.error("Error parsing booking_date:", error);
              bookingDate = new Date();
            }

            return {
              id: booking.id,
              created_at: booking.created_at,
              created_at_tz: booking.created_at_tz,
              code_booking: booking.code_booking,
              vehicle_name: booking.model || "Unknown Vehicle",
              vehicle_type: booking.vehicle_type || "Unknown Type",
              booking_date: bookingDate,
              start_time: booking.start_time || "00:00",
              duration: booking.duration || 0,
              status: booking.bookings_status || booking.status || "pending",
              payment_method: booking.payment_method || "Unknown",
              total_amount: booking.total_amount || 0,
              paid_amount: booking.paid_amount || 0,
              remaining_payments: booking.remaining_payments || 0,
              user_id: booking.user_id || booking.customer_id,
              license_plate:
                booking.license_plate ||
                booking.plate_number ||
                "Unknown Plate",
              vehicle_make: booking.make || "Unknown Make",
              notes_driver: booking.notes_driver || null,
            };
          });

          setMockBookings(formattedBookings);
          console.log(
            "BookingHistory - Processed bookings:",
            formattedBookings.length,
          );
        } else {
          console.log("BookingHistory - No bookings found for user");
          setMockBookings([]);
        }
      } catch (error) {
        console.error("BookingHistory - Error fetching bookings:", error);
        setError("Failed to fetch bookings. Please try again later.");
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

        // Get current session first
        const { data: sessionData } = await supabase.auth.getSession();
        let currentUserId = userId;

        if (!currentUserId && sessionData?.session?.user?.id) {
          currentUserId = sessionData.session.user.id;
        }

        if (!currentUserId) {
          console.log(
            "BookingHistory - No user ID available for payments fetch",
          );
          setPayments([]);
          setLoading(false);
          return;
        }

        let query = supabase
          .from("payments")
          .select(
            "id, booking_id, total_amount, amount, paid_amount, status, created_at, due_date, transaction_id, payment_method, user_id",
          );

        // Filter by user_id if available
        if (currentUserId) {
          query = query.eq("user_id", currentUserId);
        }

        // Apply date filter if set
        if (dateRange.from) {
          const fromDate = format(dateRange.from, "yyyy-MM-dd");
          query = query.gte("created_at", fromDate);
        }

        if (dateRange.to) {
          const toDate = format(dateRange.to, "yyyy-MM-dd");
          query = query.lte("created_at", toDate);
        }

        const { data, error } = await query;

        if (error) {
          throw error;
        }
        console.log("BookingHistory - Raw payment data:", data);
        console.log("BookingHistory - Payments data:", data);

        // Get vehicle names from bookings for each payment
        const paymentsWithVehicles = await Promise.all(
          data.map(async (payment) => {
            let vehicleName = "Unknown Vehicle";

            if (payment.booking_id) {
              const { data: bookingData } = await supabase
                .from("bookings")
                .select("vehicle_name")
                .eq("id", payment.booking_id)
                .single();

              if (bookingData?.vehicle_name) {
                vehicleName = bookingData.vehicle_name;
              }
            }

            return {
              id: payment.id,
              booking_id: payment.booking_id || "",
              vehicle_name: vehicleName,
              amount: payment.total_amount || payment.amount || 0,
              paid_amount: payment.paid_amount,
              status: payment.status || "pending",
              date: payment.created_at ? new Date(payment.created_at) : null,
              due_date: payment.due_date
                ? new Date(payment.due_date)
                : undefined,
              transaction_id: payment.transaction_id,
              payment_method: payment.payment_method,
            };
          }),
        );

        const formattedPayments = paymentsWithVehicles;

        setPayments(formattedPayments);
      } catch (error) {
        console.error("BookingHistory - Error fetching payments:", error);
        setError("Failed to fetch payments");
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [dateRange.from, dateRange.to, userId]);

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

        // Get current session first
        const { data: sessionData } = await supabase.auth.getSession();
        let currentUserId = userId;

        if (!currentUserId && sessionData?.session?.user?.id) {
          currentUserId = sessionData.session.user.id;
        }

        if (!currentUserId) {
          console.log(
            "BookingHistory - No user ID available for remaining payments fetch",
          );
          setRemainingPayments([]);
          setLoading(false);
          return;
        }

        // First get bookings for this user to find remaining payments
        const { data: userBookings } = await supabase
          .from("bookings")
          .select(
            "id, user_id, customer_id, vehicle_name, total_amount, paid_amount, remaining_payments, notes_driver, created_at",
          )
          .or(`user_id.eq.${currentUserId},customer_id.eq.${currentUserId}`);

        if (!userBookings || userBookings.length === 0) {
          console.log(
            "BookingHistory - No bookings found for remaining payments",
          );
          setRemainingPayments([]);
          setLoading(false);
          return;
        }

        const bookingIds = userBookings.map((b) => b.id);

        let query = supabase.from("remaining_payments").select(`
            *
          `);

        // Filter by booking IDs that belong to the user
        if (bookingIds.length > 0) {
          query = query.in("booking_id", bookingIds);
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
          console.error(
            "BookingHistory - Error fetching remaining payments:",
            error,
          );
          // Create remaining payments from bookings data if table query fails
          const remainingFromBookings = userBookings
            .filter((booking) => (booking.remaining_payments || 0) > 0)
            .map((booking) => ({
              id: `${booking.id}-remaining`,
              booking_id: booking.id,
              vehicle_name: booking.vehicle_name || "Unknown Vehicle",
              amount: booking.remaining_payments || 0,
              paid_amount: booking.paid_amount,
              due_date: new Date(), // Use current date as fallback
              status: "upcoming" as const,
              payment_method: undefined,
              transaction_id: undefined,
            }));

          setRemainingPayments(remainingFromBookings);
          console.log(
            "BookingHistory - Using remaining payments from bookings:",
            remainingFromBookings,
          );
        } else {
          // Get vehicle names and payment details for each remaining payment
          const remainingPaymentsWithDetails = await Promise.all(
            data.map(async (payment) => {
              let vehicleName = "Unknown Vehicle";
              let paymentDetails = null;

              if (payment.booking_id) {
                // Get vehicle name from bookings
                const { data: bookingData } = await supabase
                  .from("bookings")
                  .select("vehicle_name")
                  .eq("id", payment.booking_id)
                  .single();

                if (bookingData?.vehicle_name) {
                  vehicleName = bookingData.vehicle_name;
                }

                // Get payment details if payment_id exists
                if (payment.payment_id) {
                  const { data: paymentData } = await supabase
                    .from("payments")
                    .select(
                      "id, status, payment_method, transaction_id, paid_amount",
                    )
                    .eq("id", payment.payment_id)
                    .single();

                  if (paymentData) {
                    paymentDetails = paymentData;
                  }
                }
              }

              return {
                id: payment.id,
                booking_id: payment.booking_id || "",
                vehicle_name: vehicleName,
                amount: payment.remaining_amount || payment.total_amount || 0,
                paid_amount: paymentDetails?.paid_amount || payment.paid_amount,
                due_date: new Date(payment.created_at), // Use created_at as fallback for due_date
                status:
                  paymentDetails?.status === "overdue" ? "overdue" : "upcoming",
                payment_method: paymentDetails?.payment_method,
                transaction_id: paymentDetails?.transaction_id,
              };
            }),
          );

          console.log(
            "BookingHistory - Remaining payments with details:",
            remainingPaymentsWithDetails,
          );
          setRemainingPayments(remainingPaymentsWithDetails);
        }
      } catch (error) {
        console.error(
          "BookingHistory - Error fetching remaining payments:",
          error,
        );
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

  // Format date safely using dayjs for consistency with WIB timezone
  const formatDate = (date: any, formatStr: string): string => {
    try {
      const parsed = dayjs(date).tz("Asia/Jakarta");

      if (!parsed.isValid()) return "Invalid date";

      if (formatStr === "PPP") return parsed.format("DD/MM/YYYY");
      if (formatStr === "dd MMM yyyy") return parsed.format("DD MMM YYYY");
      if (formatStr === "yyyy-MM-dd") return parsed.format("YYYY-MM-DD");
      if (formatStr === "dd MMM yyyy, HH:mm")
        return parsed.format("DD MMM YYYY, HH:mm");

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
      case "paid":
        return "default";
      default:
        return "default";
    }
  };

  // Helper function to check if booking is fully paid
  const isBookingFullyPaid = (booking: Booking): boolean => {
    const paidAmount = booking.paid_amount || 0;
    return paidAmount >= booking.total_amount;
  };

  // Helper function to get payment status display
  const getPaymentStatusDisplay = (booking: Booking): string => {
    const remainingAmount = getRemainingPayment(booking);
    if (remainingAmount === 0) {
      return "Sudah Dibayar";
    }
    const paidAmount = booking.paid_amount || 0;
    if (paidAmount > 0) {
      return "Sebagian";
    }
    return "Belum Bayar";
  };

  // Helper function to get remaining payment amount
  const getRemainingPayment = (booking: Booking): number => {
    const totalAmount = booking.total_amount || 0;
    const paidAmount = booking.paid_amount || 0;
    const remainingAmount = Math.max(0, totalAmount - paidAmount);
    return remainingAmount;
  };

  // Helper function to check if booking can be paid
  const canBookingBePaid = (booking: Booking): boolean => {
    return getRemainingPayment(booking) > 0;
  };

  // Handle cancel booking with confirmation dialog
  const handleCancelBooking = async (bookingId: string) => {
    if (!cancellationReason.trim()) {
      alert("Silakan isi keterangan pembatalan");
      return;
    }

    try {
      const { error } = await supabase
        .from("bookings")
        .update({
          status: "cancelled",
          notes_driver: cancellationReason.trim(),
        })
        .eq("id", bookingId);

      if (error) {
        alert("Gagal membatalkan pemesanan: " + error.message);
      } else {
        alert("Pemesanan berhasil dibatalkan");
        // Update the booking status in the UI
        setMockBookings((prevBookings) =>
          prevBookings.map((b) =>
            b.id === bookingId
              ? {
                  ...b,
                  status: "cancelled",
                  notes_driver: cancellationReason.trim(),
                }
              : b,
          ),
        );
        // Close dialog and reset form
        setCancelDialogOpen(null);
        setCancellationReason("");
      }
    } catch (error) {
      console.error("Error cancelling booking:", error);
      alert("Terjadi kesalahan saat membatalkan pemesanan");
    }
  };

  // Helper function to get payment status badge variant
  const getPaymentStatusBadgeVariant = (booking: Booking) => {
    const remainingAmount = getRemainingPayment(booking);
    if (remainingAmount === 0) {
      return "default"; // Green for fully paid
    }
    const paidAmount = booking.paid_amount || 0;
    if (paidAmount > 0) {
      return "secondary"; // Blue for partial payment
    }
    return "destructive"; // Red for unpaid
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
          </div>
          <Card className="w-full border border-blue-500">
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
                              <TableHead>Booking Status</TableHead>
                              <TableHead>Total Harga</TableHead>
                              <TableHead>Pembayaran</TableHead>
                              <TableHead>Sisa Pembayaran</TableHead>
                              <TableHead>Status Pembayaran</TableHead>
                              <TableHead>Aksi</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredBookings.map((booking) => [
                              <TableRow key={booking.id}>
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
                                  Rp{" "}
                                  {(booking.paid_amount || 0).toLocaleString()}
                                </TableCell>
                                <TableCell>
                                  Rp{" "}
                                  {getRemainingPayment(
                                    booking,
                                  ).toLocaleString()}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant={getPaymentStatusBadgeVariant(
                                      booking,
                                    )}
                                  >
                                    {getPaymentStatusDisplay(booking)}
                                  </Badge>
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
                              </TableRow>,
                              expandedBooking === booking.id && (
                                <TableRow key={`${booking.id}-details`}>
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
                                                  Jam: {endDate.format("HH:mm")}
                                                </p>
                                              </div>
                                            );
                                          })()}
                                        </div>
                                        <div>
                                          <p className="text-sm text-muted-foreground">
                                            ID Pemesanan
                                          </p>
                                          <p>{booking.code_booking}</p>
                                        </div>
                                        <div>
                                          <p className="text-sm text-muted-foreground">
                                            Keterangan Pembatalan
                                          </p>
                                          <p>
                                            {booking.notes_driver ||
                                              "Tidak ada pembatalan"}
                                          </p>
                                        </div>
                                        <div>
                                          <p className="text-sm text-muted-foreground">
                                            Tanggal Pemesanan Dibuat
                                          </p>
                                          <p>
                                            {booking?.created_at ||
                                            booking?.created_at_tz
                                              ? formatDate(
                                                  booking.created_at_tz ||
                                                    booking.created_at,
                                                  "dd MMM yyyy, HH:mm",
                                                )
                                              : "-"}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="mt-4 flex gap-2">
                                        {(booking.status === "pending" ||
                                          booking.status === "approved") && (
                                          <Dialog
                                            open={
                                              cancelDialogOpen === booking.id
                                            }
                                            onOpenChange={(open) => {
                                              if (open) {
                                                setCancelDialogOpen(booking.id);
                                                setCancellationReason("");
                                              } else {
                                                setCancelDialogOpen(null);
                                                setCancellationReason("");
                                              }
                                            }}
                                          >
                                            <DialogTrigger asChild>
                                              <Button
                                                variant="outline"
                                                size="sm"
                                              >
                                                Batalkan Pemesanan
                                              </Button>
                                            </DialogTrigger>
                                            <DialogContent className="sm:max-w-[425px]">
                                              <DialogHeader>
                                                <DialogTitle>
                                                  Batalkan Pemesanan
                                                </DialogTitle>
                                                <DialogDescription>
                                                  Apakah Anda yakin ingin
                                                  membatalkan pemesanan ini?
                                                </DialogDescription>
                                              </DialogHeader>
                                              <div className="grid gap-4 py-4">
                                                <div className="grid gap-2">
                                                  <label
                                                    htmlFor="cancellation-reason"
                                                    className="text-sm font-medium"
                                                  >
                                                    Keterangan Pembatalan *
                                                  </label>
                                                  <Textarea
                                                    id="cancellation-reason"
                                                    placeholder="Masukkan alasan pembatalan..."
                                                    value={cancellationReason}
                                                    onChange={(e) =>
                                                      setCancellationReason(
                                                        e.target.value,
                                                      )
                                                    }
                                                    className="min-h-[100px]"
                                                  />
                                                </div>
                                              </div>
                                              <DialogFooter>
                                                <Button
                                                  variant="outline"
                                                  onClick={() => {
                                                    setCancelDialogOpen(null);
                                                    setCancellationReason("");
                                                  }}
                                                >
                                                  Batal
                                                </Button>
                                                {cancellationReason.trim() && (
                                                  <Button
                                                    variant="destructive"
                                                    onClick={() =>
                                                      handleCancelBooking(
                                                        booking.id,
                                                      )
                                                    }
                                                  >
                                                    Batalkan Pesanan
                                                  </Button>
                                                )}
                                              </DialogFooter>
                                            </DialogContent>
                                          </Dialog>
                                        )}
                                        {booking.status !== "cancelled" && (
                                          <>
                                            {canBookingBePaid(booking) && (
                                              <Button
                                                size="sm"
                                                onClick={() =>
                                                  navigate(
                                                    `/payment/${booking.id}`,
                                                  )
                                                }
                                              >
                                                Bayar
                                              </Button>
                                            )}
                                            <Button size="sm" variant="outline">
                                              Hubungi Dukungan
                                            </Button>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ),
                            ])}
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
                                    Total Harga
                                  </p>
                                  <p>
                                    Rp {booking.total_amount.toLocaleString()}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">
                                    Pembayaran
                                  </p>
                                  <p>
                                    Rp{" "}
                                    {(
                                      booking.paid_amount || 0
                                    ).toLocaleString()}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">
                                    Sisa Pembayaran
                                  </p>
                                  <p>
                                    Rp{" "}
                                    {getRemainingPayment(
                                      booking,
                                    ).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                              <div className="mb-3">
                                <p className="text-muted-foreground text-sm">
                                  Status Pembayaran
                                </p>
                                <Badge
                                  variant={getPaymentStatusBadgeVariant(
                                    booking,
                                  )}
                                  className="mt-1"
                                >
                                  {getPaymentStatusDisplay(booking)}
                                </Badge>
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
                                      <p className="text-sm text-muted-foreground">
                                        Model Kendaraan
                                      </p>
                                      <p> {booking.vehicle_name}</p>
                                      <p>{booking.license_plate}</p>
                                    </div>
                                    <div>
                                      <p className="text-muted-foreground">
                                        Metode Pembayaran
                                      </p>
                                      <p>{booking.payment_method}</p>
                                    </div>
                                    <div>
                                      <p className="text-muted-foreground">
                                        Waktu Selesai
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
                                  <div className="flex gap-2 mt-3">
                                    {(booking.status === "pending" ||
                                      booking.status === "approved") && (
                                      <Dialog
                                        open={cancelDialogOpen === booking.id}
                                        onOpenChange={(open) => {
                                          if (open) {
                                            setCancelDialogOpen(booking.id);
                                            setCancellationReason("");
                                          } else {
                                            setCancelDialogOpen(null);
                                            setCancellationReason("");
                                          }
                                        }}
                                      >
                                        <DialogTrigger asChild>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex-1"
                                          >
                                            Batalkan
                                          </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-[425px]">
                                          <DialogHeader>
                                            <DialogTitle>
                                              Batalkan Pemesanan
                                            </DialogTitle>
                                            <DialogDescription>
                                              Apakah Anda yakin ingin
                                              membatalkan pemesanan ini?
                                            </DialogDescription>
                                          </DialogHeader>
                                          <div className="grid gap-4 py-4">
                                            <div className="grid gap-2">
                                              <label
                                                htmlFor="cancellation-reason-mobile"
                                                className="text-sm font-medium"
                                              >
                                                Keterangan Pembatalan *
                                              </label>
                                              <Textarea
                                                id="cancellation-reason-mobile"
                                                placeholder="Masukkan alasan pembatalan..."
                                                value={cancellationReason}
                                                onChange={(e) =>
                                                  setCancellationReason(
                                                    e.target.value,
                                                  )
                                                }
                                                className="min-h-[100px]"
                                              />
                                            </div>
                                          </div>
                                          <DialogFooter>
                                            <Button
                                              variant="outline"
                                              onClick={() => {
                                                setCancelDialogOpen(null);
                                                setCancellationReason("");
                                              }}
                                            >
                                              Batal
                                            </Button>
                                            {cancellationReason.trim() && (
                                              <Button
                                                variant="destructive"
                                                onClick={() =>
                                                  handleCancelBooking(
                                                    booking.id,
                                                  )
                                                }
                                              >
                                                Batalkan Pesanan
                                              </Button>
                                            )}
                                          </DialogFooter>
                                        </DialogContent>
                                      </Dialog>
                                    )}
                                    {booking.status !== "cancelled" && (
                                      <>
                                        {canBookingBePaid(booking) && (
                                          <Button
                                            size="sm"
                                            className="flex-1"
                                            onClick={() =>
                                              navigate(`/payment/${booking.id}`)
                                            }
                                          >
                                            Bayar
                                          </Button>
                                        )}
                                        <Button
                                          size="sm"
                                          className="flex-1"
                                          variant="outline"
                                        >
                                          Hubungi Dukungan
                                        </Button>
                                      </>
                                    )}
                                  </div>
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
                                  Rp{" "}
                                  {userSaldo != null
                                    ? userSaldo.toLocaleString("id-ID")
                                    : "0"}
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
