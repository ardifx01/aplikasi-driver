import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);
import {
  Clock,
  DollarSign,
  Car,
  CreditCard,
  CheckCircle,
  Globe,
  ArrowLeft,
  CalendarIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import LanguageSelector, {
  Language,
} from "@/components/common/LanguageSelector";
import { getTranslation, formatCurrency } from "@/lib/language";
import { useLanguage } from "@/lib/languageContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { supabase } from "@/lib/supabase";

const formatToWIB = (isoString: string) => {
  return dayjs(isoString).tz("Asia/Jakarta").format("DD MMM YYYY, HH:mm");
};

interface VehicleBookingProps {
  userId?: string;
  driverSaldo?: number;
}

const VehicleBooking = ({
  userId,
  driverSaldo: propDriverSaldo,
}: VehicleBookingProps) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const typeFilter = searchParams.get("type");
  const modelFilter = searchParams.get("model");
  const makeFilter = searchParams.get("make");
  const { language } = useLanguage();
  const [userSaldo, setUserSaldo] = useState(0);
  const [insufficientFunds, setInsufficientFunds] = useState(false);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowFormatted = format(tomorrow, "EEEE, MMMM d, yyyy");

  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [startTime, setStartTime] = useState("08:00");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBookingSuccess, setIsBookingSuccess] = useState(false);
  const [bookingId, setBookingId] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState(null);
  const [hasActiveBooking, setHasActiveBooking] = useState(false);
  const [activeBooking, setActiveBooking] = useState(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");

  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("Saldo"); // default Cash

  const [pickupDate, setPickupDate] = useState(null);
  const [returnDate, setReturnDate] = useState(null);
  const [pickupDateOpen, setPickupDateOpen] = useState(false);
  const [returnDateOpen, setReturnDateOpen] = useState(false);
  const [pickupTime, setPickupTime] = useState("08:00");
  const [returnTime, setReturnTime] = useState("08:00");
  const [driverOption, setDriverOption] = useState("self");
  const [timeValidationError, setTimeValidationError] = useState("");
  const [isTimeValid, setIsTimeValid] = useState(true);

  const calculateRentalDuration = () => {
    if (!pickupDate || !returnDate) return 1;
    const pickupTime = new Date(pickupDate);
    const returnTime = new Date(returnDate);
    const diffTime = Math.abs(returnTime.getTime() - pickupTime.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays || 1;
  };

  // Calculate minimum return date (pickup date + 1 day)
  const getMinReturnDate = () => {
    if (!pickupDate) return null;
    const minDate = new Date(pickupDate);
    minDate.setDate(minDate.getDate() + 1);
    return minDate;
  };

  const rentalDuration = calculateRentalDuration();
  const totalPrice = selectedVehicle
    ? selectedVehicle.price * rentalDuration
    : 0;
  const driverFee = 150000;
  const gpsFee = 5000; // GPS fee of Rp 5,000

  // Check if user can make booking (balance can go negative up to -500,000)
  useEffect(() => {
    if (selectedVehicle) {
      const calculatedTotal =
        selectedVehicle.price * rentalDuration +
        gpsFee +
        (driverOption === "with-driver" ? driverFee * rentalDuration : 0);
      const balanceAfterBooking = userSaldo - calculatedTotal;
      // Allow booking if balance after booking is above -500,000
      setInsufficientFunds(balanceAfterBooking < -500000);
    }
  }, [selectedVehicle, rentalDuration, driverOption, userSaldo, driverFee]);

  // Validate pickup and return times
  useEffect(() => {
    if (pickupTime && returnTime) {
      if (pickupTime !== returnTime) {
        setTimeValidationError(
          language === "id"
            ? "Jam tidak sesuai, silahkan sesuaikan kembali"
            : "Time mismatch, please adjust accordingly",
        );
        setIsTimeValid(false);
      } else {
        setTimeValidationError("");
        setIsTimeValid(true);
      }
    }
  }, [pickupTime, returnTime, language]);

  // Fetch driver saldo from drivers table
  useEffect(() => {
    const fetchDriverSaldo = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const sessionUserEmail = user.email;
          console.log("🔍 VehicleBooking - Session user ID:", user.id);
          console.log(
            "🔍 VehicleBooking - Session user email:",
            sessionUserEmail,
          );

          // Fetch saldo directly from drivers table by ID first
          let { data: driverData, error: driverError } = await supabase
            .from("drivers")
            .select("saldo, id, email")
            .eq("id", user.id)
            .maybeSingle();

          console.log("🔍 VehicleBooking - Driver data by ID:", driverData);
          console.log("❗ VehicleBooking - Driver error:", driverError);

          // If no driver found by ID, try by email
          if (!driverData && sessionUserEmail) {
            const { data: driverByEmail, error: driverByEmailError } =
              await supabase
                .from("drivers")
                .select("saldo, id, email")
                .eq("email", sessionUserEmail)
                .maybeSingle();

            console.log(
              "🔍 VehicleBooking - Driver data by email:",
              driverByEmail,
            );
            console.log(
              "❗ VehicleBooking - Driver by email error:",
              driverByEmailError,
            );

            if (driverByEmail) {
              driverData = driverByEmail;
            }
          }

          if (driverData) {
            const saldoValue = Number(driverData.saldo) || 0;
            setUserSaldo(saldoValue);
            console.log(
              "✅ VehicleBooking - Driver saldo from drivers table:",
              saldoValue,
              "(raw:",
              driverData.saldo,
              ")",
            );
          } else {
            console.log("❌ VehicleBooking - No driver found in drivers table");
            setUserSaldo(0);
          }
        }
      } catch (error) {
        console.error("Error fetching driver saldo:", error);
        setUserSaldo(0);
      }
    };

    fetchDriverSaldo();
  }, []);

  useEffect(() => {
    const fetchVehicles = async () => {
      let query = supabase
        .from("vehicles")
        .select("*")
        .eq("status", "available");
      if (typeFilter) query = query.eq("type", typeFilter);
      if (modelFilter) query = query.eq("model", modelFilter);
      if (makeFilter) query = query.eq("make", makeFilter);
      const { data, error } = await query;
      if (!error && data) {
        setAvailableVehicles(data);
        setFilteredVehicles(data);
      }
    };

    const fetchDrivers = async () => {
      const { data, error } = await supabase
        .from("drivers")
        .select("*")
        .eq("status", "available");
      if (!error && data) setAvailableDrivers(data);
    };

    fetchVehicles();
    fetchDrivers();
  }, [typeFilter]);

  // Function to generate booking code
  const generateBookingCode = () => {
    const now = new Date();
    const dateTime = now.toISOString().slice(0, 19).replace(/[-:T]/g, "");
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `SKD-${dateTime}-${random}`;
  };

  const handleBookingSubmit = async () => {
    if (!selectedVehicle) return;

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        alert("Anda harus login terlebih dahulu.");
        return;
      }

      const { data: existingBookings, error: bookingError } = await supabase
        .from("bookings")
        .select("*")
        .eq("user_id", user.id)
        .in("status", ["pending", "approved"]);

      if (bookingError) throw bookingError;

      if (existingBookings && existingBookings.length > 0) {
        alert(
          language === "id"
            ? "Anda sudah memiliki pemesanan aktif. Tidak dapat membuat pemesanan baru sampai pemesanan aktif selesai."
            : "You already have an active booking. Cannot create a new booking until the active one is completed.",
        );
        setHasActiveBooking(true);
        setActiveBooking(existingBookings[0]);
        setIsDialogOpen(false);
        return;
      }

      const calculatedTotalAmount =
        totalPrice +
        gpsFee +
        (driverOption === "with-driver"
          ? driverFee * calculateRentalDuration()
          : 0);

      // Tambahkan fungsi ini sebelum bookingData
      const formatDateLocal = (date: Date) => {
        const local = new Date(
          date.getTime() - date.getTimezoneOffset() * 60000,
        );
        return local.toISOString().split("T")[0];
      };

      // Determine driver_id based on driver option
      let driverId = null;

      if (driverOption === "with-driver" && selectedDriver) {
        // If with-driver option is selected and a driver is chosen
        driverId = selectedDriver.id; // Use selected driver's ID from drivers table
        console.log("Using selected driver ID:", driverId);
      } else {
        // For self-drive, ONLY use existing driver records from the drivers table
        try {
          const { data: driverData, error: driverError } = await supabase
            .from("drivers")
            .select("id, name")
            .eq("email", user.email)
            .maybeSingle();

          console.log("Driver lookup result:", { driverData, driverError });

          if (driverData && !driverError) {
            driverId = driverData.id; // Use driver ID from drivers table
            console.log("Found driver in drivers table:", driverId);
          } else {
            // If user is not found in drivers table, prevent booking creation
            console.error("User not found in drivers table:", user.email);
            alert(
              language === "id"
                ? "Akun Anda belum terdaftar sebagai driver. Silakan hubungi administrator untuk mendaftarkan akun Anda sebagai driver."
                : "Your account is not registered as a driver. Please contact the administrator to register your account as a driver.",
            );
            return;
          }
        } catch (error) {
          console.error("Error fetching driver data:", error);
          alert(
            language === "id"
              ? "Terjadi kesalahan saat memverifikasi data driver. Silakan coba lagi."
              : "An error occurred while verifying driver data. Please try again.",
          );
          return;
        }
      }

      // Ensure driver_id is not null
      if (!driverId) {
        console.error("Driver ID is null, this will cause database error");
        alert(
          "Error: Unable to determine driver information. Please try again.",
        );
        return;
      }

      // Get driver name for the booking
      let driverName = "Unknown";
      try {
        if (driverOption === "with-driver" && selectedDriver) {
          // Use selected driver's name
          driverName = selectedDriver.name || "Unknown Driver";
        } else {
          // For self-drive, get the current user's name from drivers table
          // Since we already verified the driver exists above, we can safely fetch the name
          const { data: currentDriverData, error: currentDriverError } =
            await supabase
              .from("drivers")
              .select("name")
              .eq("id", driverId)
              .maybeSingle();

          if (currentDriverData && !currentDriverError) {
            driverName = currentDriverData.name || "Unknown Driver";
          } else {
            // This should not happen since we already verified the driver exists
            console.error(
              "Driver name not found for existing driver ID:",
              driverId,
            );
            driverName = "Driver Name Not Found";
          }
        }
      } catch (error) {
        console.error("Error getting driver name:", error);
        driverName = "Error Getting Driver Name";
      }

      // Generate booking code
      const bookingCode = generateBookingCode();

      // Function to get current local time in Asia/Jakarta timezone
      const getCurrentLocalTime = () => {
        const now = new Date();
        // Convert to Asia/Jakarta timezone
        const jakartaTime = new Date(
          now.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }),
        );
        return jakartaTime.toISOString();
      };

      // Create booking data with only valid bookings table columns
      const bookingData = {
        vehicle_id: selectedVehicle.id,
        driver_option:
          driverOption === "with-driver" ? "Driver Service" : "Self Drive",
        vehicle_type: selectedVehicle.type || null,
        vehicle_name:
          selectedVehicle.name ||
          `${selectedVehicle.make} ${selectedVehicle.model}` ||
          "Unknown Vehicle",
        make: selectedVehicle.make || null,
        model: selectedVehicle.model || null,
        license_plate: selectedVehicle.license_plate || null,
        plate_number: selectedVehicle.plate_number || null,
        booking_date: tomorrow.toISOString().split("T")[0],
        start_time: startTime,
        return_time: returnTime,
        duration: calculateRentalDuration(),
        status: "pending",
        payment_status: "unpaid",
        payment_method: paymentMethod,
        total_amount: calculatedTotalAmount,
        paid_amount: 0,
        remaining_payments: calculatedTotalAmount,
        start_date: pickupDate
          ? formatDateLocal(pickupDate)
          : formatDateLocal(tomorrow),
        end_date: returnDate
          ? formatDateLocal(returnDate)
          : formatDateLocal(tomorrow),
        user_id: user.id,
        // ===== DRIVERS_ID RE-ENABLED =====
        driver_id: driverId, // Re-enabled to ensure driver_id is populated
        name: driverName,
        code_booking: bookingCode, // Add the generated booking code
        created_at: getCurrentLocalTime(), // Set created_at with local timezone (Asia/Jakarta)
        created_at_tz: getCurrentLocalTime(), // Set created_at_tz with local timezone (Asia/Jakarta)
        updated_at: getCurrentLocalTime(), // Set updated_at with local timezone (Asia/Jakarta)
      };
      console.log("returnDate:", returnDate);
      console.log("Booking data to be inserted:", bookingData);
      console.log("Selected vehicle:", selectedVehicle);
      console.log("Booking data keys:", Object.keys(bookingData));

      // Validate that we don't have any invalid column names
      const validColumns = [
        "vehicle_id",
        "created_at",
        "created_at_tz",
        "updated_at",
        "code_booking",
        "driver_option",
        "vehicle_type",
        "vehicle_name",
        "make",
        "model",
        "license_plate",
        "plate_number",
        "booking_date",
        "start_time",
        "return_time",
        "duration",
        "status",
        "payment_status",
        "payment_method",
        "total_amount",
        "paid_amount",
        "remaining_payments",
        "start_date",
        "end_date",
        "user_id",
        "driver_id",
        "name",
      ];

      const invalidColumns = Object.keys(bookingData).filter(
        (key) => !validColumns.includes(key),
      );
      if (invalidColumns.length > 0) {
        console.error("Invalid columns detected:", invalidColumns);
      }
      const { data, error } = await supabase
        .from("bookings")
        .insert([bookingData])
        .select();

      if (error) throw error;
      if (data && data.length > 0) {
        const newBookingId = data[0].id;
        setBookingId(newBookingId);

        // Insert GPS fee as a booking item
        try {
          const { error: itemError } = await supabase
            .from("booking_items")
            .insert({
              booking_id: newBookingId,
              item_type: "gps",
              item_name: "GPS",
              description: "GPS tracking device rental",
              quantity: 1,
              unit_price: gpsFee,
              total_price: gpsFee,
            });

          if (itemError) {
            console.error("Error creating GPS booking item:", itemError);
          } else {
            console.log("GPS booking item created successfully");
          }
        } catch (itemError) {
          console.error("Error creating GPS booking item:", itemError);
        }

        setIsBookingSuccess(true);
      }
    } catch (error) {
      console.error("Error creating booking:", error);
      alert("Gagal melakukan booking. Silakan coba lagi.");
    }
  };

  const resetBookingForm = () => {
    setSelectedVehicle(null);
    setStartTime("08:00");
    setIsBookingSuccess(false);
    setIsDialogOpen(false);
    setBookingId(null);
  };

  const handleCancelBooking = async (bookingId) => {
    if (!bookingId) return;

    try {
      setIsCancelling(true);
      setCancelError(null);

      const { error } = await supabase
        .from("bookings")
        .update({
          status: "cancelled",
          notes_driver: cancellationReason,
        })
        .eq("id", bookingId);

      if (error) throw error;

      setIsDialogOpen(false);
      setShowCancelDialog(false);
      setCancellationReason("");
      resetBookingForm();
      navigate("/booking-history");
    } catch (error) {
      console.error("Error cancelling booking:", error);
      setCancelError(
        language === "id"
          ? "Gagal membatalkan pemesanan. Silakan coba lagi."
          : "Failed to cancel booking. Please try again.",
      );
    } finally {
      setIsCancelling(false);
    }
  };

  const handleCancelClick = () => {
    setShowCancelDialog(true);
  };

  const handleConfirmCancel = () => {
    handleCancelBooking(bookingId);
  };

  const handleCancelDialogClose = () => {
    setShowCancelDialog(false);
    setCancellationReason("");
  };

  const handleGoBack = () => {
    if (typeFilter) {
      navigate("/vehicle-groups");
    } else {
      navigate(-1);
    }
  };

  const [searchPlate, setSearchPlate] = useState("");

  {
    /*filter kendaraan berdasarkan plat nomor*/
  }
  useEffect(() => {
    if (searchPlate.trim() === "") {
      setFilteredVehicles(availableVehicles);
    } else {
      const filtered = availableVehicles.filter((v) =>
        v.license_plate?.toLowerCase().includes(searchPlate.toLowerCase()),
      );
      setFilteredVehicles(filtered);
    }
  }, [searchPlate, availableVehicles]);

  return (
    <div className="container mx-auto px-4 py-8 bg-gray-50">
      {/*    <div className="mb-4">
        <Button
          variant="outline"
          onClick={handleGoBack}
          className="flex items-center gap-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-arrow-left"
          >
            <path d="m12 19-7-7 7-7" />
            <path d="M19 12H5" />
          </svg>
          {language === "id" ? "Kembali" : "Back1"}
        </Button>
      </div>*/}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {typeFilter
              ? `${typeFilter.charAt(0).toUpperCase() + typeFilter.slice(1)} ${language === "id" ? "Kendaraan" : "Vehicles"}`
              : getTranslation("bookVehicle", language)}
            {makeFilter && ` - ${makeFilter}`}
            {modelFilter && ` ${modelFilter}`}
          </h1>
          <p className="text-gray-600 mt-2">
            {typeFilter
              ? `${language === "id" ? "Tersedia" : "Available"} ${typeFilter} ${language === "id" ? "kendaraan" : "vehicles"}`
              : `${language === "id" ? "Kendaraan tersedia" : "Available vehicles"}`}
            {makeFilter &&
              ` ${language === "id" ? "dari" : "from"} ${makeFilter}`}
            {modelFilter &&
              ` ${language === "id" ? "model" : "model"} ${modelFilter}`}
            {` ${language === "id" ? "untuk" : "for"} `}
            <span className="font-medium">{tomorrowFormatted}</span>
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            onClick={() => navigate("/booking-history")}
            className="mt-4 md:mt-0 flex items-center gap-2 bg-primary hover:bg-primary/90 transition-colors"
          >
            <Clock className="h-4 w-4" />
            {getTranslation("bookingHistory", language)}
          </Button>
        </div>
      </div>

      {/* kolom mencari kendaraan*/}
      <div className="mb-4">
        <Input
          type="text"
          placeholder="Cari berdasarkan plat nomor..."
          value={searchPlate}
          onChange={(e) => setSearchPlate(e.target.value)}
          className="w-full max-w-md"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        {filteredVehicles.length > 0 ? (
          filteredVehicles.map((vehicle) => (
            <motion.div
              key={vehicle.id}
              whileHover={{ y: -5 }}
              transition={{ duration: 0.2 }}
            >
              <Card
                className={`overflow-hidden h-full cursor-pointer transition-all ${selectedVehicle?.id === vehicle.id ? "ring-2 ring-primary" : ""}`}
                onClick={() => setSelectedVehicle(vehicle)}
              >
                <div className="h-48 overflow-hidden relative">
                  {vehicle.plate_number && (
                    <div className="absolute top-3 left-3 bg-white/90 px-2 py-1 rounded-md text-xs font-medium z-10 border border-gray-200 shadow-sm">
                      {vehicle.plate_number}
                    </div>
                  )}
                  <img
                    src={vehicle.image}
                    alt={vehicle.name}
                    className="w-full h-full object-cover transition-transform hover:scale-105"
                  />
                </div>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-base font-semibold text-gray-900">
                        {vehicle.name}
                      </CardTitle>
                      <CardDescription className="text-sm text-gray-700">
                        {vehicle.type}
                      </CardDescription>
                      {vehicle.make && vehicle.model && (
                        <div className="text-sm text-gray-700 mt-1">
                          {vehicle.make} {vehicle.model}
                        </div>
                      )}
                      {/* License plate display outside of CardDescription */}
                      {vehicle.license_plate && (
                        <div className="mt-1">
                          <span className="text-sm font-bold text-black bg-white px-13 py-1 border-gray-300 inline-block w-fit">
                            {vehicle.license_plate}
                          </span>
                        </div>
                      )}
                    </div>
                    <Badge variant="secondary">
                      <Car className="h-3 w-3 mr-1" />
                      {language === "id" ? "Tersedia" : "Available"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardFooter className="pt-2 flex justify-between items-center">
                  <div className="flex items-center text-primary font-semibold">
                    {formatCurrency(vehicle.price, language)} /
                    {language === "id" ? "hari" : "day"}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedVehicle(vehicle);
                      setIsDialogOpen(true);
                    }}
                  >
                    {language === "id" ? "Pesan Sekarang" : "Book Now"}
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))
        ) : (
          <div className="col-span-3 text-center py-12">
            <Car className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {language === "id"
                ? "Tidak ada kendaraan tersedia"
                : "No vehicles available"}
            </h3>
            <p className="text-gray-500 mb-6">
              {language === "id"
                ? "Tidak ada kendaraan tersedia dalam kategori ini saat ini."
                : "There are no vehicles available in this category at the moment."}
            </p>
            <Button onClick={() => navigate("/vehicle-groups")}>
              {language === "id"
                ? "Lihat Semua Kategori"
                : "View All Categories"}
            </Button>
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          {!isBookingSuccess ? (
            <>
              <DialogHeader>
                <DialogTitle>
                  {language === "id" ? "Pesan Rental Anda" : "Book Your Rental"}
                </DialogTitle>
                <DialogDescription>
                  {language === "id"
                    ? `Lengkapi formulir di bawah untuk memesan ${selectedVehicle?.make} untuk perjalanan Anda.`
                    : `Complete the form below to book ${selectedVehicle?.make} for your trip.`}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                {selectedVehicle && (
                  <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
                    <div className="h-16 w-16 overflow-hidden rounded-md">
                      <img
                        src={selectedVehicle.image}
                        alt={selectedVehicle.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="font-medium text-lg">
                        {selectedVehicle.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedVehicle.type} •{" "}
                        {formatCurrency(selectedVehicle.price, language)}/
                        {language === "id" ? "hari" : "day"}
                      </p>
                      {selectedVehicle.license_plate && (
                        <div className="mt-1 flex items-center">
                          <Car className="h-3 w-3 mr-1 text-gray-500" />
                          <span className="text-sm font-medium bg-gray-100 px-2 py-0.5 border border-gray-300 rounded">
                            {selectedVehicle.license_plate}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="grid gap-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="pickup-date" className="mb-2 block">
                        {language === "id"
                          ? "Tanggal Pengambilan"
                          : "Pickup Date"}
                      </Label>
                      <Popover
                        open={pickupDateOpen}
                        onOpenChange={setPickupDateOpen}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                            id="pickup-date"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {pickupDate
                              ? format(pickupDate, "MMMM dd, yyyy")
                              : language === "id"
                                ? "Pilih tanggal"
                                : "Select date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={pickupDate}
                            onSelect={(date) => {
                              if (date) {
                                setPickupDate(date);
                                // Auto-set return date to pickup date + 1 day
                                const nextDay = new Date(date);
                                nextDay.setDate(nextDay.getDate() + 1);
                                setReturnDate(nextDay);
                              }
                              setPickupDateOpen(false);
                            }}
                            // Remove date restriction - allow past dates for admin/dispatcher
                            disabled={false}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    {pickupDate && (
                      <div>
                        <Label htmlFor="return-date" className="mb-2 block">
                          {language === "id"
                            ? "Tanggal Pengembalian"
                            : "Return Date"}
                        </Label>
                        <Popover
                          open={returnDateOpen}
                          onOpenChange={setReturnDateOpen}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal"
                              id="return-date"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {returnDate
                                ? format(returnDate, "MMMM dd, yyyy")
                                : language === "id"
                                  ? "Pilih tanggal"
                                  : "Select date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={returnDate}
                              onSelect={(date) => {
                                if (date) {
                                  setReturnDate(date);
                                  setReturnDateOpen(false);
                                }
                              }}
                              disabled={(date) => {
                                const minDate = getMinReturnDate();
                                return !minDate || date < minDate;
                              }}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="pickup-time" className="mb-2 block">
                        {language === "id"
                          ? "Waktu Pengambilan"
                          : "Pickup Time"}
                      </Label>
                      <div className="relative">
                        <Input
                          id="start_time"
                          type="time"
                          value={pickupTime}
                          onChange={(e) => setPickupTime(e.target.value)}
                          min="06:00"
                          max="22:00"
                          className="pl-10"
                        />
                        <Clock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="return-time" className="mb-2 block">
                        {language === "id"
                          ? "Waktu Pengembalian"
                          : "Return Time"}
                      </Label>
                      <div className="relative">
                        <Input
                          id="return_time"
                          type="time"
                          value={returnTime}
                          onChange={(e) => setReturnTime(e.target.value)}
                          min="06:00"
                          max="22:00"
                          className="pl-10"
                        />
                        <Clock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                  </div>
                </div>

                {/*  <div className="grid gap-2">
                  <Label>
                    {language === "id" ? "Opsi Pengemudi" : "Driver Option"}
                  </Label>
                  <RadioGroup
                    value={driverOption}
                    onValueChange={(value) =>
                      setDriverOption(value as "self" | "with-driver")
                    }
                    className="grid grid-cols-2 gap-4"
                  >
                    <div className="flex items-center space-x-2 border rounded-md p-4 cursor-pointer hover:bg-slate-50">
                      <RadioGroupItem value="self" id="self-drive" />
                      <Label htmlFor="self-drive" className="cursor-pointer">
                        {language === "id" ? "Mengemudi sendiri" : "Self-drive"}
                      </Label>
                    </div>
                      <div className="flex items-center space-x-2 border rounded-md p-4 cursor-pointer hover:bg-slate-50">
                      <RadioGroupItem value="with-driver" id="with-driver" />
                      <Label htmlFor="with-driver" className="cursor-pointer">
                        {language === "id"
                          ? `Dengan pengemudi (+${formatCurrency(driverFee, language)}/hari)`
                          : `With driver (+${formatCurrency(driverFee, language)}/day)`}
                      </Label>
                    </div>

                    {driverOption === "with-driver" &&
                      availableDrivers.length > 0 && (
                        <div className="col-span-2 mt-2">
                          <Label htmlFor="driver-select" className="mb-2 block">
                            {language === "id"
                              ? "Pilih Pengemudi"
                              : "Select Driver"}
                          </Label>
                          <select
                            id="driver-select"
                            className="w-full p-2 border rounded-md"
                            value={selectedDriver?.id || ""}
                            onChange={(e) => {
                              const driverId = e.target.value;
                              const driver =
                                availableDrivers.find(
                                  (d) => d.id === driverId,
                                ) || null;
                              setSelectedDriver(driver);
                            }}
                          >
                            {availableDrivers.map((driver) => (
                              <option key={driver.id} value={driver.id}>
                                {driver.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                    {driverOption === "with-driver" &&
                      availableDrivers.length === 0 && (
                        <div className="col-span-2 mt-2 text-red-500">
                          {language === "id"
                            ? "Tidak ada pengemudi tersedia"
                            : "No drivers available"}
                        </div>
                      )}
                  </RadioGroup>
                </div>*/}

                <div className="bg-slate-50 p-4 rounded-lg border-2 border-white-500">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-normal">
                      {language === "id"
                        ? "Biaya sewa kendaraan"
                        : "Vehicle rental fee"}
                    </span>
                    <span className="text-sm font-normal">
                      {selectedVehicle
                        ? formatCurrency(selectedVehicle.price, language)
                        : formatCurrency(0, language)}
                    </span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-normal">GPS</span>
                    <span className="text-sm font-normal">
                      {formatCurrency(gpsFee, language)}
                    </span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-normal">
                      {language === "id" ? "Saldo Anda" : "Your balance"}
                    </span>
                    <span
                      className="text-sm font-normal"
                      className={
                        userSaldo < 0
                          ? "text-red-500 font-normal"
                          : "text-green-500 font-normal"
                      }
                    >
                      {(() => {
                        console.log(
                          "🎯 VehicleBooking - Rendering user saldo:",
                          userSaldo,
                          "(type:",
                          typeof userSaldo,
                          ")",
                        );
                        return formatCurrency(userSaldo, language);
                      })()}
                    </span>
                  </div>
                  {driverOption === "with-driver" && (
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">
                        {language === "id" ? "Biaya pengemudi" : "Driver fee"}
                        {selectedDriver && (
                          <span className="text-xs text-gray-500 ml-1">
                            ({selectedDriver.id})
                          </span>
                        )}
                      </span>
                      <span className="font-medium">
                        {formatCurrency(driverFee, language)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold pt-2 border-t mt-2 text-lg">
                    <span className="text-sm font-normal">
                      {language === "id"
                        ? "Total Biaya Sewa"
                        : "Total Rental Cost"}
                    </span>
                    <span className="text-sm font-bold">
                      {formatCurrency(
                        totalPrice +
                          gpsFee +
                          (driverOption === "with-driver"
                            ? driverFee * rentalDuration
                            : 0),
                        language,
                      )}
                    </span>
                  </div>
                  {/* Balance after booking calculation */}
                  {(() => {
                    const totalCost =
                      totalPrice +
                      gpsFee +
                      (driverOption === "with-driver"
                        ? driverFee * rentalDuration
                        : 0);
                    const balanceAfterBooking = userSaldo - totalCost;
                    const isNegativeBalance = balanceAfterBooking < 0;
                    const isOverLimit = balanceAfterBooking < -500000;

                    return (
                      <div
                        className={`mt-3 p-3 rounded-md border-2 ${
                          isOverLimit
                            ? "bg-red-50 border-red-300"
                            : isNegativeBalance
                              ? "bg-yellow-50 border-yellow-300"
                              : "bg-green-50 border-green-300"
                        }`}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-sm">
                            {language === "id"
                              ? "Saldo setelah pemesanan:"
                              : "Balance after booking:"}
                          </span>
                          <span
                            className={`font-bold ${
                              isOverLimit
                                ? "text-red-600"
                                : isNegativeBalance
                                  ? "text-yellow-600"
                                  : "text-green-600"
                            }`}
                          >
                            {formatCurrency(balanceAfterBooking, language)}
                          </span>
                        </div>

                        {isOverLimit && (
                          <div className="text-red-600 text-sm font-medium">
                            {language === "id"
                              ? "⚠️ Saldo tidak mencukupi. Batas maksimal minus Rp 500.000"
                              : "⚠️ Insufficient balance. Maximum negative limit is Rp 500,000"}
                          </div>
                        )}

                        {isNegativeBalance && !isOverLimit && (
                          <div className="text-yellow-600 text-sm font-medium">
                            {language === "id"
                              ? "⚠️ Saldo akan minus setelah pemesanan"
                              : "⚠️ Balance will be negative after booking"}
                          </div>
                        )}

                        {!isNegativeBalance && (
                          <div className="text-green-600 text-sm font-medium">
                            {language === "id"
                              ? "✅ Saldo mencukupi"
                              : "✅ Sufficient balance"}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {pickupDate && returnDate && (
                    <div className="text-xs text-gray-500 mt-2">
                      {language === "id"
                        ? `Durasi sewa: ${rentalDuration} hari (${format(pickupDate, "dd MMM")} - ${format(returnDate, "dd MMM")})`
                        : `Rental duration: ${rentalDuration} days (${format(pickupDate, "MMM dd")} - ${format(returnDate, "MMM dd")})`}
                    </div>
                  )}
                  {timeValidationError && (
                    <div className="text-red-500 text-sm mt-2 p-2 bg-red-50 rounded-md border border-red-200">
                      {timeValidationError}
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter className="flex justify-between sm:justify-between gap-4">
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />{" "}
                  {language === "id" ? "Kembali" : "Back"}
                </Button>
                <Button
                  onClick={handleBookingSubmit}
                  disabled={
                    insufficientFunds ||
                    !isTimeValid ||
                    !pickupDate ||
                    !returnDate
                  }
                  className={
                    insufficientFunds ||
                    !isTimeValid ||
                    !pickupDate ||
                    !returnDate
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }
                >
                  {insufficientFunds
                    ? language === "id"
                      ? "Saldo Tidak Cukup"
                      : "Insufficient Balance"
                    : !isTimeValid
                      ? language === "id"
                        ? "Jam Tidak Sesuai"
                        : "Time Mismatch"
                      : language === "id"
                        ? "Pesan Sekarang"
                        : "Book Now"}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <div className="py-12 flex flex-col items-center text-center">
              <div className="rounded-full bg-green-100 p-3 mb-4">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <DialogTitle className="mb-2">
                {language === "id"
                  ? "Pemesanan Berhasil!"
                  : "Booking Successful!"}
              </DialogTitle>
              <DialogDescription className="mb-6">
                {language === "id"
                  ? "Permintaan pemesanan Anda telah dikirim. Silakan lanjutkan ke pembayaran untuk menyelesaikan pemesanan Anda."
                  : "Your booking request has been submitted. Please proceed to payment to complete your booking."}
              </DialogDescription>
              <div className="flex flex-col gap-4">
                <div className="flex gap-4">
                  <Button onClick={() => navigate(`/payment/${bookingId}`)}>
                    {language === "id"
                      ? "Lanjutkan ke Pembayaran"
                      : "Proceed to Payment"}
                  </Button>
                  {/*
                  <Button
                    onClick={() => navigate("/booking-history")}
                    variant="outline"
                  >
                    {language === "id"
                      ? "Lihat Riwayat Pemesanan1"
                      : "View Booking History"}
                  </Button>
                  */}
                </div>
                <Button
                  onClick={handleCancelClick}
                  variant="destructive"
                  disabled={isCancelling}
                  className="mt-2"
                >
                  {typeof isCancelling !== "undefined" && isCancelling ? (
                    <>
                      {language === "id" ? "Membatalkan..." : "Cancelling..."}
                    </>
                  ) : (
                    <>
                      {language === "id"
                        ? "Batalkan Pemesanan"
                        : "Cancel Booking"}
                    </>
                  )}
                </Button>
                {cancelError && (
                  <p className="text-destructive text-sm mt-2">{cancelError}</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancellation Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === "id"
                ? "Konfirmasi Pembatalan"
                : "Confirm Cancellation"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === "id"
                ? "Apakah pesanan akan dibatalkan?"
                : "Are you sure you want to cancel this booking?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="cancellation-reason">
                {language === "id"
                  ? "Keterangan Pembatalan"
                  : "Cancellation Reason"}
              </Label>
              <Textarea
                id="cancellation-reason"
                placeholder={
                  language === "id"
                    ? "Masukkan alasan pembatalan..."
                    : "Enter cancellation reason..."
                }
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelDialogClose}>
              {language === "id" ? "Batal" : "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmCancel}
              disabled={isCancelling || !cancellationReason.trim()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isCancelling
                ? language === "id"
                  ? "Membatalkan..."
                  : "Cancelling..."
                : language === "id"
                  ? "Ya, Batalkan"
                  : "Yes, Cancel"}
            </AlertDialogAction>
          </AlertDialogFooter>
          {cancelError && (
            <p className="text-destructive text-sm mt-2">{cancelError}</p>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default VehicleBooking;