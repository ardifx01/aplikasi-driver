import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Clock,
  DollarSign,
  Filter,
  Search,
  RefreshCw,
  FileText,
  Calendar,
  CreditCard,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";

interface TopupRequest {
  id: string;
  user_id: string;
  amount: number;
  bank_name: string;
  sender_bank: string;
  sender_account: string;
  sender_name: string;
  destination_account: string;
  proof_url?: string;
  reference_no: string;
  method: string;
  status: "pending" | "verified" | "rejected";
  request_by_role: string;
  created_at: string;
  updated_at?: string;
}

interface TopupHistoryProps {
  userId?: string;
}

const TopupHistory = ({ userId }: TopupHistoryProps = {}) => {
  const navigate = useNavigate();
  const [topupRequests, setTopupRequests] = useState<TopupRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [refreshing, setRefreshing] = useState(false);

  const fetchTopupHistory = async () => {
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
        console.error("No user ID available for fetching topup history");
        setError("No user ID available");
        setLoading(false);
        return;
      }

      console.log(
        "TopupHistory - Fetching topup requests for user ID:",
        currentUserId,
      );
      console.log(
        "TopupHistory - Session user ID:",
        sessionData?.session?.user?.id,
      );
      console.log("TopupHistory - Prop user ID:", userId);

      // Try multiple approaches to find topup requests
      let topupData = null;
      let topupError = null;

      // First try with the current user ID
      const { data: directTopups, error: directError } = await supabase
        .from("topup_requests")
        .select("*")
        .eq("user_id", currentUserId)
        .order("created_at", { ascending: false });

      console.log(
        "TopupHistory - Direct topup query result:",
        directTopups?.length || 0,
      );
      console.log("TopupHistory - Direct topup error:", directError);

      if (directTopups && directTopups.length > 0) {
        topupData = directTopups;
      } else {
        // If no topup requests found with user_id, try with email lookup
        if (sessionData?.session?.user?.email) {
          const userEmail = sessionData.session.user.email;
          console.log(
            "TopupHistory - Trying to find user by email:",
            userEmail,
          );

          // Check if there's a user record with this email that has topup requests
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
              "TopupHistory - Found user by email with ID:",
              emailUserId,
            );
            const { data: emailTopups, error: emailError } = await supabase
              .from("topup_requests")
              .select("*")
              .eq("user_id", emailUserId)
              .order("created_at", { ascending: false });

            console.log(
              "TopupHistory - Email topup query result:",
              emailTopups?.length || 0,
            );
            if (emailTopups && emailTopups.length > 0) {
              topupData = emailTopups;
            }
          }
        }
      }

      if (topupData && topupData.length > 0) {
        console.log(
          "TopupHistory - Successfully fetched topup requests:",
          topupData.length,
        );
        setTopupRequests(topupData);
      } else {
        console.log("TopupHistory - No topup requests found for user");
        setTopupRequests([]);
      }
    } catch (err) {
      console.error("TopupHistory - Error fetching topup requests:", err);
      setError("Failed to fetch topup history. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTopupHistory();
    setRefreshing(false);
    toast({
      title: "Refreshed",
      description: "Topup history has been refreshed.",
    });
  };

  useEffect(() => {
    fetchTopupHistory();
  }, [userId]);

  const filteredTopupRequests = topupRequests.filter((request) => {
    const matchesSearch =
      request.reference_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.sender_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.sender_bank.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || request.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge
            variant="outline"
            className="bg-yellow-50 text-yellow-800 border-yellow-200"
          >
            Pending
          </Badge>
        );
      case "verified":
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-800 border-green-200"
          >
            Verified
          </Badge>
        );
      case "rejected":
        return (
          <Badge
            variant="outline"
            className="bg-red-50 text-red-800 border-red-200"
          >
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getBankAccountInfo = (destinationAccount: string) => {
    switch (destinationAccount) {
      case "1640006707220":
        return "Mandiri - 1640006707220";
      case "5440542222":
        return "BCA - 5440542222";
      default:
        return destinationAccount;
    }
  };

  const totalRequests = topupRequests.length;
  const pendingRequests = topupRequests.filter(
    (r) => r.status === "pending",
  ).length;
  const verifiedRequests = topupRequests.filter(
    (r) => r.status === "verified",
  ).length;
  const totalAmount = topupRequests
    .filter((r) => r.status === "verified")
    .reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="bg-background p-6 rounded-lg w-full max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Riwayat Topup
        </h1>
        <p className="text-muted-foreground">
          Riwayat permintaan top-up saldo Anda
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Permintaan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <FileText className="mr-2 h-4 w-4 text-blue-500" />
              <span className="text-2xl font-bold">{totalRequests}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Clock className="mr-2 h-4 w-4 text-yellow-500" />
              <span className="text-2xl font-bold">{pendingRequests}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Disetujui
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <CreditCard className="mr-2 h-4 w-4 text-green-500" />
              <span className="text-2xl font-bold">{verifiedRequests}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Disetujui
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <DollarSign className="mr-2 h-4 w-4 text-green-500" />
              <span className="text-2xl font-bold">
                Rp {totalAmount.toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Cari berdasarkan referensi, nama, atau bank..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          <span className="ml-2">Loading topup history...</span>
        </div>
      )}

      {/* Error State */}
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

      {/* Content */}
      {!loading && !error && (
        <Card>
          <CardHeader>
            <CardTitle>Riwayat Permintaan Topup</CardTitle>
            <CardDescription>
              Daftar semua permintaan top-up yang pernah Anda ajukan
              {searchQuery && (
                <span className="ml-2 font-medium">
                  - Menampilkan hasil untuk "{searchQuery}"
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredTopupRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery || statusFilter !== "all" ? (
                  <p>Tidak ada permintaan topup yang sesuai dengan filter</p>
                ) : (
                  <p>Belum ada riwayat permintaan topup</p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTopupRequests.map((request) => (
                  <div
                    key={request.id}
                    className="border rounded-lg p-6 hover:bg-muted/20 transition-colors bg-white shadow-sm"
                  >
                    <div className="flex flex-col space-y-4">
                      {/* Header with Reference and Status */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-lg text-gray-900">
                            {request.reference_no}
                          </h3>
                          {getStatusBadge(request.status)}
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-2xl text-primary">
                            Rp {request.amount.toLocaleString()}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {request.method === "bank_transfer"
                              ? "Transfer Bank"
                              : request.method}
                          </p>
                        </div>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Left Column */}
                        <div className="space-y-3">
                          <div className="flex items-start gap-2">
                            <DollarSign className="h-4 w-4 text-green-600 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-gray-700">
                                Jumlah Top-up
                              </p>
                              <p className="text-lg font-semibold text-green-600">
                                Rp {request.amount.toLocaleString()}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-2">
                            <Calendar className="h-4 w-4 text-blue-600 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-gray-700">
                                Tanggal Permintaan
                              </p>
                              <p className="text-sm text-gray-600">
                                {format(
                                  new Date(request.created_at),
                                  "dd MMMM yyyy, HH:mm",
                                )}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-3">
                          <div className="flex items-start gap-2">
                            <CreditCard className="h-4 w-4 text-purple-600 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-gray-700">
                                Bank Pengirim
                              </p>
                              <p className="text-sm text-gray-600">
                                {request.sender_bank}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {request.sender_account} - {request.sender_name}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-2">
                            <CreditCard className="h-4 w-4 text-orange-600 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-gray-700">
                                Bank Penerima
                              </p>
                              <p className="text-sm text-gray-600">
                                {getBankAccountInfo(
                                  request.destination_account,
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action Button */}
                      {request.proof_url && (
                        <div className="flex justify-end pt-2 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              window.open(request.proof_url, "_blank")
                            }
                            className="flex items-center gap-2"
                          >
                            <FileText className="h-4 w-4" />
                            Lihat Bukti Transfer
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TopupHistory;
