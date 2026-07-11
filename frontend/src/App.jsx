import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';

import Login from './pages/Login';

// Student pages
import StudentDashboard from './pages/student/StudentDashboard';
import ProposalForm from './pages/student/ProposalForm';
import Documents from './pages/student/Documents';

// Advisor pages
import AdvisorDashboard from './pages/advisor/AdvisorDashboard';
import GradingForm from './pages/advisor/GradingForm';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageUsers from './pages/admin/ManageUsers';
import ProposalReview from './pages/admin/ProposalReview';
import GroupsOverview from './pages/admin/GroupsOverview'; // FIX: was missing entirely
import SelectSupervisor from './pages/student/SelectSupervisor';

function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main>{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* ── Student routes ── */}
          <Route path="/student" element={
            <ProtectedRoute allowedRoles={['student']}>
              <Layout><StudentDashboard /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/student/proposal" element={
            <ProtectedRoute allowedRoles={['student']}>
              <Layout><ProposalForm /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/student/documents" element={
            <ProtectedRoute allowedRoles={['student']}>
              <Layout><Documents /></Layout>
            </ProtectedRoute>
          } />

          {/* ── Advisor routes ── */}
          <Route path="/advisor" element={
            <ProtectedRoute allowedRoles={['advisor']}>
              <Layout><AdvisorDashboard /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/advisor/grade/:groupId" element={
            <ProtectedRoute allowedRoles={['advisor']}>
              <Layout><GradingForm /></Layout>
            </ProtectedRoute>
          } />

          {/* ── Admin routes ── */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Layout><AdminDashboard /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/groups" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Layout><GroupsOverview /></Layout>   {/* FIX: route was missing */}
            </ProtectedRoute>
          } />
          <Route path="/admin/proposals" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Layout><ProposalReview /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Layout><ManageUsers /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/student/select-supervisor" element={
            <ProtectedRoute allowedRoles={['student']}>
              <Layout><SelectSupervisor /></Layout>
            </ProtectedRoute>
} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}