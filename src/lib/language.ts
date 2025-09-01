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
  | "vehicleModels"
  | "topupRequest"
  | "topupAmount"
  | "bankName"
  | "accountNumber"
  | "accountHolderName"
  | "submitTopupRequest"
  | "selectBank"
  | "enterAmount"
  | "enterAccountNumber"
  | "enterAccountHolderName"
  | "topupRequestSubmitted"
  | "topupRequestSuccess"
  | "bankPenerima"
  | "selectBankPenerima"
  | "uploadProofTransfer"
  | "selectFile"
  | "noFileSelected"
  | "topupHistory";

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
    airportTransfer: "Airport Transfer",
    topupRequest: "Top-up Request",
    topupAmount: "Top-up Amount",
    bankName: "Bank Name",
    accountNumber: "Account Number",
    accountHolderName: "Account Holder Name",
    submitTopupRequest: "Submit Top-up Request",
    selectBank: "Select Bank",
    enterAmount: "Enter amount",
    enterAccountNumber: "Enter account number",
    enterAccountHolderName: "Enter account holder name",
    topupRequestSubmitted: "Top-up request submitted successfully",
    topupRequestSuccess:
      "Your top-up request has been submitted and will be processed within 1-2 business days.",
    bankPenerima: "Receiving Bank",
    selectBankPenerima: "Select receiving bank",
    uploadProofTransfer: "Upload Transfer Proof",
    selectFile: "Select file",
    noFileSelected: "No file selected",
    topupHistory: "Topup History",
  },
  id: {
    dashboard: "Portal Pengemudi",
    bookVehicle: "Pesan Kendaraan",
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
    airportTransfer: "Airport Transfer",
    topupRequest: "Permintaan Top-up",
    topupAmount: "Jumlah Top-up",
    bankName: "Nama Bank",
    accountNumber: "Nomor Rekening",
    accountHolderName: "Nama Pemegang Rekening",
    submitTopupRequest: "Kirim Permintaan Top-up",
    selectBank: "Pilih Bank",
    enterAmount: "Masukkan jumlah",
    enterAccountNumber: "Masukkan nomor rekening",
    enterAccountHolderName: "Masukkan nama pemegang rekening",
    topupRequestSubmitted: "Permintaan top-up berhasil dikirim",
    topupRequestSuccess:
      "Permintaan top-up Anda telah dikirim dan akan diproses dalam 1-2 hari kerja.",
    bankPenerima: "Bank Penerima",
    selectBankPenerima: "Pilih bank penerima",
    uploadProofTransfer: "Upload Bukti Transfer",
    selectFile: "Pilih file",
    noFileSelected: "Tidak ada file dipilih",
    topupHistory: "Riwayat Topup",
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
