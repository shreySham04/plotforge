import { Navigate, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import DashboardPage from "./pages/DashboardPage";
import ProjectEditorPage from "./pages/ProjectEditorPage";
import SharedProjectPage from "./pages/SharedProjectPage";
import StoriesPage from "./pages/StoriesPage";
import ScriptsPage from "./pages/ScriptsPage";
import FanFuturePage from "./pages/FanFuturePage";
import FanFutureDetail from "./pages/FanFutureDetail";
import CreateFanFuture from "./pages/CreateFanFuture";
import FanConceptPage from "./pages/FanConceptPage";
import ProfilePage from "./pages/ProfilePage";
import ReviewsPage from "./pages/ReviewsPage";
import About from "./pages/About";
import ProtectedRoute from "./components/ProtectedRoute";
import Footer from "./components/Footer";

export default function App() {
  return (
    <div className="min-h-screen bg-base text-slate-100">
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/stories"
          element={
            <ProtectedRoute>
              <StoriesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/scripts"
          element={
            <ProtectedRoute>
              <ScriptsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/fanfuture"
          element={
            <ProtectedRoute>
              <FanFuturePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/fanfuture/create"
          element={
            <ProtectedRoute>
              <CreateFanFuture />
            </ProtectedRoute>
          }
        />
        <Route
          path="/fanfuture/:id"
          element={
            <ProtectedRoute>
              <FanFutureDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/fanconcept"
          element={
            <ProtectedRoute>
              <FanConceptPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reviews"
          element={
            <ProtectedRoute>
              <ReviewsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/about"
          element={
            <ProtectedRoute>
              <About />
            </ProtectedRoute>
          }
        />
        <Route
          path="/project/:id"
          element={
            <ProtectedRoute>
              <ProjectEditorPage />
            </ProtectedRoute>
          }
        />
        <Route path="/shared/:token" element={<SharedProjectPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Footer />
    </div>
  );
}
