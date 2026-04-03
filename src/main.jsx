import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import NotFound from './pages/NotFound.jsx'
import ToDo from './pages/ToDo.jsx'
import Login from './pages/Login.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import ProtectedRoute, { RoleProtectedRoute } from './components/ProtectedRoute.jsx'
import UserProfile from './User/UserProfile.jsx'
import SignUp from './pages/SignUp.jsx'
import AdminDashboard from './Admin/AdminDashboard.jsx'
import SellerDashboard from './Seller/SellerDashboard.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/Home" element={<ProtectedRoute><App /></ProtectedRoute>} />
          <Route path="/" element={<Login />} />
          <Route path="/todo" element={<ToDo />} />
          <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
          <Route path="/sign-up" element={<SignUp />} />
          <Route
            path="/admin"
            element={
              <RoleProtectedRoute path="/admin" allowedRoles={['admin']}>
                <AdminDashboard />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/seller"
            element={
              <RoleProtectedRoute path="/seller" allowedRoles={['seller']}>
                <SellerDashboard />
              </RoleProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>,
)
