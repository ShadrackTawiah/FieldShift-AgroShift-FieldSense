
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import AppLayout from './layouts/AppLayout'

import LandingPage from './pages/LandingPage'
import Dashboard from './pages/Dashboard'
import FarmManagement from './pages/FarmManagement'
import ClimateInsights from './pages/ClimateInsights'
import EarthObservation from './pages/EarthObservation'
import SoilIntelligence from './pages/SoilIntelligence'
import FarmMapping from './pages/FarmMapping'
import CropRotation from './pages/CropRotation'
import StrategyComparison from './pages/StrategyComparison'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import FarmerProfile from './pages/FarmerProfile'

import Register from './pages/Register'
import Login from './pages/Login'

import { useAuth } from './context/AuthContext'

import './styles/global.css'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <div style={{ padding: 30 }}>Loading account...</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Public landing page */}
        <Route path="/" element={<LandingPage />} />

        {/* Public authentication pages */}
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />

        {/* Protected dashboard pages */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="farms" element={<FarmManagement />} />
          <Route path="climate" element={<ClimateInsights />} />
          <Route path="earth-observation" element={<EarthObservation />} />
          <Route path="soil" element={<SoilIntelligence />} />
          <Route path="mapping" element={<FarmMapping />} />
          <Route path="crop-rotation" element={<CropRotation />} />
          <Route path="comparison" element={<StrategyComparison />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
          <Route path="farmer-profile" element={<FarmerProfile />} />
        </Route>

        {/* Unknown URLs */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  )
}

export default App
