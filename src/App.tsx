import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import Home from '@/src/pages/Home';
import AuthGuard from '@/src/components/AuthGuard';
import { AuthProvider } from '@/src/contexts/AuthContext';

// Lazy load pages for performance
const Login = lazy(() => import('@/src/pages/Login'));
const Signup = lazy(() => import('@/src/pages/Signup'));
const StudentDashboard = lazy(() => import('@/src/pages/StudentDashboard'));
const TeacherDashboard = lazy(() => import('@/src/pages/TeacherDashboard'));
const CreateTest = lazy(() => import('@/src/pages/CreateTest'));
const AdminPanel = lazy(() => import('@/src/pages/AdminPanel'));
const TestInterface = lazy(() => import('@/src/pages/TestInterface'));
const Results = lazy(() => import('@/src/pages/Results'));
const Colleges = lazy(() => import('@/src/pages/admin/Colleges'));
const UsersManagement = lazy(() => import('@/src/pages/admin/Users'));
const SecurityLogs = lazy(() => import('@/src/pages/admin/SecurityLogs'));
const ManageTests = lazy(() => import('@/src/pages/teacher/ManageTests'));
const Students = lazy(() => import('@/src/pages/teacher/Students'));
const Alerts = lazy(() => import('@/src/pages/teacher/Alerts'));
const ImportDataset = lazy(() => import('@/src/pages/teacher/ImportDataset'));
const Leaderboard = lazy(() => import('@/src/pages/Leaderboard'));
const Certificates = lazy(() => import('@/src/pages/Certificates'));
const Profile = lazy(() => import('@/src/pages/Profile'));
const Payment = lazy(() => import('@/src/pages/Payment'));
const Settings = lazy(() => import('@/src/pages/Settings'));
const Practice = lazy(() => import('@/src/pages/student/Practice'));

const LoadingFallback = () => (
  <div className="min-h-screen bg-black flex items-center justify-center">
    <div className="w-12 h-12 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
  </div>
);

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster position="top-right" richColors theme="dark" />
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            
            {/* Protected Routes */}
            <Route 
              path="/student/*" 
              element={
                <AuthGuard allowedRoles={['student']}>
                  <Routes>
                    <Route index element={<StudentDashboard />} />
                    <Route path="practice" element={<Practice />} />
                  </Routes>
                </AuthGuard>
              } 
            />
            <Route 
              path="/teacher/*" 
              element={
                <AuthGuard allowedRoles={['teacher']}>
                  <Routes>
                    <Route index element={<TeacherDashboard />} />
                    <Route path="tests" element={<ManageTests />} />
                    <Route path="students" element={<Students />} />
                    <Route path="alerts" element={<Alerts />} />
                    <Route path="create-test" element={<CreateTest />} />
                    <Route path="import" element={<ImportDataset />} />
                  </Routes>
                </AuthGuard>
              } 
            />
            <Route 
              path="/leaderboard" 
              element={
                <AuthGuard allowedRoles={['student']}>
                  <Leaderboard />
                </AuthGuard>
              } 
            />
            <Route 
              path="/certificates" 
              element={
                <AuthGuard allowedRoles={['student']}>
                  <Certificates />
                </AuthGuard>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <AuthGuard>
                  <Profile />
                </AuthGuard>
              } 
            />
            <Route 
              path="/payment" 
              element={
                <AuthGuard>
                  <Payment />
                </AuthGuard>
              } 
            />
            <Route 
              path="/settings" 
              element={
                <AuthGuard>
                  <Settings />
                </AuthGuard>
              } 
            />
            <Route 
              path="/admin/*" 
              element={
                <AuthGuard allowedRoles={['admin']}>
                  <Routes>
                    <Route index element={<AdminPanel />} />
                    <Route path="users" element={<UsersManagement />} />
                    <Route path="colleges" element={<Colleges />} />
                    <Route path="security" element={<SecurityLogs />} />
                  </Routes>
                </AuthGuard>
              } 
            />
            <Route 
              path="/test/:testId" 
              element={
                <AuthGuard allowedRoles={['student']}>
                  <TestInterface />
                </AuthGuard>
              } 
            />
            <Route 
              path="/results/:testId" 
              element={
                <AuthGuard allowedRoles={['student']}>
                  <Results />
                </AuthGuard>
              } 
            />
            
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}
