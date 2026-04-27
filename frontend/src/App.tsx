import { Suspense, lazy } from 'react';
import { useSessionTimeout } from '@/hooks/useSessionTimeout';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Layout & Common Components
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import Loader from '@/components/common/Loader';

// Auth Store
import { useAuthStore } from '@/store/authStore';

// Public Pages
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import NotFound from '@/pages/NotFound';

// Lazy-loaded Pages
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const FindGarage = lazy(() => import('@/pages/CarOwner/FindGarage'));
const MyReservations = lazy(() => import('@/pages/CarOwner/MyReservations'));
const VehicleManagement = lazy(() => import('@/pages/CarOwner/VehicleManagement'));
const Disputes = lazy(() => import('@/pages/CarOwner/Disputes'));
const CarOwnerPaymentHistory = lazy(() => import('@/pages/CarOwner/PaymentHistory'));
const MyGarages = lazy(() => import('@/pages/GarageOwner/MyGarages'));
const AddGarage = lazy(() => import('@/pages/GarageOwner/AddGarage'));
const EditGarage = lazy(() => import('@/pages/GarageOwner/EditGarage'));
const GarageAnalytics = lazy(() => import('@/pages/GarageOwner/Analytics'));
const GarageBookings = lazy(() => import('@/pages/GarageOwner/Bookings'));
const GarageDisputes = lazy(() => import('@/pages/GarageOwner/Disputes'));
const Users = lazy(() => import('@/pages/Admin/Users'));
const Reports = lazy(() => import('@/pages/Admin/Reports'));
const SystemOverview = lazy(() => import('@/pages/Admin/SystemOverview'));
const GarageVerification = lazy(() => import('@/pages/Admin/GarageVerification'));
const DisputeManagement = lazy(() => import('@/pages/Admin/DisputeManagement'));
const GarageManagement = lazy(() => import('@/pages/Admin/GarageManagement'));
const CommissionManagement = lazy(() => import('@/pages/Admin/CommissionManagement'));
const Trash = lazy(() => import('@/pages/Admin/Trash'));
const GarageEarnings = lazy(() => import('@/pages/GarageOwner/Earnings'));
const GaragePaymentHistory = lazy(() => import('@/pages/GarageOwner/PaymentHistory'));
const GarageWithdrawal = lazy(() => import('@/pages/GarageOwner/Withdrawal'));
const AdminPaymentHistory = lazy(() => import('@/pages/Admin/PaymentHistory'));
const ArchiveHistory = lazy(() => import('@/pages/Admin/ArchiveHistory'));
const AdminWithdrawals = lazy(() => import('@/pages/Admin/Withdrawals'));
const Refunds = lazy(() => import('@/pages/Admin/Refunds'));
const RegistrationFee = lazy(() => import('@/pages/GarageOwner/RegistrationFee'));
const Agreement = lazy(() => import('@/pages/GarageOwner/Agreement'));
const Profile = lazy(() => import('@/pages/Profile'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));

const queryClient = new QueryClient();

function RoleBasedRedirect() {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;

  switch (user.role) {
    case 'car_owner':
      return <Navigate to="/find-garage" replace />;
    case 'garage_owner':
      return <Navigate to="/my-garages" replace />;
    case 'admin':
      return <Navigate to="/admin/system-overview" replace />;
    default:
      return <Navigate to="/dashboard" replace />;
  }
}

export default function App() {
  const { isLoading } = useAuthStore();
  useSessionTimeout(); // Auto-logout after 30min inactivity

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
        <div className="text-center space-y-4">
          <Loader size="lg" />
          <p className="text-gray-600 dark:text-gray-400">Loading application...</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={<Loader size="lg" />}>
        <Routes>
          {/* Home — standalone, has its own navbar */}
          <Route path="/" element={<Home />} />

          {/* Public routes — with Navbar + Footer */}
          <Route element={
            <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-slate-950">
              <Navbar />
              <main className="flex-1"><Outlet /></main>
              <Footer />
            </div>
          }>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="*" element={<NotFound />} />
          </Route>

          {/* Role-based redirect */}
          <Route path="/app" element={<RoleBasedRedirect />} />

          {/* Protected routes — DashboardLayout has its own header, no Navbar */}
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              {/* ── All authenticated users ── */}
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<Profile />} />

              {/* ── Car Owner only ── */}
              <Route element={<ProtectedRoute roles={['car_owner']} />}>
                <Route path="/find-garage" element={<FindGarage />} />
                <Route path="/my-reservations" element={<MyReservations />} />
                <Route path="/vehicles" element={<VehicleManagement />} />
                <Route path="/disputes" element={<Disputes />} />
                <Route path="/car-payment-history" element={<CarOwnerPaymentHistory />} />
              </Route>

              {/* ── Garage Owner only ── */}
              <Route element={<ProtectedRoute roles={['garage_owner']} />}>
                <Route path="/my-garages" element={<MyGarages />} />
                <Route path="/registration-fee" element={<RegistrationFee />} />
                <Route path="/agreement" element={<Agreement />} />
                <Route path="/add-garage" element={<AddGarage />} />
                <Route path="/edit-garage/:id" element={<EditGarage />} />
                <Route path="/analytics" element={<GarageAnalytics />} />
                <Route path="/bookings" element={<GarageBookings />} />
                <Route path="/garage-disputes" element={<GarageDisputes />} />
                <Route path="/earnings" element={<GarageEarnings />} />
                <Route path="/payment-history" element={<GaragePaymentHistory />} />
                <Route path="/withdrawal" element={<GarageWithdrawal />} />
              </Route>

              {/* ── Admin only ── */}
              <Route element={<ProtectedRoute roles={['admin']} />}>
                <Route path="/admin/users" element={<Users />} />
                <Route path="/admin/reports" element={<Reports />} />
                <Route path="/admin/system-overview" element={<SystemOverview />} />
                <Route path="/admin/garage-verification" element={<GarageVerification />} />
                <Route path="/admin/garage-management" element={<GarageManagement />} />
                <Route path="/admin/disputes" element={<DisputeManagement />} />
                <Route path="/admin/commission" element={<CommissionManagement />} />
                <Route path="/admin/trash" element={<Trash />} />
                <Route path="/admin/payment-history" element={<AdminPaymentHistory />} />
                <Route path="/admin/archive-history" element={<ArchiveHistory />} />
                <Route path="/admin/withdrawals" element={<AdminWithdrawals />} />
                <Route path="/admin/refunds" element={<Refunds />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </Suspense>

      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}