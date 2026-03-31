import React, { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/FirebaseAuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import ErrorBoundary from './components/ErrorBoundary'
import Navbar from './components/Navbar'
import LoadingSpinner from './components/LoadingSpinner'

// Lazy load pages for production performance
const LandingPage = lazy(() => import('./pages/LandingPage'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Profile = lazy(() => import('./pages/Profile'))
const PatientDashboard = lazy(() => import('./pages/PatientDashboard'))
const DoctorDashboard = lazy(() => import('./pages/DoctorDashboard'))
const ReportDetail = lazy(() => import('./pages/ReportDetail'))
const ChatList = lazy(() => import('./pages/ChatList'))
const ChatRealtime = lazy(() => import('./pages/ChatRealtime'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const Notifications = lazy(() => import('./pages/Notifications'))
const NotFound = lazy(() => import('./pages/NotFound'))

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Navbar />
            <main>
              <ErrorBoundary>
                <Suspense fallback={
                  <div className="flex items-center justify-center min-h-[60vh]">
                    <LoadingSpinner />
                  </div>
                }>
                  <Routes>
                    <Route path="/home" element={<LandingPage />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    
                    <Route path="/" element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/profile" element={
                      <ProtectedRoute>
                        <Profile />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/patient-dashboard" element={
                      <ProtectedRoute allowedRoles={['PATIENT', 'ADMIN']}>
                        <PatientDashboard />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/doctor-dashboard" element={
                      <ProtectedRoute allowedRoles={['DOCTOR', 'ADMIN']}>
                        <DoctorDashboard />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/admin-dashboard" element={
                      <ProtectedRoute allowedRoles={['ADMIN']}>
                        <AdminDashboard />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/report/:reportId" element={
                      <ProtectedRoute>
                        <ReportDetail />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/chats" element={
                      <ProtectedRoute>
                        <ChatList />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/chat/:reportId" element={
                      <ProtectedRoute>
                        <ChatRealtime />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/notifications" element={
                      <ProtectedRoute>
                        <Notifications />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </ErrorBoundary>
            </main>
            
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
              }}
            />
          </div>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
