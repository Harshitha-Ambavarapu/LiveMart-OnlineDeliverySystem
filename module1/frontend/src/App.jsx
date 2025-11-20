import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import CustomerPage from './pages/CustomerPage';
import RetailerPage from './pages/RetailerPage';
import WholesalerPage from './pages/WholesalerPage';
import SocialLoginSuccess from './pages/SocialLoginSuccess';

function App(){
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/social-login-success" element={<SocialLoginSuccess />} />
        <Route path="/customer" element={<ProtectedRoute allowedRoles={['customer']}><CustomerPage/></ProtectedRoute>} />
        <Route path="/retailer" element={<ProtectedRoute allowedRoles={['retailer']}><RetailerPage/></ProtectedRoute>} />
        <Route path="/wholesaler" element={<ProtectedRoute allowedRoles={['wholesaler']}><WholesalerPage/></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
