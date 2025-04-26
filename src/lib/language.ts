import { Language } from "@/components/common/LanguageSelector";

export type TranslationKey =
  | "dashboard"
  | "bookVehicle"
  | "bookingHistory"
  | "payments"
  | "profile"
  | "notifications"
  | "signOut"
  | "dashboardOverview"
  | "totalPaid"
  | "pendingPayments"
  | "overdue"
  | "overdueDetails"
  | "totalOverdue"
  | "overdueDays"
  | "currentVehicle"
  | "makeModel"
  | "plateNumber"
  | "payNow"
  | "viewVehicles"
  | "vehicleModels";

export const translations: Record<Language, Record<TranslationKey, string>> = {
  en: {
    dashboard: "Driver Portal",
    bookVehicle: "Book Vehicle",
    bookingHistory: "Booking History",
    payments: "Payments",
    profile: "Profile",
    notifications: "Notifications",
    signOut: "Sign Out",
    dashboardOverview: "Dashboard Overview",
    totalPaid: "Total Paid",
    pendingPayments: "Pending Payments",
    overdue: "Overdue",
    overdueDetails: "Overdue Details",
    totalOverdue: "Total Overdue",
    overdueDays: "Overdue Days",
    currentVehicle: "Current Vehicle",
    makeModel: "Make/Model",
    plateNumber: "Plate Number",
    payNow: "Pay Now",
    viewVehicles: "View Vehicles",
    vehicleModels: "Vehicle Models",
  },
  id: {
    dashboard: "Portal Pengemudi",
    bookVehicle: "Pesan Kendaraan1",
    bookingHistory: "Riwayat Pemesanan",
    payments: "Pembayaran",
    profile: "Profil",
    notifications: "Notifikasi",
    signOut: "Keluar",
    dashboardOverview: "Ikhtisar Dasbor",
    totalPaid: "Total Dibayar",
    pendingPayments: "Pembayaran Tertunda",
    overdue: "Jatuh Tempo",
    overdueDetails: "Detail Jatuh Tempo",
    totalOverdue: "Total Jatuh Tempo",
    overdueDays: "Lama Jatuh Tempo",
    currentVehicle: "Kendaraan Saat Ini",
    makeModel: "Merek/Model",
    plateNumber: "Nomor Plat",
    payNow: "Bayar Sekarang",
    viewVehicles: "Lihat Kendaraan",
    vehicleModels: "Model Kendaraan",
  },
};

export const getCurrencySymbol = (language: Language): string => {
  return language === "id" ? "Rp " : "$";
};

export const formatCurrency = (amount: number, language: Language): string => {
  const symbol = getCurrencySymbol(language);

  if (language === "id") {
    return `${symbol}${new Intl.NumberFormat("id-ID").format(amount)}`;
  } else {
    // Convert to USD (assuming 1 USD = 15,000 IDR for simplicity)
    const usdAmount = amount / 15000;
    return `${symbol}${new Intl.NumberFormat("en-US").format(usdAmount)}`;
  }
};

export const getTranslation = (
  key: TranslationKey,
  language: Language,
): string => {
  return translations[language][key];
};
