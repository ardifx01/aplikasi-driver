import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";
import { motion } from "framer-motion";
import { Car, Globe, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Import supabase client from lib
import { supabase } from "@/lib/supabase";

interface VehicleGroup {
  make: string;
  model: string;
  count: number;
  image: string;
  plateNumbers?: string[];
  licenseNumbers?: string[];
  type: string;
}

const VehicleGroupListing = () => {
  const navigate = useNavigate();
  const [vehicleGroups, setVehicleGroups] = useState<VehicleGroup[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch vehicle groups from Supabase
  useEffect(() => {
    const fetchVehicleGroups = async () => {
      try {
        setLoading(true);
        // Get vehicles grouped by model including plate numbers
        const { data, error } = await supabase
          .from("vehicles")
          .select("make, model, image, plate_number, type")
          .eq("status", "available");

        if (error) throw error;

        if (data) {
          console.log("All available vehicles from Supabase:", data);
          // Group vehicles by model and count them
          const groupsByModel: Record<string, VehicleGroup> = {};

          data.forEach((vehicle) => {
            if (!vehicle.model) return; // Skip if model is undefined

            if (!groupsByModel[vehicle.model]) {
              groupsByModel[vehicle.model] = {
                model: vehicle.model,
                make: vehicle.make || "",
                count: 0,
                image: vehicle.image || "", // Use the first image for this model
                plateNumbers: [],
                type: vehicle.type || "",
              };
            }

            groupsByModel[vehicle.model].count += 1;

            // Add plate number to the array if it exists
            if (vehicle.plate_number) {
              groupsByModel[vehicle.model].plateNumbers.push(
                vehicle.plate_number,
              );
            }
          });

          // Convert the object to an array of vehicle groups
          const groupsArray = Object.values(groupsByModel);
          console.log("Grouped vehicles:", groupsArray);
          setVehicleGroups(groupsArray);
        }
      } catch (error) {
        console.error("Error fetching vehicle groups:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicleGroups();
  }, []);

  // Handle group selection
  const handleGroupSelect = (vehicleModel: string, make: string) => {
    navigate(
      `/booking?model=${encodeURIComponent(vehicleModel)}&make=${encodeURIComponent(make)}&type=${encodeURIComponent(type)}`,
    );
  };

  // Navigate back to previous page
  const handleGoBack = () => {
    navigate(-1);
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href =
        "https://distracted-archimedes8-kleh7.view-3.tempo-dev.app/";
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 bg-gray-50 min-h-screen">
      {/*       <div className="mb-4">
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
          Back
        </Button>
      </div>*/}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Model Kendaraan</h1>
          <p className="text-gray-600 mt-2">
            Pilih model kendaraan untuk melihat kendaraan yang tersedia
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            onClick={() => navigate("/booking-history")}
            className="mt-4 md:mt-0 flex items-center gap-2 bg-primary hover:bg-primary/90 transition-colors"
          >
            <Car className="h-4 w-4" />
            Lihat Semua Kendaraan
          </Button>
          {/*   <Button
            onClick={handleLogout}
            variant="outline"
            className="mt-4 md:mt-0 flex items-center gap-2 text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button> */}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="flex justify-center mb-6">
        <div className="grid grid-cols-3 gap-3 max-w-2xl">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-24">
            <CardHeader className="pb-0 pt-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Total Kendaraan Tersedia
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-2 pt-1">
              <div className="flex items-center">
                <Car className="mr-1 h-3 w-3 text-green-500" />
                <span className="text-lg font-bold">
                  {vehicleGroups.reduce(
                    (total, group) => total + group.count,
                    0,
                  )}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-24">
            <CardHeader className="pb-0 pt-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Model Kendaraan
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-2 pt-1">
              <div className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-1 h-3 w-3 text-blue-500"
                >
                  <rect width="18" height="18" x="3" y="3" rx="2" />
                  <path d="M3 9h18" />
                  <path d="M9 21V9" />
                </svg>
                <span className="text-lg font-bold">
                  {vehicleGroups.length}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-24">
            <CardHeader className="pb-0 pt-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Rata-rata Per Model
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-2 pt-1">
              <div className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-1 h-3 w-3 text-yellow-500"
                >
                  <path d="M3 3v18h18" />
                  <path d="m19 9-5 5-4-4-3 3" />
                </svg>
                <span className="text-lg font-bold">
                  {vehicleGroups.length > 0
                    ? Math.round(
                        vehicleGroups.reduce(
                          (total, group) => total + group.count,
                          0,
                        ) / vehicleGroups.length,
                      )
                    : 0}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {vehicleGroups.map((group) => (
            <motion.div
              key={group.model}
              whileHover={{ y: -5 }}
              transition={{ duration: 0.2 }}
            >
              <Card
                className="overflow-hidden h-full cursor-pointer transition-all hover:shadow-lg"
                onClick={() => handleGroupSelect(group.model, group.make)}
              >
                <div className="h-48 overflow-hidden">
                  <img
                    src={group.image}
                    alt={group.model}
                    className="w-full h-full object-cover transition-transform hover:scale-105"
                  />
                </div>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{group.model}</CardTitle>
                    </div>
                    <div className="flex flex-col items-end">
                      <Badge variant="secondary" className="mb-1">
                        <Car className="h-3 w-3 mr-1" />
                        {group.count} tersedia
                      </Badge>
                      {group.plateNumbers && group.plateNumbers.length > 0 && (
                        <div className="text-xs text-muted-foreground mt-1">
                          <span className="font-medium">Plate:</span>{" "}
                          {group.plateNumbers.slice(0, 2).join(", ")}
                          {group.plateNumbers.length > 2 && "..."}
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VehicleGroupListing;
