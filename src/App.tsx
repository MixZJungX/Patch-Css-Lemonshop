import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Admin from './pages/Admin';
import Status from './pages/Status';
import ChangePassword from './pages/ChangePassword';
import ChickenRedemption from './pages/ChickenRedemption';
import RedeemPage from './pages/RedeemPage';
import NotFound from './pages/NotFound';
import { ChickenImportDebug } from './components/ChickenImportDebug';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/status" element={<Status />} />
            <Route path="/chicken" element={<ChickenRedemption />} />
            <Route path="/redeem" element={<RedeemPage />} />
            
            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/admin" element={<Admin />} />
              <Route path="/change-password" element={<ChangePassword />} />
              <Route path="/chicken-import-debug" element={<ChickenImportDebug />} />
            </Route>
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
