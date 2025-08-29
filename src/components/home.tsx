import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getTranslation, formatCurrency } from "@/lib/language";
import { useLanguage } from "@/lib/languageContext";
import LanguageSelector, {
  Language,
} from "@/components/common/LanguageSelector";
import { useToast } from "@/components/ui/use-toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  LogOut,
  Car,
  Clock,
  CreditCard,
  User,
  Bell,
  DollarSign,
  CalendarIcon,
  Plane,
  RefreshCw,
  Wifi,
  WifiOff,
} from "lucide-react";
import AuthForms from "./auth/AuthForms";
import VehicleBooking from "./booking/VehicleBooking";
import VehicleGroupListing from "./booking/VehicleGroupListing";
import BookingHistory from "./dashboard/BookingHistory";
import PaymentTracking from "./payments/PaymentTracking";
import DriverNotifications from "./dashboard/DriverNotifications";
import ProfilePage from "./profile/ProfilePage";
import { Toaster } from "@/components/ui/toaster";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const Home = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("booking");
  const { language, setLanguage } = useLanguage();
  const [showNotifications, setShowNotifications] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [totalPaid, setTotalPaid] = useState(0);
  const [totalPending, setTotalPending] = useState(0);
  const [overduePayments, setOverduePayments] = useState(0);
  const [overdueAmount, setOverdueAmount] = useState(0);
  const [overdueDays, setOverdueDays] = useState(0);
  const [hasUnpaidBookings, setHasUnpaidBookings] = useState(false);
  const [currentVehicle, setCurrentVehicle] = useState(null);
  const [driverSaldo, setDriverSaldo] = useState(0);
  const [isOnline, setIsOnline] = useState(false);
  const [locationInterval, setLocationInterval] =
    useState<NodeJS.Timeout | null>(null);
  const [topupForm, setTopupForm] = useState({
    amount: "",
    sender_bank: "",
    sender_account: "",
    sender_name: "",
    destination_account: "",
    proof_url: null,
  });
  const [isSubmittingTopup, setIsSubmittingTopup] = useState(false);
  const [topupSuccess, setTopupSuccess] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [isTopupProcessing, setIsTopupProcessing] = useState(false);
  const [currentTopupId, setCurrentTopupId] = useState(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (data?.session?.user) {
          const sessionUserId = data.session.user.id;
          const sessionUserEmail = data.session.user.email;

          console.log("🔍 Home - Session user ID:", sessionUserId);
          console.log("🔍 Home - Session user email:", sessionUserEmail);

          // Try to get driver data first by ID
          let { data: driverData, error: driverError } = await supabase
            .from("drivers")
            .select("*")
            .eq("id", sessionUserId)
            .maybeSingle();

          console.log("🔍 Home - Initial driver data fetch by ID:", driverData);
          console.log("❗ Home - Initial driver error:", driverError);

          // If no driver found by ID, try by email
          if (!driverData && sessionUserEmail) {
            const { data: driverByEmail, error: driverByEmailError } =
              await supabase
                .from("drivers")
                .select("*")
                .eq("email", sessionUserEmail)
                .maybeSingle();

            console.log("🔍 Home - Driver data fetch by email:", driverByEmail);
            console.log("❗ Home - Driver by email error:", driverByEmailError);

            if (driverByEmail) {
              driverData = driverByEmail;
            }
          }

          if (driverData) {
            const saldoValue = Number(driverData.saldo) || 0;
            setUser(driverData);
            setDriverSaldo(saldoValue);
            setIsOnline(driverData.is_online || false);
            console.log(
              "✅ Home - Using driver data, saldo:",
              saldoValue,
              "(raw:",
              driverData.saldo,
              ")",
            );

            // Use the driver's actual ID for fetching stats
            fetchPaymentStats(driverData.id);
            fetchCurrentVehicle(driverData.id);
          } else {
            // Fallback to users table by ID
            let { data: userData, error: userError } = await supabase
              .from("users")
              .select("*")
              .eq("id", sessionUserId)
              .maybeSingle();

            console.log("🔍 Home - Fallback user data by ID:", userData);
            console.log("❗ Home - User error:", userError);

            // If no user found by ID, try by email
            if (!userData && sessionUserEmail) {
              const { data: userByEmail, error: userByEmailError } =
                await supabase
                  .from("users")
                  .select("*")
                  .eq("email", sessionUserEmail)
                  .maybeSingle();

              console.log("🔍 Home - User data fetch by email:", userByEmail);
              console.log("❗ Home - User by email error:", userByEmailError);

              if (userByEmail) {
                userData = userByEmail;
              }
            }

            if (userData) {
              const saldoValue = Number(userData.saldo) || 0;
              setUser(userData);
              setDriverSaldo(saldoValue);
              setIsOnline(false); // Default to offline for users table
              console.log(
                "✅ Home - Using user data, saldo:",
                saldoValue,
                "(raw:",
                userData.saldo,
                ")",
              );

              // Use the user's actual ID for fetching stats
              fetchPaymentStats(userData.id);
              fetchCurrentVehicle(userData.id);
            } else {
              console.error("No user found in either drivers or users table");
              setLoading(false);
              return;
            }
          }
        }
      } catch (error) {
        console.error("Error checking authentication:", error);
      } finally {
        setLoading(false);
      }
    };

    checkUser();
    fetchPaymentMethods();

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    const urlParams = new URLSearchParams(window.location.search);
    const modelParam = urlParams.get("model");
    if (modelParam) {
      setActiveTab("booking");
      console.log("Model selected from URL:", modelParam);
    }

    const handleModelSelected = (event) => {
      console.log("Model selected event received:", event.detail);
      setActiveTab("booking");
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("modelSelected", handleModelSelected);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("modelSelected", handleModelSelected);

      // Clean up location tracking on component unmount
      if (locationInterval) {
        clearInterval(locationInterval);
      }
    };
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      const { data, error } = await supabase
        .from("payment_methods")
        .select("*")
        .eq("type", "manual")
        .eq("is_active", true);

      if (error) {
        console.error("Error fetching payment methods:", error);
        return;
      }

      setPaymentMethods(data || []);
    } catch (error) {
      console.error("Error fetching payment methods:", error);
    }
  };

  const fetchCurrentVehicle = async (userId) => {
    try {
      const { data: bookingData, error: bookingError } = await supabase
        .from("bookings")
        .select("*, vehicles(*)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1);

      if (bookingData && bookingData.length > 0 && bookingData[0].vehicles) {
        setCurrentVehicle(bookingData[0].vehicles);
        console.log("Current vehicle fetched:", bookingData[0].vehicles);
      } else {
        const { data: vehicleData, error: vehicleError } = await supabase
          .from("vehicles")
          .select("*")
          .limit(1);

        if (vehicleData && vehicleData.length > 0) {
          setCurrentVehicle(vehicleData[0]);
          console.log("Fallback vehicle fetched:", vehicleData[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching current vehicle:", error);
    }
  };

  const handleTopupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingTopup(true);

    try {
      // Get current user session
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();
      if (sessionError) throw sessionError;

      if (!sessionData?.session?.user?.id) {
        throw new Error("User not authenticated");
      }

      // Generate reference number in format TD-YYYYMMDD-HHMMSS-RAND
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, ""); // YYYYMMDD
      const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, ""); // HHMMSS
      const randomNum = Math.floor(1000 + Math.random() * 9000); // 4 digit random number
      const referenceNo = `TD-${dateStr}-${timeStr}-${randomNum}`;

      // Upload proof file if provided
      let proofUrl: string | null = null;
      if (topupForm.proof_url) {
        const fileExt = topupForm.proof_url.name.split(".").pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `topup-proofs/${sessionData.session.user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("transfer-proofs")
          .upload(filePath, topupForm.proof_url);

        if (uploadError) {
          console.error("Upload error:", uploadError);
        } else {
          const {
            data: { publicUrl },
          } = supabase.storage.from("transfer-proofs").getPublicUrl(filePath);
          proofUrl = publicUrl;
        }
      }

      // Determine the receiving bank name based on destination account
      let receivingBankName = "";
      if (topupForm.destination_account === "1640006707220") {
        receivingBankName = "Mandiri";
      } else if (topupForm.destination_account === "5440542222") {
        receivingBankName = "BCA";
      }

      // Determine user role for request_by_role field
      let userRole = "user"; // Default fallback

      // Try to get role from drivers table first
      const { data: driverRole, error: driverRoleError } = await supabase
        .from("drivers")
        .select("role_name")
        .eq("id", sessionData.session.user.id)
        .maybeSingle();

      if (driverRole && driverRole.role_name) {
        userRole = driverRole.role_name;
      } else {
        // Fallback to users table
        const { data: userRoleData, error: userRoleError } = await supabase
          .from("users")
          .select("role")
          .eq("id", sessionData.session.user.id)
          .maybeSingle();

        if (userRoleData && userRoleData.role) {
          userRole = userRoleData.role;
        }
      }

      console.log(
        "🚀 Inserting topup request for user:",
        sessionData.session.user.id,
        "with role:",
        userRole,
      );

      // Insert topup request into database
      const { data, error } = await supabase
        .from("topup_requests")
        .insert({
          user_id: sessionData.session.user.id,
          amount: parseFloat(topupForm.amount),
          bank_name: receivingBankName,
          sender_bank: topupForm.sender_bank,
          sender_account: topupForm.sender_account,
          sender_name: topupForm.sender_name,
          destination_account: topupForm.destination_account,
          proof_url: proofUrl,
          reference_no: referenceNo,
          method: "bank_transfer",
          status: "pending",
          request_by_role: userRole,
        })
        .select()
        .single();

      if (error) {
        console.error("Database error:", error);
        throw error;
      }

      console.log("Topup request created:", data);
      console.log("Generated reference number:", referenceNo);

      // Set processing state and store topup ID
      setIsTopupProcessing(true);
      setCurrentTopupId(data.id);

      toast({
        title: "Permintaan Top-up Berhasil Dikirim",
        description: "Mohon menunggu request Topup Sedang di proses",
        duration: 0,
        className: "bg-green-50 border-green-200",
      });

      setTopupSuccess(true);
      setTopupForm({
        amount: "",
        sender_bank: "",
        sender_account: "",
        sender_name: "",
        destination_account: "",
        proof_url: null,
      });

      // Start monitoring topup status
      monitorTopupStatus(data.id);

      // Hide success message after 5 seconds
      setTimeout(() => {
        setTopupSuccess(false);
      }, 5000);
    } catch (error) {
      console.error("Error submitting topup request:", error);
      alert("Gagal mengirim permintaan top-up. Silakan coba lagi.");
    } finally {
      setIsSubmittingTopup(false);
    }
  };

  const monitorTopupStatus = async (topupId) => {
    const checkStatus = async () => {
      try {
        const { data, error } = await supabase
          .from("topup_requests")
          .select("status")
          .eq("id", topupId)
          .single();

        if (error) {
          console.error("Error checking topup status:", error);
          return;
        }

        if (
          data &&
          (data.status === "verified" || data.status === "rejected")
        ) {
          // Status changed, re-enable form and hide notification
          setIsTopupProcessing(false);
          setCurrentTopupId(null);

          // Show final status toast
          toast({
            title:
              data.status === "verified"
                ? "Top-up Disetujui"
                : "Top-up Ditolak",
            description:
              data.status === "verified"
                ? "Permintaan top-up Anda telah disetujui dan saldo akan segera ditambahkan."
                : "Permintaan top-up Anda ditolak. Silakan hubungi admin untuk informasi lebih lanjut.",
            duration: 5000,
            className:
              data.status === "verified"
                ? "bg-green-50 border-green-200"
                : "bg-red-50 border-red-200",
          });

          // Refresh payment stats to update saldo
          if (user?.id) {
            fetchPaymentStats(user.id);
          }

          return true; // Status changed
        }
        return false; // Status unchanged
      } catch (error) {
        console.error("Error monitoring topup status:", error);
        return false;
      }
    };

    // Check status every 5 seconds
    const interval = setInterval(async () => {
      const statusChanged = await checkStatus();
      if (statusChanged) {
        clearInterval(interval);
      }
    }, 5000);

    // Also check immediately
    const statusChanged = await checkStatus();
    if (statusChanged) {
      clearInterval(interval);
    }

    // Clean up interval after 30 minutes to prevent infinite polling
    setTimeout(
      () => {
        clearInterval(interval);
        if (isTopupProcessing) {
          setIsTopupProcessing(false);
          setCurrentTopupId(null);
          toast({
            title: "Timeout",
            description:
              "Monitoring top-up status dihentikan. Silakan refresh halaman untuk memeriksa status terbaru.",
            duration: 5000,
            className: "bg-yellow-50 border-yellow-200",
          });
        }
      },
      30 * 60 * 1000,
    ); // 30 minutes
  };

  const handleTopupInputChange = (
    field: string,
    value: string | File | null,
  ) => {
    setTopupForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    handleTopupInputChange("proof_url", file);
  };

  const fetchPaymentStats = async (userId) => {
    console.log("🚀 fetchPaymentStats - Starting for user:", userId);
    try {
      // Get the latest booking data with remaining_payments field
      const { data: bookingsData, error: bookingsError } = await supabase
        .from("bookings")
        .select(
          "*, remaining_payments, booking_date, end_date, start_date, total_amount, paid_amount",
        )
        .eq("user_id", userId);

      if (bookingsError) {
        console.error("❌ fetchPaymentStats - Bookings error:", bookingsError);
        throw bookingsError;
      }

      // Get current session to verify user ID
      const { data: sessionData } = await supabase.auth.getSession();
      const currentUserId = sessionData?.session?.user?.id;
      const sessionUserEmail = sessionData?.session?.user?.email;
      console.log(
        "🔍 fetchPaymentStats - Current session user ID:",
        currentUserId,
      );
      console.log("🔍 fetchPaymentStats - Requested user ID:", userId);
      console.log("🔍 fetchPaymentStats - Session email:", sessionUserEmail);

      // Get driver saldo directly from drivers table with fresh data
      console.log(
        "🔍 fetchPaymentStats - Fetching from drivers table by ID:",
        userId,
      );
      let { data: driverData, error: driverError } = await supabase
        .from("drivers")
        .select("saldo, overdue_days, total_overdue, name, email, id")
        .eq("id", userId)
        .maybeSingle();

      console.log(
        "🔍 fetchPaymentStats - Driver data from drivers table by ID:",
        driverData,
      );
      console.log("❗ fetchPaymentStats - Driver error:", driverError);

      // If no driver found by ID, try by email
      if (!driverData && sessionUserEmail) {
        console.log(
          "🔍 fetchPaymentStats - Trying drivers table by email:",
          sessionUserEmail,
        );
        const { data: driverByEmail, error: driverByEmailError } =
          await supabase
            .from("drivers")
            .select("saldo, overdue_days, total_overdue, name, email, id")
            .eq("email", sessionUserEmail)
            .maybeSingle();

        console.log("🔍 fetchPaymentStats - Driver by email:", driverByEmail);
        console.log(
          "❗ fetchPaymentStats - Driver by email error:",
          driverByEmailError,
        );

        if (driverByEmail) {
          driverData = driverByEmail;
          // Update the user state with the correct driver data
          setUser(driverByEmail);
          console.log(
            "✅ fetchPaymentStats - Updated user state with driver data from email lookup",
          );
        }
      }

      // If no driver data, try users table by ID
      let fallbackUserData = null;
      if (!driverData) {
        console.log(
          "🔍 fetchPaymentStats - No driver found, trying users table by ID:",
          userId,
        );
        let { data: userData, error: userError } = await supabase
          .from("users")
          .select("saldo, full_name, email, id")
          .eq("id", userId)
          .maybeSingle();

        console.log(
          "🔍 fetchPaymentStats - Fallback user data from users table by ID:",
          userData,
        );
        console.log("❗ fetchPaymentStats - User error:", userError);

        // If no user found by ID, try by email
        if (!userData && sessionUserEmail) {
          console.log(
            "🔍 fetchPaymentStats - Trying users table by email:",
            sessionUserEmail,
          );
          const { data: userByEmail, error: userByEmailError } = await supabase
            .from("users")
            .select("saldo, full_name, email, id")
            .eq("email", sessionUserEmail)
            .maybeSingle();

          console.log("🔍 fetchPaymentStats - User by email:", userByEmail);
          console.log(
            "❗ fetchPaymentStats - User by email error:",
            userByEmailError,
          );

          if (userByEmail) {
            userData = userByEmail;
            setUser(userByEmail);
            console.log(
              "✅ fetchPaymentStats - Updated user state with user data from email lookup",
            );
          }
        }

        fallbackUserData = userData;
      }

      // Calculate total pending from remaining_payments in bookings
      let pending = 0;
      let overduePaymentsCount = 0;
      let totalOverdueAmount = 0;
      let maxOverdueDays = 0;
      const today = new Date();

      if (bookingsData && bookingsData.length > 0) {
        bookingsData.forEach((booking) => {
          // Calculate pending payments
          if (booking.remaining_payments && booking.remaining_payments > 0) {
            pending += booking.remaining_payments;
          }

          // Calculate overdue information
          if (booking.bookings_status === "completed" && booking.end_date) {
            const endDate = new Date(booking.end_date);
            if (endDate < today) {
              // Calculate days difference
              const diffTime = Math.abs(today.getTime() - endDate.getTime());
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

              if (diffDays > 1) {
                // More than 1 day overdue
                overduePaymentsCount++;
                const overdueAmount = diffDays * (booking.total_amount || 0);
                totalOverdueAmount += overdueAmount;
                maxOverdueDays = Math.max(maxOverdueDays, diffDays);
              }
            }
          } else if (
            booking.bookings_status !== "completed" &&
            booking.start_date
          ) {
            // For non-completed bookings, calculate days from start_date
            const startDate = new Date(booking.start_date);
            if (startDate <= today) {
              const diffTime = Math.abs(today.getTime() - startDate.getTime());
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

              const calculatedAmount =
                diffDays * (booking.total_amount || 0) -
                (booking.paid_amount || 0);
              if (calculatedAmount > 0) {
                overduePaymentsCount++;
                totalOverdueAmount += calculatedAmount;
                maxOverdueDays = Math.max(maxOverdueDays, diffDays);
              }
            }
          }
        });
      }

      // Get the driver saldo from the database - ensure fresh data
      let driverSaldoValue = 0;
      if (driverData) {
        const rawSaldo = driverData.saldo;
        driverSaldoValue = Number(rawSaldo) || 0;
        console.log(
          "✅ fetchPaymentStats - Driver saldo from drivers table (fresh):",
          driverSaldoValue,
          "(raw value:",
          rawSaldo,
          ", type:",
          typeof rawSaldo,
          ")",
        );
      } else if (fallbackUserData) {
        const rawSaldo = fallbackUserData.saldo;
        driverSaldoValue = Number(rawSaldo) || 0;
        console.log(
          "✅ fetchPaymentStats - Driver saldo from users table (fallback):",
          driverSaldoValue,
          "(raw value:",
          rawSaldo,
          ", type:",
          typeof rawSaldo,
          ")",
        );
      } else {
        console.log(
          "❌ fetchPaymentStats - No user found in either table, defaulting saldo to 0",
        );
        driverSaldoValue = 0;
      }

      console.log(
        "🎯 fetchPaymentStats - Final driverSaldoValue before setState:",
        driverSaldoValue,
      );

      // Set the values from the database
      // Check if there are any bookings, if not set all values to 0
      if (!bookingsData || bookingsData.length === 0) {
        setTotalPaid(0);
        setTotalPending(0);
        setOverduePayments(0);
        setOverdueAmount(0);
        setOverdueDays(0);
        setHasUnpaidBookings(false);
      } else {
        // If there are bookings, use calculated values
        const totalPaidAmount = bookingsData.reduce(
          (sum, booking) => sum + (booking.paid_amount || 0),
          0,
        );
        setTotalPaid(totalPaidAmount);
        setTotalPending(pending);
        setOverduePayments(overduePaymentsCount);
        setOverdueAmount(totalOverdueAmount);
        setOverdueDays(maxOverdueDays);
        setHasUnpaidBookings(pending > 0);
      }
      // Set the driver saldo state
      setDriverSaldo(driverSaldoValue);
      console.log(
        "🎯 fetchPaymentStats - setDriverSaldo called with:",
        driverSaldoValue,
      );

      // Calculate total paid amount from bookings data
      const totalPaidAmount =
        bookingsData && bookingsData.length > 0
          ? bookingsData.reduce(
              (sum, booking) => sum + (booking.paid_amount || 0),
              0,
            )
          : 0;

      console.log("📊 fetchPaymentStats - Payment stats summary:", {
        paid: totalPaidAmount,
        pending: pending,
        driverSaldo: driverSaldoValue,
        overdue: overduePaymentsCount,
        overdueTotal: totalOverdueAmount,
        maxOverdueDays: maxOverdueDays,
        unpaidBookings: pending > 0,
        timestamp: new Date().toISOString(),
      });

      // Force a re-render by updating the user state if we have driver data
      if (driverData && driverData.saldo !== undefined) {
        setUser((prevUser) => ({
          ...prevUser,
          ...driverData,
          saldo: driverSaldoValue,
        }));
        console.log(
          "🔄 fetchPaymentStats - Updated user state with fresh saldo:",
          driverSaldoValue,
        );
      }
    } catch (error) {
      console.error("Error fetching payment stats:", error);
      // Set all values to 0 in case of error
      setTotalPaid(0);
      setTotalPending(0);
      setDriverSaldo(0);
      setOverduePayments(0);
      setOverdueAmount(0);
      setOverdueDays(0);
      setHasUnpaidBookings(false);
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const sendLocationUpdate = async (status: "online" | "offline") => {
    if (!user?.id) return;

    try {
      // Get current location
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          if (!navigator.geolocation) {
            reject(new Error("Geolocation is not supported"));
            return;
          }

          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000,
          });
        },
      );

      const { latitude, longitude } = position.coords;

      // Send location to API
      const response = await supabase.functions.invoke(
        "supabase-functions-update-driver-location",
        {
          body: {
            user_id: user.id,
            user_email: user.email,
            full_name: user.full_name || null,
            latitude,
            longitude,
            status,
          },
        },
      );

      if (response.error) {
        console.error("Error updating location:", response.error);
      } else {
        console.log("Location updated successfully:", response.data);
      }
    } catch (error) {
      console.error("Error getting location or updating:", error);
      // Don't show error to user for location updates, just log it
    }
  };

  const startLocationTracking = () => {
    // Send initial location update
    sendLocationUpdate("online");

    // Set up interval to send location every 10 seconds
    const interval = setInterval(() => {
      sendLocationUpdate("online");
    }, 10000);

    setLocationInterval(interval);
  };

  const stopLocationTracking = () => {
    // Clear the interval
    if (locationInterval) {
      clearInterval(locationInterval);
      setLocationInterval(null);
    }

    // Send final offline status
    sendLocationUpdate("offline");
  };

  const handleOnlineStatusChange = async (checked: boolean) => {
    try {
      setIsOnline(checked);

      // Update the is_online status in the drivers table
      const { error } = await supabase
        .from("drivers")
        .update({ is_online: checked })
        .eq("id", user?.id);

      if (error) {
        console.error("Error updating online status:", error);
        // Revert the state if update failed
        setIsOnline(!checked);
        return;
      }

      console.log("Online status updated successfully:", checked);

      // Handle location tracking based on online status
      if (checked) {
        startLocationTracking();
      } else {
        stopLocationTracking();
      }
    } catch (error) {
      console.error("Error updating online status:", error);
      // Revert the state if update failed
      setIsOnline(!checked);
    }
  };

  const tabs = [
    { value: "booking", label: "Book Vehicle" },
    { value: "topup", label: "Topup" },
    { value: "history", label: "Booking History" },
    { value: "payments", label: "Payments" },
    { value: "profile", label: "Profile" },
    { value: "notifications", label: "Notifications" },
    { value: "dashboard", label: "Dashboard Overview" },
    { value: "overdue", label: "Detail Jatuh Tempo" },
  ];

  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  useEffect(() => {
    const index = tabs.findIndex((tab) => tab.value === activeTab);
    if (index !== -1 && tabRefs.current[index]) {
      tabRefs.current[index]?.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [activeTab]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    console.log("No user found, showing auth forms");
    return <AuthForms onAuthenticated={setUser} />;
  }

  return (
    <div className="flex h-screen bg-background">
      {!isMobile && (
        <div className="w-64 border-r bg-card p-4">
          <div className="mb-8 flex items-center space-x-2">
            <Car className="h-8 w-8 text-primary" />
            <h1 className="text-xl font-bold">
              {getTranslation("dashboard", language)}
            </h1>
          </div>

          <div className="mb-8">
            <div className="flex items-center space-x-3 rounded-lg bg-muted p-3">
              <Avatar>
                <AvatarImage
                  src={
                    user?.selfie_url ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`
                  }
                />
                <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>

            {/* Online/Offline Toggle */}
            <div className="mt-4 flex items-center justify-between rounded-lg bg-card border p-3">
              <div className="flex items-center space-x-2">
                {isOnline ? (
                  <Wifi className="h-4 w-4 text-green-500" />
                ) : (
                  <WifiOff className="h-4 w-4 text-gray-500" />
                )}
                <span className="text-sm font-medium">
                  {isOnline ? "Online" : "Offline"}
                </span>
              </div>
              <Switch
                checked={isOnline}
                onCheckedChange={handleOnlineStatusChange}
              />
            </div>
          </div>

          <nav className="space-y-2">
            <Button
              variant={activeTab === "booking" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("booking")}
            >
              <Car className="mr-2 h-4 w-4" />
              {getTranslation("bookVehicle", language)}
            </Button>
            <Button
              variant={activeTab === "topup" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("topup")}
            >
              <DollarSign className="mr-2 h-4 w-4" />
              Topup
            </Button>
            <Button
              variant={activeTab === "history" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("history")}
            >
              <Clock className="mr-2 h-4 w-4" />
              {getTranslation("bookingHistory", language)}
            </Button>
            <Button
              variant={activeTab === "payments" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("payments")}
            >
              <CreditCard className="mr-2 h-4 w-4" />
              {getTranslation("payments", language)}
            </Button>
            <Button
              variant={activeTab === "profile" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("profile")}
            >
              <User className="mr-2 h-4 w-4" />
              {getTranslation("profile", language)}
            </Button>
            <Button
              variant={activeTab === "notifications" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("notifications")}
            >
              <Bell className="mr-2 h-4 w-4" />
              {getTranslation("notifications", language)}
            </Button>
            <Button
              variant={activeTab === "dashboard" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("dashboard")}
            >
              <DollarSign className="mr-2 h-4 w-4" />
              Dashboard Overview
            </Button>
            <Button
              variant={activeTab === "overdue" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("overdue")}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              Detail Jatuh Tempo
            </Button>
            <Button
              variant={activeTab === "airport" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("airport")}
            >
              <Plane className="mr-2 h-4 w-4" />
              Airport Transfer
            </Button>
          </nav>

          <div className="pt-4 border-t">
            <Button
              variant="outline"
              className="w-full justify-start text-destructive"
              onClick={handleSignOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto p-4 md:p-6 pt-16 pb-20 md:pt-4 md:pb-4">
        <div className="absolute top-4 right-4 z-10">
          <LanguageSelector
            currentLanguage={language}
            onLanguageChange={setLanguage}
            variant="icon"
          />
        </div>
        <div className="mx-auto w-full max-w-[420px] md:max-w-6xl px-4">
          <div className="w-full">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              defaultValue="booking"
              className="w-full"
            >
              {/* Tab Panels */}
              <div className="flex flex-col gap-2">
                <TabsContent
                  value="dashboard"
                  className="relative z-0 bg-white min-h-[240px]"
                >
                  <div className="flex flex-col gap-4 mb-8 mt-12 border p-4 rounded-lg bg-card shadow-sm md:grid md:grid-cols-3">
                    <h2 className="text-xl font-bold md:col-span-3 mb-2">
                      Dashboard Overview
                    </h2>

                    <Card
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => navigate("/payments")}
                    >
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

                    <Card
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => navigate("/payments")}
                    >
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

                    <Card
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => navigate("/booking-history")}
                    >
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Jatuh Tempo
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center">
                          <CalendarIcon className="mr-2 h-4 w-4 text-blue-500" />
                          <span className="text-2xl font-bold">
                            {overduePayments} Pembayaran
                          </span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => navigate("/profile")}
                    >
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Saldo Driver
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center">
                          <DollarSign className="mr-2 h-4 w-4 text-green-500" />
                          <span className="text-2xl font-bold text-red-500">
                            Rp{" "}
                            {(() => {
                              const saldoValue =
                                typeof driverSaldo === "number"
                                  ? driverSaldo
                                  : 0;
                              console.log(
                                "🎯 Dashboard - Rendering saldo:",
                                saldoValue,
                                "(type:",
                                typeof driverSaldo,
                                ")",
                              );
                              return saldoValue.toLocaleString();
                            })()}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent
                  value="overdue"
                  className="relative z-0 bg-white min-h-[240px]"
                >
                  <div className="flex flex-col gap-4 mb-8 border p-4 rounded-lg bg-card shadow-sm md:grid md:grid-cols-2">
                    <h2 className="text-xl font-bold md:col-span-2 mb-2">
                      Detail Jatuh Tempo
                    </h2>

                    <Card
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => navigate("/payments")}
                    >
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Total Jatuh Tempo
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center">
                          <DollarSign className="mr-2 h-4 w-4 text-red-500" />
                          <span className="text-2xl font-bold">
                            Rp {overdueAmount.toLocaleString()}
                          </span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => navigate("/payments")}
                    >
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Lama Jatuh Tempo
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center">
                          <Clock className="mr-2 h-4 w-4 text-red-500" />
                          <span className="text-2xl font-bold">
                            {overdueDays} Hari
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                <TabsContent
                  value="booking"
                  className="relative z-1 bg-white min-h-[240px]"
                >
                  {user?.id && (
                    <VehicleBooking
                      userId={user.id}
                      driverSaldo={driverSaldo}
                    />
                  )}
                </TabsContent>

                <TabsContent
                  value="topup"
                  className="relative z-0 bg-white min-h-[240px]"
                >
                  <div className="max-w-2xl mx-auto p-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <DollarSign className="h-6 w-6 text-primary" />
                          Permintaan Top-up
                        </CardTitle>
                        <CardDescription>
                          Isi formulir di bawah untuk mengajukan top-up saldo
                          melalui transfer bank.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {/* Current Balance Display */}
                        <div className="bg-muted p-4 rounded-lg mb-6">
                          <p className="text-sm font-medium text-muted-foreground">
                            Saldo Saat Ini:
                          </p>
                          <p className="text-2xl font-bold text-primary">
                            Rp {driverSaldo.toLocaleString()}
                          </p>
                        </div>

                        {/* Success Message */}
                        {topupSuccess && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                            <div className="flex items-center">
                              <div className="flex-shrink-0">
                                <svg
                                  className="h-5 w-5 text-green-400"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </div>
                              <div className="ml-3">
                                <h3 className="text-sm font-medium text-green-800">
                                  Permintaan Top-up Berhasil Dikirim
                                </h3>
                                <p className="mt-1 text-sm text-green-700">
                                  Permintaan top-up Anda telah berhasil dikirim
                                  Mohon menunggu request Topup Sedang di proses.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Topup Form */}
                        <form
                          onSubmit={handleTopupSubmit}
                          className="space-y-6"
                        >
                          {/* Amount Field */}
                          <div className="space-y-2">
                            <Label htmlFor="amount">Jumlah Top-up *</Label>
                            <Input
                              id="amount"
                              type="number"
                              placeholder="Masukkan jumlah"
                              value={topupForm.amount}
                              onChange={(e) =>
                                handleTopupInputChange("amount", e.target.value)
                              }
                              required
                              min="10000"
                              step="1000"
                              disabled={isTopupProcessing}
                            />
                            <p className="text-xs text-muted-foreground">
                              Minimum top-up Rp 10.000
                            </p>
                          </div>

                          {/* Sender Bank */}
                          <div className="space-y-2">
                            <Label htmlFor="senderBank">Nama Bank *</Label>
                            <Select
                              value={topupForm.sender_bank}
                              onValueChange={(value) =>
                                handleTopupInputChange("sender_bank", value)
                              }
                              required
                              disabled={isTopupProcessing}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih Bank" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="BCA">BCA</SelectItem>
                                <SelectItem value="Mandiri">
                                  Bank Mandiri
                                </SelectItem>
                                <SelectItem value="BNI">BNI</SelectItem>
                                <SelectItem value="BRI">BRI</SelectItem>
                                <SelectItem value="CIMB Niaga">
                                  CIMB Niaga
                                </SelectItem>
                                <SelectItem value="Bank Danamon">
                                  Bank Danamon
                                </SelectItem>
                                <SelectItem value="Bank Permata">
                                  Bank Permata
                                </SelectItem>
                                <SelectItem value="OCBC NISP">
                                  OCBC NISP
                                </SelectItem>
                                <SelectItem value="Maybank">Maybank</SelectItem>
                                <SelectItem value="Lainnya">
                                  Bank Lainnya
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Sender Account Number */}
                          <div className="space-y-2">
                            <Label htmlFor="senderAccount">
                              Nomor Rekening *
                            </Label>
                            <Input
                              id="senderAccount"
                              type="text"
                              placeholder="Masukkan nomor rekening"
                              value={topupForm.sender_account}
                              onChange={(e) =>
                                handleTopupInputChange(
                                  "sender_account",
                                  e.target.value,
                                )
                              }
                              required
                              disabled={isTopupProcessing}
                            />
                          </div>

                          {/* Sender Name */}
                          <div className="space-y-2">
                            <Label htmlFor="senderName">
                              Nama Pemegang Rekening *
                            </Label>
                            <Input
                              id="senderName"
                              type="text"
                              placeholder="Masukkan nama pemegang rekening"
                              value={topupForm.sender_name}
                              onChange={(e) =>
                                handleTopupInputChange(
                                  "sender_name",
                                  e.target.value,
                                )
                              }
                              required
                              disabled={isTopupProcessing}
                            />
                          </div>

                          {/* Bank Penerima */}
                          <div className="space-y-3">
                            <Label>Bank Penerima *</Label>
                            <RadioGroup
                              value={topupForm.destination_account}
                              onValueChange={(value) =>
                                handleTopupInputChange(
                                  "destination_account",
                                  value,
                                )
                              }
                              className="space-y-3"
                              disabled={isTopupProcessing}
                            >
                              <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                                <RadioGroupItem
                                  value="1640006707220"
                                  id="mandiri"
                                />
                                <Label
                                  htmlFor="mandiri"
                                  className="flex-1 cursor-pointer font-normal"
                                >
                                  <div className="font-medium">Mandiri</div>
                                  <div className="text-sm text-muted-foreground">
                                    1640006707220 - PT Cahaya Sejati Teknologi
                                  </div>
                                </Label>
                              </div>
                              <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                                <RadioGroupItem value="5440542222" id="bca" />
                                <Label
                                  htmlFor="bca"
                                  className="flex-1 cursor-pointer font-normal"
                                >
                                  <div className="font-medium">BCA</div>
                                  <div className="text-sm text-muted-foreground">
                                    5440542222 - Travelin
                                  </div>
                                </Label>
                              </div>
                            </RadioGroup>
                          </div>

                          {/* Upload Proof of Transfer */}
                          <div className="space-y-2">
                            <Label htmlFor="proofFile">
                              Upload Bukti Transfer *
                            </Label>
                            <div className="space-y-2">
                              <Input
                                id="proofFile"
                                type="file"
                                accept="image/*,.pdf"
                                onChange={handleFileChange}
                                className="cursor-pointer"
                                disabled={isTopupProcessing}
                              />
                              <p className="text-xs text-muted-foreground">
                                {topupForm.proof_url
                                  ? `File dipilih: ${topupForm.proof_url.name}`
                                  : "Tidak ada file dipilih"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Format yang didukung: JPG, PNG, PDF (Maks. 5MB)
                              </p>
                            </div>
                          </div>

                          {/* Submit Button */}
                          <Button
                            type="submit"
                            className="w-full"
                            disabled={
                              isSubmittingTopup ||
                              isTopupProcessing ||
                              !topupForm.amount ||
                              !topupForm.sender_bank ||
                              !topupForm.sender_account ||
                              !topupForm.sender_name ||
                              !topupForm.destination_account ||
                              !topupForm.proof_url
                            }
                          >
                            {isSubmittingTopup ? (
                              <>
                                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
                                Mengirim...
                              </>
                            ) : isTopupProcessing ? (
                              <>
                                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
                                Sedang Diproses...
                              </>
                            ) : (
                              "Kirim Permintaan Top-up"
                            )}
                          </Button>
                        </form>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent
                  value="history"
                  className="relative z-0 bg-white min-h-[240px]"
                >
                  <BookingHistory userId={user?.id} />
                </TabsContent>

                <TabsContent
                  value="payments"
                  className="relative z-0 bg-white min-h-[240px]"
                >
                  <PaymentTracking
                    userId={user?.id}
                    driverSaldo={driverSaldo}
                  />
                </TabsContent>

                <TabsContent
                  value="notifications"
                  className="relative z-0 bg-white min-h-[240px]"
                >
                  <DriverNotifications historyMode={false} />
                </TabsContent>

                <TabsContent
                  value="airport"
                  className="relative z-0 bg-white min-h-[240px]"
                >
                  <div className="w-full bg-white border rounded-md shadow-sm">
                    <div className="flex items-center justify-between px-4 py-3 border-b">
                      <div className="flex items-center gap-2">
                        <Plane className="h-5 w-5 text-primary" />
                        <h2 className="text-lg font-semibold">
                          Airport Transfer History
                        </h2>
                      </div>
                      <Button
                        onClick={() => window.location.reload()} // atau panggil refetch function
                        size="sm"
                        variant="outline"
                        className="flex items-center gap-1"
                      >
                        <RefreshCw className="h-4 w-4" />
                        Refresh
                      </Button>
                    </div>
                    <div className="p-4">
                      <DriverNotifications historyMode={true} />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent
                  value="profile"
                  className="relative z-0 bg-white min-h-[240px]"
                >
                  <ProfilePage userId={user?.id} />
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </div>

      {isMobile && (
        <>
          <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between border-b bg-background p-4">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  <line x1="4" x2="20" y1="12" y2="12" />
                  <line x1="4" x2="20" y1="6" y2="6" />
                  <line x1="4" x2="20" y1="18" y2="18" />
                </svg>
              </Button>
              <h1 className="ml-2 text-lg font-bold">Portal Pengemudi</h1>
            </div>
            <div className="flex items-center">
              <LanguageSelector
                currentLanguage={language}
                onLanguageChange={setLanguage}
                variant="icon"
              />
            </div>
          </div>

          {showNotifications && (
            <div
              className="fixed inset-0 z-40 bg-black/50"
              onClick={() => setShowNotifications(false)}
            >
              <div
                className="fixed top-12 left-1 bottom-0 z-50 w-5/5 max-w-xs bg-background p-4 shadow-lg overflow-y-auto max-h-[60vh] rounded-r-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6 mt-6">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage
                        src={
                          user?.selfie_url ||
                          `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`
                        }
                      />
                      <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{user?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Mobile Online/Offline Toggle */}
                <div className="mb-4 flex items-center justify-between rounded-lg bg-card border p-3">
                  <div className="flex items-center space-x-2">
                    {isOnline ? (
                      <Wifi className="h-4 w-4 text-green-500" />
                    ) : (
                      <WifiOff className="h-4 w-4 text-gray-500" />
                    )}
                    <span className="text-sm font-medium">
                      {isOnline ? "Online" : "Offline"}
                    </span>
                  </div>
                  <Switch
                    checked={isOnline}
                    onCheckedChange={handleOnlineStatusChange}
                  />
                </div>

                <nav className="space-y-2">
                  <Button
                    variant={activeTab === "booking" ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => {
                      setActiveTab("booking");
                      setShowNotifications(false);
                    }}
                  >
                    <Car className="mr-2 h-4 w-4" />
                    Pesan Kendaraan
                  </Button>
                  <Button
                    variant={activeTab === "topup" ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => {
                      setActiveTab("topup");
                      setShowNotifications(false);
                    }}
                  >
                    <DollarSign className="mr-2 h-4 w-4" />
                    Topup
                  </Button>
                  <Button
                    variant={activeTab === "history" ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => {
                      setActiveTab("history");
                      setShowNotifications(false);
                    }}
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    Riwayat Pemesanan
                  </Button>
                  <Button
                    variant={activeTab === "payments" ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => {
                      setActiveTab("payments");
                      setShowNotifications(false);
                    }}
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Pembayaran
                  </Button>
                  <Button
                    variant={activeTab === "profile" ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => {
                      setActiveTab("profile");
                      setShowNotifications(false);
                    }}
                  >
                    <User className="mr-2 h-4 w-4" />
                    Profil
                  </Button>
                  <Button
                    variant={
                      activeTab === "notifications" ? "default" : "ghost"
                    }
                    className="w-full justify-start"
                    onClick={() => {
                      setActiveTab("notifications");
                      setShowNotifications(false);
                    }}
                  >
                    <Bell className="mr-2 h-4 w-4" />
                    Notifikasi
                  </Button>
                  <Button
                    variant={activeTab === "dashboard" ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => {
                      setActiveTab("dashboard");
                      setShowNotifications(false);
                    }}
                  >
                    <DollarSign className="mr-2 h-4 w-4" />
                    Dashboard Overview
                  </Button>
                  <Button
                    variant={activeTab === "overdue" ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => {
                      setActiveTab("overdue");
                      setShowNotifications(false);
                    }}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    Detail Jatuh Tempo
                  </Button>

                  <div className="pt-4 border-t">
                    <Button
                      variant="outline"
                      className="w-full justify-start text-destructive"
                      onClick={handleSignOut}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </Button>
                  </div>
                </nav>
              </div>
            </div>
          )}

          <div className="fixed bottom-0 left-0 right-0 border-t bg-background p-2">
            <div className="grid grid-cols-6 gap-1">
              <Button
                variant="ghost"
                className={`flex flex-col items-center justify-center rounded-md p-2 ${activeTab === "booking" ? "bg-muted" : ""}`}
                onClick={() => {
                  setActiveTab("booking");
                }}
              >
                <Car className="h-5 w-5" />
                <span className="mt-1 text-xs">Pesan</span>
              </Button>
              <Button
                variant="ghost"
                className={`flex flex-col items-center justify-center rounded-md p-2 ${activeTab === "topup" ? "bg-muted" : ""}`}
                onClick={() => {
                  setActiveTab("topup");
                }}
              >
                <DollarSign className="h-5 w-5" />
                <span className="mt-1 text-xs">Topup</span>
              </Button>
              <Button
                variant="ghost"
                className={`flex flex-col items-center justify-center rounded-md p-2 ${activeTab === "history" ? "bg-muted" : ""}`}
                onClick={() => {
                  setActiveTab("history");
                }}
              >
                <Clock className="h-5 w-5" />
                <span className="mt-1 text-xs">Riwayat</span>
              </Button>
              <Button
                variant="ghost"
                className={`flex flex-col items-center justify-center rounded-md p-2 ${activeTab === "payments" ? "bg-muted" : ""}`}
                onClick={() => {
                  setActiveTab("payments");
                }}
              >
                <CreditCard className="h-5 w-5" />
                <span className="mt-1 text-xs">Bayar</span>
              </Button>
              <Button
                variant="ghost"
                className={`flex flex-col items-center justify-center rounded-md p-2 ${activeTab === "profile" ? "bg-muted" : ""}`}
                onClick={() => {
                  setActiveTab("profile");
                }}
              >
                <User className="h-5 w-5" />
                <span className="mt-1 text-xs">Profil</span>
              </Button>
              <Button
                variant="ghost"
                className={`flex flex-col items-center justify-center rounded-md p-2 ${
                  activeTab === "notifications" ? "bg-muted" : ""
                }`}
                onClick={() => {
                  setActiveTab("notifications");
                }}
              >
                <Bell className="h-5 w-5" />
                <span className="mt-1 text-xs">Notif</span>
              </Button>
            </div>
          </div>
        </>
      )}
      <Toaster />
    </div>
  );
};

export default Home;
