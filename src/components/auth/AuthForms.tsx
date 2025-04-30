import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Car, Mail, Phone, User, Key } from "lucide-react";

// Define validation schemas
const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" }),
});

const registerSchema = z
  .object({
    name: z.string().min(2, { message: "Name must be at least 2 characters" }),
    email: z.string().email({ message: "Please enter a valid email address" }),
    phone_number: z
      .string()
      .min(10, { message: "Please enter a valid phone number" }),
    licenseNumber: z
      .string()
      .min(5, { message: "Please enter a valid license number" }),
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

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const AuthForms = (props) => {
  const [activeTab, setActiveTab] = useState<string>("login");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [resetEmailSent, setResetEmailSent] = useState<boolean>(false);
  const navigate = useNavigate();

  // Login form
  const {
    register: registerLogin,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Register form
  const {
    register: registerSignup,
    handleSubmit: handleRegisterSubmit,
    formState: { errors: registerErrors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone_number: "",
      licenseNumber: "",
      password: "",
      confirm_password: "",
    },
  });

  const handleForgotPassword = async () => {
    const email = document.getElementById("email") as HTMLInputElement;

    if (!email || !email.value || !email.value.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.value, {
        redirectTo: window.location.origin + "/reset-password",
      });

      if (error) throw error;

      setResetEmailSent(true);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to send reset email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const onLogin = async (data: LoginFormValues) => {
    setLoading(true);
    setError(null);
    try {
      const { data: user, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) throw error;

      // Set a flag in session storage to indicate coming from login
      sessionStorage.setItem("fromLogin", "true");
      setLoading(false);
      // Pass the authenticated user back to the parent component if onAuthenticated prop exists
      if (props.onAuthenticated) {
        props.onAuthenticated(user.user);
      }
      // Redirect to home page instead of vehicle groups to see the stat cards
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Failed to login. Please try again.");
      setLoading(false);
    }
  };

  const onRegister = async (data: RegisterFormValues) => {
    setLoading(true);
    setError(null);
    try {
      // Create user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            role: "driver", // Set default role to driver
          },
        },
      });

      if (authError) throw authError;

      // Then store additional driver data
      const { error: profileError } = await supabase.from("drivers").insert([
        {
          id: authData.user?.id,
          name: data.name,
          email: data.email,
          phone_number: data.phone_number,
          license_number: data.licenseNumber,
          role: "driver",
        },
      ]);

      if (profileError) throw profileError;

      // Set a flag in session storage to indicate coming from login
      sessionStorage.setItem("fromLogin", "true");
      setLoading(false);
      // Pass the authenticated user back to the parent component if onAuthenticated prop exists
      if (props.onAuthenticated) {
        props.onAuthenticated(authData.user);
      }
      // Navigate to home page instead of vehicle groups to see the stat cards
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Failed to register. Please try again.");
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
            Driver Booking Platform
          </h1>
          <p className="text-blue-100 mt-2">
            Book and manage your vehicle rentals
          </p>
        </div>

        <Card className="w-full bg-white/95 shadow-xl border-0 backdrop-blur-sm transition-all duration-300 hover:shadow-2xl">
          <CardHeader className="pb-4">
            <h2 className="text-xl font-semibold">Account Access</h2>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {resetEmailSent && (
              <Alert className="mb-4 bg-green-50 text-green-800 border-green-200">
                <AlertDescription>
                  Password reset email sent. Please check your inbox.
                </AlertDescription>
              </Alert>
            )}

            <Tabs
              defaultValue={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              {/*<TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>*/}

              <TabsContent value="login" className="mt-0">
                <form
                  onSubmit={handleLoginSubmit(onLogin)}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" /> Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@example.com"
                      {...registerLogin("email")}
                    />
                    {loginErrors.email && (
                      <p className="text-sm text-red-500">
                        {loginErrors.email.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="password"
                      className="flex items-center gap-2"
                    >
                      <Key className="h-4 w-4" /> Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      {...registerLogin("password")}
                    />
                    {loginErrors.password && (
                      <p className="text-sm text-red-500">
                        {loginErrors.password.message}
                      </p>
                    )}
                    <div className="text-right">
                      <button
                        type="button"
                        className="text-sm text-blue-600 hover:underline"
                        onClick={() => handleForgotPassword()}
                      >
                        Forgot Password?
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 transition-colors duration-300"
                    disabled={loading}
                  >
                    {loading ? "Logging in..." : "Login"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register" className="mt-0">
                <form
                  onSubmit={handleRegisterSubmit(onRegister)}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="name" className="flex items-center gap-2">
                      <User className="h-4 w-4" /> Full Name
                    </Label>
                    <Input
                      id="name"
                      placeholder="John Doe"
                      {...registerSignup("name")}
                    />
                    {registerErrors.name && (
                      <p className="text-sm text-red-500">
                        {registerErrors.name.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="register-email"
                      className="flex items-center gap-2"
                    >
                      <Mail className="h-4 w-4" /> Email
                    </Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="your.email@example.com"
                      {...registerSignup("email")}
                    />
                    {registerErrors.email && (
                      <p className="text-sm text-red-500">
                        {registerErrors.email.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-2">
                      <Phone className="h-4 w-4" /> Phone Number
                    </Label>
                    <Input
                      id="phone"
                      placeholder="+1234567890"
                      {...registerSignup("phone_number")}
                    />
                    {registerErrors.phone_number && (
                      <p className="text-sm text-red-500">
                        {registerErrors.phone_number.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="license"
                      className="flex items-center gap-2"
                    >
                      <Car className="h-4 w-4" /> License Number
                    </Label>
                    <Input
                      id="license"
                      placeholder="DL12345678"
                      {...registerSignup("licenseNumber")}
                    />
                    {registerErrors.licenseNumber && (
                      <p className="text-sm text-red-500">
                        {registerErrors.licenseNumber.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="register-password"
                      className="flex items-center gap-2"
                    >
                      <Key className="h-4 w-4" /> Password
                    </Label>
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="••••••••"
                      {...registerSignup("password")}
                    />
                    {registerErrors.password && (
                      <p className="text-sm text-red-500">
                        {registerErrors.password.message}
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
                      {...registerSignup("confirm_password")}
                    />
                    {registerErrors.confirm_password && (
                      <p className="text-sm text-red-500">
                        {registerErrors.confirm_password.message}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 transition-colors duration-300"
                    disabled={loading}
                  >
                    {loading ? "Registering..." : "Register"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 pt-0">
            {/*   <div className="text-center text-sm text-gray-500">
              {activeTab === "login" ? (
                <p>
                  Don't have an account?{" "}
                  <button
                    type="button"
                    className="text-blue-600 hover:underline font-medium"
                    onClick={() => setActiveTab("register")}
                  >
                    Register
                  </button>
                </p>
              ) : (
                <p>
                  Already have an account?{" "}
                  <button
                    type="button"
                    className="text-blue-600 hover:underline font-medium"
                    onClick={() => setActiveTab("login")}
                  >
                    Login
                  </button>
                </p>
              )}
            </div>*/}
            {props.showSignOut && (
              <Button
                type="button"
                variant="outline"
                className="mt-4"
                onClick={handleSignOut}
              >
                Sign Out
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default AuthForms;
