import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getTranslation, formatCurrency } from "@/lib/language";
import LanguageSelector, {
  Language,
} from "@/components/common/LanguageSelector";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  LogOut,
  Car,
  Clock,
  CreditCard,
  User,
  Bell,
  DollarSign,
  CalendarIcon,
  ArrowRight,
} from "lucide-react";
import AuthForms from "./auth/AuthForms";
import VehicleBooking from "./booking/VehicleBooking";
import VehicleGroupListing from "./booking/VehicleGroupListing";
import BookingHistory from "./dashboard/BookingHistory";
import PaymentTracking from "./payments/PaymentTracking";
import DriverNotifications from "./dashboard/DriverNotifications";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const Home = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("booking");
  const [language, setLanguage] = useState<Language>("id");
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
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (data?.session?.user) {
          const { data: driverData, error: driverError } = await supabase
            .from("drivers")
            .select("*")
            .eq("id", data.session.user.id)
            .single();

          if (driverError) {
            console.error("Error fetching driver data:", driverError);
            setLoading(false);
            return;
          }

          setUser(driverData);

          // Fetch driver saldo if available
          if (driverData) {
            console.log("Driver data:", driverData);
            setDriverSaldo(driverData.saldo || 0);
          }

          // Pass user ID to ensure data is filtered for the logged-in user
          fetchPaymentStats(data.session.user.id);
          fetchCurrentVehicle(data.session.user.id);
        }
      } catch (error) {
        console.error("Error checking authentication:", error);
      } finally {
        setLoading(false);
      }
    };

    checkUser();

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
    };
  }, []);

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

  const fetchPaymentStats = async (userId) => {
    console.log("Fetching payment stats for user:", userId);
    try {
      // Get the latest booking data with remaining_payments field
      const { data: bookingsData, error: bookingsError } = await supabase
        .from("bookings")
        .select(
          "*, remaining_payments, booking_date, end_date, start_date, status, total_amount, paid_amount",
        )
        .eq("user_id", userId);

      if (bookingsError) throw bookingsError;

      // Get driver saldo directly from drivers table
      const { data: driverData, error: driverError } = await supabase
        .from("drivers")
        .select("saldo, overdue_days, total_overdue")
        .eq("id", userId)
        .single();

      if (driverError && driverError.code !== "PGRST116") {
        console.error("Error fetching driver saldo:", driverError);
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
          if (booking.status === "completed" && booking.end_date) {
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
          } else if (booking.status !== "completed" && booking.start_date) {
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

      // Get the driver saldo from the database
      let driverSaldoValue = 0;
      if (driverData && driverData.saldo !== undefined) {
        console.log("Driver saldo from database:", driverData.saldo);
        driverSaldoValue = driverData.saldo;
      }

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
      setDriverSaldo(driverSaldoValue);

      // Calculate total paid amount from bookings data
      const totalPaidAmount =
        bookingsData && bookingsData.length > 0
          ? bookingsData.reduce(
              (sum, booking) => sum + (booking.paid_amount || 0),
              0,
            )
          : 0;

      console.log("Payment stats from database:", {
        paid: totalPaidAmount,
        pending: pending,
        driverSaldo: driverSaldoValue,
        overdue: overduePaymentsCount,
        overdueTotal: totalOverdueAmount,
        maxOverdueDays: maxOverdueDays,
        unpaidBookings: pending > 0,
      });
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
      window.location.href =
        "https://recursing-shannon1-afnjp.view-3.tempo-dev.app/";
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const tabs = [
    { value: "booking", label: "Book Vehicle" },
    { value: "history", label: "Booking History" },
    { value: "payments", label: "Payments" },
    { value: "profile", label: "Profile" },
    { value: "notifications", label: "Notifications" },
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
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`}
                />
                <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
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
          </nav>

          <div className="absolute bottom-4 w-56">
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

      <div className="flex-1 overflow-auto p-4 md:p-6">
        <div className="mx-auto w-full max-w-[420px] md:max-w-6xl px-4">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Car className="h-6 w-6 text-primary" />
              <h1 className="text-lg font-bold">Driver Portal</h1>
            </div>
            {/*       <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden md:inline">Logout1</span>
            </Button>*/}
          </div>

          <div className="flex flex-col gap-4 mb-8 mt-4 border p-4 rounded-lg bg-card shadow-sm md:grid md:grid-cols-3">
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
                    Rp {driverSaldo.toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

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
                  <span className="text-2xl font-bold">{overdueDays} Hari</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {currentVehicle && (
            <div className="mb-8 border p-4 rounded-lg bg-card shadow-sm">
              <h2 className="text-xl font-bold mb-4">Kendaraan Favorit</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Make/Model
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      <Car className="mr-2 h-4 w-4 text-blue-500" />
                      <span className="text-2xl font-bold">
                        {currentVehicle.make} {currentVehicle.model}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Nomor Plat
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      <CreditCard className="mr-2 h-4 w-4 text-blue-500" />
                      <span className="text-2xl font-bold">
                        {currentVehicle.plate_number || "Tidak Tersedia"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          <div className="text-xs text-muted-foreground mb-4">
            User ID: {user?.id || "Not available"} | Stats loaded:{" "}
            {totalPaid > 0 || totalPending > 0 || overduePayments > 0
              ? "Yes"
              : "No"}
          </div>

          <div className="flex flex-col md:flex-row gap-4 mb-8">
            {hasUnpaidBookings && (
              <Button
                onClick={() => navigate("/payments")}
                className="flex items-center gap-2"
              >
                <CreditCard className="h-4 w-4" />
                Bayar Sekarang
              </Button>
            )}

            <Button
              variant="outline"
              onClick={() => {
                setActiveTab("booking");
                setTimeout(() => {
                  const vehicleGroupSection = document.getElementById(
                    "vehicle-group-listing",
                  );
                  if (vehicleGroupSection) {
                    vehicleGroupSection.scrollIntoView({ behavior: "smooth" });
                  }
                }, 100);
              }}
              className="flex items-center gap-2"
            >
              <ArrowRight className="h-4 w-4" />
              Lihat Kendaraan
            </Button>
          </div>

          <div className="mb-8" id="vehicle-group-listing">
            <h2 className="text-xl font-bold mb-4">Model Kendaraan</h2>
            <div className="border rounded-lg overflow-hidden">
              <VehicleGroupListing />
            </div>
          </div>

          <div className="w-full">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              defaultValue="booking"
              className="w-full"
            >
              {/* Tab Buttons */}
              <TabsList className="sticky top-0 z-0 w-full flex flex-wrap justify-center md:justify-start gap-2 bg-muted p-2 rounded-lg shadow-sm">
                {tabs.map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
                      activeTab === tab.value
                        ? "bg-primary text-white shadow"
                        : "bg-white text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              &nbsp;
              {/* Tab Panels */}
              <div className="flex flex-col gap-2 mt-8">
                <TabsContent
                  value="booking"
                  className="relative z-1 bg-white pt-6 pb-4 min-h-[240px]"
                >
                  <h2 className="mb-4 text-2xl font-bold">Book a Vehicle</h2>
                  {user?.id && <VehicleBooking userId={user.id} />}
                </TabsContent>

                <TabsContent
                  value="history"
                  className="relative z-0 bg-white pt-6 pb-4 min-h-[240px]"
                >
                  <h2 className="mb-6 text-2xl font-bold">Booking History</h2>
                  <BookingHistory userId={user?.id} />
                </TabsContent>

                <TabsContent
                  value="payments"
                  className="relative z-0 bg-white pt-6 pb-4 min-h-[240px]"
                >
                  <h2 className="mb-6 text-2xl font-bold">Payment Tracking</h2>
                  <PaymentTracking
                    userId={user?.id}
                    driverSaldo={driverSaldo}
                  />
                </TabsContent>

                <TabsContent
                  value="notifications"
                  className="relative z-0 bg-white pt-6 pb-4 min-h-[240px]"
                >
                  <h2 className="mb-6 text-2xl font-bold">
                    Driver Notifications
                  </h2>
                  <DriverNotifications />
                </TabsContent>

                <TabsContent
                  value="profile"
                  className="relative z-0 bg-white pt-6 pb-4 min-h-[240px]"
                >
                  <h2 className="mb-6 text-2xl font-bold">
                    {getTranslation("profile", language)}
                  </h2>
                  <Card>
                    <CardContent className="p-6">
                      {/* isi profile */}
                      <div className="grid gap-6 md:grid-cols-2">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Full Name
                          </p>
                          <p className="text-lg">{user.name}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Email
                          </p>
                          <p className="text-lg">{user.email}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Phone Number
                          </p>
                          <p className="text-lg">{user.phone_number}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            License Number
                          </p>
                          <p className="text-lg">{user.license_number}</p>
                        </div>
                      </div>
                      <div className="mt-6">
                        <Button className="w-full sm:w-auto">
                          Edit Profile
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </div>

      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 border-t bg-background p-2">
          <div className="grid grid-cols-5 gap-1">
            <Link to="/booking" className="block">
              <Button
                variant="ghost"
                className={`flex flex-col items-center justify-center rounded-md p-2 ${activeTab === "booking" ? "bg-muted" : ""}`}
                onClick={() => setActiveTab("booking")}
              >
                <Car className="h-5 w-5" />
                <span className="mt-1 text-xs">Book</span>
              </Button>
            </Link>
            <Link to="/booking-history" className="block">
              <Button
                variant="ghost"
                className={`flex flex-col items-center justify-center rounded-md p-2 ${activeTab === "history" ? "bg-muted" : ""}`}
                onClick={() => setActiveTab("history")}
              >
                <Clock className="h-5 w-5" />
                <span className="mt-1 text-xs">History</span>
              </Button>
            </Link>
            <Link to="/payments" className="block">
              <Button
                variant="ghost"
                className={`flex flex-col items-center justify-center rounded-md p-2 ${activeTab === "payments" ? "bg-muted" : ""}`}
                onClick={() => setActiveTab("payments")}
              >
                <CreditCard className="h-5 w-5" />
                <span className="mt-1 text-xs">Payments</span>
              </Button>
            </Link>
            <Link to="/profile" className="block">
              <Button
                variant="ghost"
                className={`flex flex-col items-center justify-center rounded-md p-2 ${activeTab === "profile" ? "bg-muted" : ""}`}
                onClick={() => setActiveTab("profile")}
              >
                <User className="h-5 w-5" />
                <span className="mt-1 text-xs">Profile</span>
              </Button>
            </Link>
            <Button
              variant="ghost"
              className={`flex flex-col items-center justify-center rounded-md p-2 ${
                activeTab === "notifications" ? "bg-muted" : ""
              }`}
              onClick={() => setActiveTab("notifications")}
            >
              <Bell className="h-5 w-5" />
              <span className="mt-1 text-xs">Notif</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
