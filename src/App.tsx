import { Suspense } from "react";
import { useRoutes, Routes, Route } from "react-router-dom";
import Home from "./components/home";
import VehicleBooking from "./components/booking/VehicleBooking";
import VehicleGroupListing from "./components/booking/VehicleGroupListing";
import PaymentTracking from "./components/payments/PaymentTracking";
import PaymentForm from "./components/payments/PaymentForm";
import BookingHistory from "./components/dashboard/BookingHistory";
import ResetPasswordForm from "./components/auth/ResetPasswordForm";
import ProfilePage from "./components/profile/ProfilePage";
import routes from "tempo-routes";

function App() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      {/* Tempo routes */}
      {import.meta.env.VITE_TEMPO === "true" && useRoutes(routes)}

      {/* Application routes */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/vehicle-groups" element={<VehicleGroupListing />} />
        <Route path="/booking" element={<VehicleBooking />} />
        <Route path="/payments" element={<PaymentTracking />} />
        <Route path="/payment/:bookingId" element={<PaymentForm />} />
        <Route path="/booking-history" element={<BookingHistory />} />
        <Route path="/reset-password" element={<ResetPasswordForm />} />
        <Route path="/profile" element={<ProfilePage />} />

        {/* Tempo storybook route - must be before any catch-all routes */}
        {import.meta.env.VITE_TEMPO === "true" && (
          <Route path="/tempobook/*" element={<></>} />
        )}

        {/* Catch-all route to handle 404s */}
        <Route
          path="*"
          element={
            <div className="p-8">
              <h1 className="text-2xl font-bold">Page Not Found</h1>
            </div>
          }
        />
      </Routes>
    </Suspense>
  );
}

export default App;
