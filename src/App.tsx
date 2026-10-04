import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Header } from './components/common/Header';
import { BottomNav } from './components/common/BottomNav';
import { UserLocation } from './types';
import { DEFAULT_HYDERABAD_LOCATION } from './services/database';

// Customer Pages
import { CustomerHome } from './pages/CustomerHome';
import { FindDriversPage } from './pages/FindDriversPage';
import { DriverProfilePage } from './pages/DriverProfilePage';
import { BookingsPage } from './pages/BookingsPage';
import { BookingDetailPage } from './pages/BookingDetailPage';
import { ServicesPage } from './pages/ServicesPage';

// Driver Pages
import { DriverLoginPage } from './pages/driver/DriverLoginPage';
import { DriverRegisterPage } from './pages/driver/DriverRegisterPage';
import { DriverDashboardPage } from './pages/driver/DriverDashboardPage';
import { DriverProfilePage as DriverPartnerProfilePage } from './pages/driver/DriverProfilePage';

// Admin Pages
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminPendingDriversPage } from './pages/admin/AdminPendingDriversPage';
import { AdminDriversPage } from './pages/admin/AdminDriversPage';
import { AdminBookingsPage } from './pages/admin/AdminBookingsPage';
import { AdminCustomersPage } from './pages/admin/AdminCustomersPage';
import { AdminServicesPage } from './pages/admin/AdminServicesPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';

// Legal & Compliance Pages
import { PrivacyPolicyPage } from './pages/legal/PrivacyPolicyPage';
import { TermsPage } from './pages/legal/TermsPage';
import { ContactPage } from './pages/legal/ContactPage';
import { AboutPage } from './pages/legal/AboutPage';
import { CancellationPolicyPage } from './pages/legal/CancellationPolicyPage';
import { DataDeletionPage } from './pages/legal/DataDeletionPage';

export const App: React.FC = () => {
  const [userLocation, setUserLocation] = useState<UserLocation>(DEFAULT_HYDERABAD_LOCATION);

  const requestGeolocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            address: 'Your GPS Location (Hyderabad)',
            area: 'Near You',
            city: 'Hyderabad',
            isFallback: false,
          });
        },
        (error) => {
          console.warn('Geolocation permission denied or error. Using Hyderabad default fallback.', error);
          setUserLocation(DEFAULT_HYDERABAD_LOCATION);
        },
        { timeout: 5000 }
      );
    } else {
      setUserLocation(DEFAULT_HYDERABAD_LOCATION);
    }
  };

  useEffect(() => {
    // Attempt automatic geolocation lookup on load
    requestGeolocation();
  }, []);

  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 font-sans">
        
        {/* Header */}
        <Header
          userLocation={userLocation}
          onRequestLocation={requestGeolocation}
        />

        {/* Main Route Content */}
        <main className="flex-1">
          <Routes>
            {/* Customer Routes */}
            <Route
              path="/"
              element={
                <CustomerHome
                  userLocation={userLocation}
                  onRequestLocation={requestGeolocation}
                />
              }
            />
            <Route
              path="/find-drivers"
              element={
                <FindDriversPage
                  userLocation={userLocation}
                  onRequestLocation={requestGeolocation}
                />
              }
            />
            <Route path="/drivers/:id" element={<DriverProfilePage />} />
            <Route path="/bookings" element={<BookingsPage />} />
            <Route path="/bookings/:id" element={<BookingDetailPage />} />
            <Route path="/services" element={<ServicesPage />} />

            {/* Legal & Play Store Pages */}
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/cancellation" element={<CancellationPolicyPage />} />
            <Route path="/data-deletion" element={<DataDeletionPage />} />

            {/* Driver Routes */}
            <Route path="/driver/login" element={<DriverLoginPage />} />
            <Route path="/driver/register" element={<DriverRegisterPage />} />
            <Route path="/driver/dashboard" element={<DriverDashboardPage />} />
            <Route path="/driver/requests" element={<DriverDashboardPage />} />
            <Route path="/driver/bookings" element={<DriverDashboardPage />} />
            <Route path="/driver/profile" element={<DriverPartnerProfilePage />} />

            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/admin/drivers/pending" element={<AdminPendingDriversPage />} />
            <Route path="/admin/drivers" element={<AdminDriversPage />} />
            <Route path="/admin/bookings" element={<AdminBookingsPage />} />
            <Route path="/admin/customers" element={<AdminCustomersPage />} />
            <Route path="/admin/services" element={<AdminServicesPage />} />
            <Route path="/admin/settings" element={<AdminSettingsPage />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Mobile Bottom Navigation */}
        <BottomNav />
      </div>
    </BrowserRouter>
  );
};

export default App;
