import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  Car,
  Plus,
  Minus,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import { useLanguage } from "@/lib/languageContext";

interface Transaction {
  id: string;
  type: "topup" | "payment" | "saldo_awal" | "saldo_akhir";
  description: string;
  amount: number;
  balance_before?: number;
  balance_after?: number;
  date: Date;
  status: "completed" | "pending" | "failed";
  reference_no?: string;
  booking_id?: string;
  vehicle_name?: string;
}

interface TransactionHistoryProps {
  userId?: string;
}

const TransactionHistory = ({ userId }: TransactionHistoryProps = {}) => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [currentBalance, setCurrentBalance] = useState(0);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
  const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get current session first
        const { data: sessionData, error: sessionError } =
          await supabase.auth.getSession();

        if (sessionError) {
          console.error("Session error:", sessionError);
          setError("Authentication error. Please login again.");
          setLoading(false);
          return;
        }

        let currentUserId = userId;

        // Prioritize session user ID over passed userId prop
        if (sessionData?.session?.user?.id) {
          currentUserId = sessionData.session.user.id;
        }

        if (!currentUserId) {
          console.error("No user ID available for fetching transactions");
          setError(
            "No user authenticated. Please login to view transaction history.",
          );
          setLoading(false);
          return;
        }

        console.log(
          "TransactionHistory - Fetching for user ID:",
          currentUserId,
        );

        // Fetch current balance from drivers table
        const { data: driverData } = await supabase
          .from("drivers")
          .select("saldo")
          .eq("id", currentUserId)
          .maybeSingle();

        if (driverData) {
          setCurrentBalance(Number(driverData.saldo) || 0);
        }

        const allTransactions: Transaction[] = [];

        // 1. Fetch topup transactions
        const { data: topupData, error: topupError } = await supabase
          .from("topup_requests")
          .select("*")
          .eq("user_id", currentUserId)
          .order("created_at", { ascending: false });

        if (topupError) {
          console.error("Error fetching topup data:", topupError);
        } else if (topupData) {
          console.log(
            `Found ${topupData.length} topup transactions for user ${currentUserId}`,
          );
          topupData.forEach((topup) => {
            allTransactions.push({
              id: `topup-${topup.id}`,
              type: "topup",
              description: `Top-up Saldo - ${topup.method || "Bank Transfer"}`,
              amount: topup.amount || 0,
              date: new Date(topup.created_at || new Date()),
              status:
                topup.status === "verified"
                  ? "completed"
                  : topup.status === "rejected"
                    ? "failed"
                    : "pending",
              reference_no: topup.reference_no || `topup-${topup.id}`,
            });
          });
        }

        // 2. Skip fetching payment transactions from bookings to avoid duplicates
        // Payment transactions will be handled by histori_transaksi table only
        console.log(
          "Skipping bookings data to prevent duplicate payment transactions",
        );

        // 3. Fetch transaction history from histori_transaksi table
        const { data: historiData, error: historiError } = await supabase
          .from("histori_transaksi")
          .select("*")
          .eq("user_id", currentUserId) // ✅ filter user
          .not("user_id", "is", null) // ✅ pastikan user_id ada
          .order("trans_date", { ascending: true });

        if (historiError) {
          console.error("Error fetching histori_transaksi:", historiError);
        } else if (historiData) {
          console.log(
            `Found ${historiData.length} histori_transaksi records for user ${currentUserId}`,
          );

          historiData.forEach((histori) => {
            // ✅ Determine transaction type based on description and amount
            let type: "topup" | "payment" = "payment";
            let transactionAmount = Number(histori.nominal) || 0;

            if (
              histori.keterangan?.toLowerCase().includes("topup") ||
              histori.keterangan?.toLowerCase().includes("top-up") ||
              histori.keterangan
                ?.toLowerCase()
                .includes("verified from request")
            ) {
              type = "topup";
              // For topup, amount should be positive
              transactionAmount = Math.abs(transactionAmount);
            } else if (
              histori.keterangan?.toLowerCase().includes("pembayaran") ||
              histori.keterangan?.toLowerCase().includes("sewa") ||
              histori.keterangan?.toLowerCase().includes("payment")
            ) {
              type = "payment";
              // For payment, amount should be negative (deduction from balance)
              transactionAmount = -Math.abs(transactionAmount);
            } else {
              // Fallback: check the actual nominal value
              if (
                histori.nominal > 0 &&
                !histori.keterangan?.toLowerCase().includes("pembayaran")
              ) {
                type = "topup";
                transactionAmount = Math.abs(transactionAmount);
              } else {
                type = "payment";
                transactionAmount = -Math.abs(transactionAmount);
              }
            }

            // ✅ Calculate balance_before correctly
            const balanceAfter = Number(histori.saldo_akhir) || 0;
            const balanceBefore =
              type === "topup"
                ? balanceAfter - Math.abs(transactionAmount)
                : balanceAfter + Math.abs(transactionAmount);

            allTransactions.push({
              id: `histori-${histori.id}`,
              type,
              description: histori.keterangan || "Transaksi",
              amount: transactionAmount,
              balance_before: balanceBefore,
              balance_after: balanceAfter,
              date: new Date(histori.trans_date || new Date()),
              status: "completed",
              reference_no: histori.kode_booking || histori.id,
            });
          });
        }

        // ✅ Enhanced deduplication logic to prevent duplicate transactions
        const uniqueTransactions = new Map<string, Transaction>();

        allTransactions.forEach((transaction) => {
          // Create a more specific unique key based on transaction details
          let uniqueKey = transaction.reference_no || transaction.id;

          // For payment transactions, create a composite key to avoid duplicates
          if (transaction.type === "payment" && transaction.booking_id) {
            uniqueKey = `payment-${transaction.booking_id}-${Math.abs(transaction.amount)}`;
          }

          // For topup transactions, use the reference number or amount+date combination
          if (transaction.type === "topup") {
            const dateStr = transaction.date.toISOString().split("T")[0];
            uniqueKey =
              transaction.reference_no ||
              `topup-${transaction.amount}-${dateStr}`;
          }

          // Only add if not already exists, or if this version has more complete data
          if (
            !uniqueTransactions.has(uniqueKey) ||
            (transaction.balance_after !== undefined &&
              uniqueTransactions.get(uniqueKey)?.balance_after === undefined)
          ) {
            uniqueTransactions.set(uniqueKey, transaction);
          }
        });

        // ✅ Convert back to array and sort by date (oldest first)
        const deduplicatedTransactions = Array.from(
          uniqueTransactions.values(),
        );
        deduplicatedTransactions.sort(
          (a, b) => a.date.getTime() - b.date.getTime(),
        );

        // ✅ Final verification - log summary of transactions by type
        const transactionSummary = {
          topup: deduplicatedTransactions.filter((t) => t.type === "topup")
            .length,
          payment: deduplicatedTransactions.filter((t) => t.type === "payment")
            .length,
          total: deduplicatedTransactions.length,
        };

        console.log(
          `TransactionHistory - Final summary for user ${currentUserId}:`,
          transactionSummary,
        );

        setTransactions(deduplicatedTransactions);
        console.log(
          "TransactionHistory - Processed transactions:",
          deduplicatedTransactions.length,
        );
      } catch (err) {
        console.error("TransactionHistory - Error fetching transactions:", err);
        setError("Failed to fetch transactions. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [userId]);

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      transaction.description
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      transaction.reference_no
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      transaction.booking_id?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      activeFilter === "all" ||
      transaction.type === activeFilter ||
      (activeFilter === "income" && transaction.amount > 0) ||
      (activeFilter === "expense" && transaction.amount < 0);

    return matchesSearch && matchesFilter;
  });

  const getTransactionIcon = (type: string, amount: number) => {
    if (type === "topup" || amount > 0) {
      return <Plus className="h-4 w-4 text-green-500" />;
    } else if (type === "payment" || amount < 0) {
      return <Minus className="h-4 w-4 text-red-500" />;
    } else {
      return <Wallet className="h-4 w-4 text-blue-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Selesai
          </Badge>
        );
      case "pending":
        return (
          <Badge
            variant="outline"
            className="border-yellow-500 text-yellow-700"
          >
            Pending
          </Badge>
        );
      case "failed":
        return <Badge variant="destructive">Gagal</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const totalIncome = transactions
    .filter((t) => t.amount > 0 && t.status === "completed")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.amount < 0 && t.status === "completed")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  return (
    <div className="bg-background p-6 rounded-lg w-full max-w-7xl mx-auto">
      {loading && (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading transaction history...</span>
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
            Kembali
          </Button>

          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight mb-2">
              Riwayat Transaksi
            </h1>
            <p className="text-muted-foreground">
              Lihat dan kelola riwayat semua transaksi Anda
            </p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Saldo Saat Ini
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Wallet className="mr-2 h-4 w-4 text-primary" />
                  <span className="text-2xl font-bold">
                    Rp {currentBalance.toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/*  <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Pemasukan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <TrendingUp className="mr-2 h-4 w-4 text-green-500" />
                  <span className="text-2xl font-bold text-green-600">
                    Rp {totalIncome.toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>*/}

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Pengeluaran
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <TrendingDown className="mr-2 h-4 w-4 text-red-500" />
                  <span className="text-2xl font-bold text-red-600">
                    Rp {totalExpense.toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Transaksi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <DollarSign className="mr-2 h-4 w-4 text-blue-500" />
                  <span className="text-2xl font-bold">
                    {transactions.length} Transaksi
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Cari transaksi..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={activeFilter === "all" ? "default" : "outline"}
                onClick={() => setActiveFilter("all")}
                size="sm"
              >
                Semua
              </Button>
              <Button
                variant={activeFilter === "income" ? "default" : "outline"}
                onClick={() => setActiveFilter("income")}
                size="sm"
              >
                Pemasukan
              </Button>
              <Button
                variant={activeFilter === "expense" ? "default" : "outline"}
                onClick={() => setActiveFilter("expense")}
                size="sm"
              >
                Pengeluaran
              </Button>
              <Button
                variant={activeFilter === "topup" ? "default" : "outline"}
                onClick={() => setActiveFilter("topup")}
                size="sm"
              >
                Top-up
              </Button>
              <Button
                variant={activeFilter === "payment" ? "default" : "outline"}
                onClick={() => setActiveFilter("payment")}
                size="sm"
              >
                Pembayaran
              </Button>
            </div>
          </div>

          {/* Transaction Table */}
          <Card>
            <CardHeader>
              <CardTitle>Riwayat Transaksi</CardTitle>
              <CardDescription>
                Menampilkan {filteredTransactions.length} dari{" "}
                {transactions.length} transaksi
                {searchQuery && (
                  <span className="ml-2 font-medium">
                    - Hasil pencarian untuk "{searchQuery}"
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredTransactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery ? (
                    <p>
                      Tidak ada transaksi yang ditemukan untuk "{searchQuery}"
                    </p>
                  ) : (
                    <p>Belum ada riwayat transaksi</p>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Deskripsi</TableHead>
                        <TableHead>Jenis</TableHead>
                        <TableHead className="text-right">Jumlah</TableHead>
                        <TableHead className="text-right">
                          Saldo Sebelum
                        </TableHead>
                        <TableHead className="text-right">
                          Saldo Sesudah
                        </TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Referensi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTransactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell className="font-medium">
                            {format(transaction.date, "dd/MM/yyyy HH:mm")}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getTransactionIcon(
                                transaction.type,
                                transaction.amount,
                              )}
                              <div>
                                <p className="font-medium">
                                  {transaction.description}
                                </p>
                                {transaction.vehicle_name && (
                                  <p className="text-sm text-muted-foreground">
                                    {transaction.vehicle_name}
                                  </p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {transaction.type === "topup"
                                ? "Top-up"
                                : transaction.type === "payment"
                                  ? "Pembayaran"
                                  : transaction.type === "saldo_awal"
                                    ? "Saldo Awal"
                                    : transaction.type === "saldo_akhir"
                                      ? "Saldo Akhir"
                                      : "Lainnya"}
                            </Badge>
                          </TableCell>
                          <TableCell
                            className={`text-right font-medium ${
                              transaction.amount >= 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {transaction.amount >= 0 ? "+" : ""}Rp{" "}
                            {transaction.amount.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {transaction.balance_before !== undefined
                              ? `Rp ${transaction.balance_before.toLocaleString()}`
                              : "-"}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {transaction.balance_after !== undefined
                              ? `Rp ${transaction.balance_after.toLocaleString()}`
                              : "-"}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(transaction.status)}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {transaction.reference_no ||
                              transaction.booking_id ||
                              "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default TransactionHistory;
