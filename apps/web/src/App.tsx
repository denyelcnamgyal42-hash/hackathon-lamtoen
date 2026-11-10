import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { GuestOnly, ProtectedRoute } from "./components/ProtectedRoute";
import { AuthProvider } from "./lib/auth";
import { AdminDashboardPage } from "./pages/AdminDashboardPage";
import { FounderDashboardPage } from "./pages/FounderDashboardPage";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { MentorPage } from "./pages/MentorPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { RegisterPage } from "./pages/RegisterPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<LandingPage />} />
        <Route
          path="login"
          element={
            <GuestOnly>
              <LoginPage />
            </GuestOnly>
          }
        />
        <Route
          path="register"
          element={
            <GuestOnly>
              <RegisterPage />
            </GuestOnly>
          }
        />
        <Route
          path="dashboard"
          element={
            <ProtectedRoute
              roles={["founder"]}
              title="Founder workspace"
              body="This workspace belongs to founder accounts. Admin and mentor accounts have their own pages."
            >
              <FounderDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin"
          element={
            <ProtectedRoute
              roles={["admin"]}
              title="Administration is limited"
              body="This area is for admin accounts provisioned on the server. Public registration creates a founder account and cannot grant admin access."
            >
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="mentor"
          element={
            <ProtectedRoute
              roles={["mentor"]}
              title="Verified mentors only"
              body="Creating a founder account does not grant mentor access. A mentor role is assigned by the platform after verification, which is not available in this release."
            >
              <MentorPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
