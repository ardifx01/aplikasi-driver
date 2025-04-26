import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Car, Key } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Define validation schema
const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(6, { message: "Password must be at least 6 characters" }),
    confirm_password: z
      .string()
      .min(6, { message: "Password must be at least 6 characters" }),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords don't match",
    path: ["confirm_password"],
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

const ResetPasswordForm = () => {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();
  const location = useLocation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirm_password: "",
    },
  });

  useEffect(() => {
    // Check if we have the access token in the URL
    const hashParams = new URLSearchParams(location.hash.substring(1));
    if (!hashParams.get("access_token")) {
      setError(
        "Invalid or expired reset link. Please request a new password reset.",
      );
    }
  }, [location]);

  const onSubmit = async (data: ResetPasswordFormValues) => {
    setLoading(true);
    setError(null);

    try {
      // Get the access token from the URL hash
      const hashParams = new URLSearchParams(location.hash.substring(1));
      const accessToken = hashParams.get("access_token");

      if (!accessToken) {
        throw new Error(
          "Invalid or expired reset link. Please request a new password reset.",
        );
      }

      // Update the user's password
      const { error } = await supabase.auth.updateUser(
        { password: data.password },
        { accessToken },
      );

      if (error) throw error;

      setSuccess(true);
      setTimeout(() => {
        navigate("/");
      }, 3000);
    } catch (err: any) {
      setError(err.message || "Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center p-4 transition-all duration-300"
      style={{
        backgroundImage:
          "url('https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=1200&q=80')",
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/70 to-blue-800/70 backdrop-blur-sm"></div>
      <div className="w-full max-w-md relative z-10">
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-4 bg-white/90 p-4 rounded-full shadow-lg">
            <Car className="h-12 w-12 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-white font-poppins">
            Reset Your Password
          </h1>
          <p className="text-blue-100 mt-2">Enter your new password below</p>
        </div>

        <Card className="w-full bg-white/95 shadow-xl border-0 backdrop-blur-sm transition-all duration-300 hover:shadow-2xl">
          <CardHeader className="pb-4">
            <h2 className="text-xl font-semibold">Create New Password</h2>
            <CardDescription>
              Your password must be at least 6 characters long
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="mb-4 bg-green-50 text-green-800 border-green-200">
                <AlertDescription>
                  Password reset successful! You will be redirected to the login
                  page.
                </AlertDescription>
              </Alert>
            )}

            {!success && (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="flex items-center gap-2">
                    <Key className="h-4 w-4" /> New Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    {...register("password")}
                  />
                  {errors.password && (
                    <p className="text-sm text-red-500">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="confirm-password"
                    className="flex items-center gap-2"
                  >
                    <Key className="h-4 w-4" /> Confirm Password
                  </Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="••••••••"
                    {...register("confirm_password")}
                  />
                  {errors.confirm_password && (
                    <p className="text-sm text-red-500">
                      {errors.confirm_password.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 transition-colors duration-300"
                  disabled={loading}
                >
                  {loading ? "Resetting Password..." : "Reset Password"}
                </Button>
              </form>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 pt-0">
            <div className="text-center text-sm text-gray-500">
              <p>
                Remember your password?{" "}
                <button
                  type="button"
                  className="text-blue-600 hover:underline font-medium"
                  onClick={() => navigate("/")}
                >
                  Back to Login
                </button>
              </p>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default ResetPasswordForm;
