import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import Login from './components/Login';
import LinkPartner from './components/LinkPartner';
import AddPartner from './components/AddPartner';
import LinkExistingPartner from './components/LinkExistingPartner';
import InvitePartner from './components/InvitePartner';
import MainApp from './components/MainApp';
import ChildDashboard from './components/ChildDashboard';
import Register from './components/Register';
import ProfileUpdate from './components/ProfileUpdate';
import LogoutConfirmation from './components/LogoutConfirmation';
import AuthSuccess from './components/AuthSuccess';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import './styles.css';
import ChildSignup from './components/ChildSignup';
import AuthDebug from './components/AuthDebug';

function App() {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <AppContent />
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
}

function AppContent() {
  const location = useLocation();
  const { user, loading } = useAuth();
  const requiresProfile = user?.requiresProfile || false;
  const isChild = user?.role === 'child';

  if (loading) {
    return <div className="loading-screen">Loading...</div>;
  }

  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/link-partner" element={<LinkPartner />} />
        <Route path="/add-partner" element={
          user ? <AddPartner /> : <Navigate to="/login" />
        } />
        <Route path="/link-existing-partner" element={
          user ? <LinkExistingPartner /> : <Navigate to="/login" />
        } />
        <Route path="/invite-partner" element={
          user ? <InvitePartner /> : <Navigate to="/login" />
        } />
        <Route path="/profile" element={<ProfileUpdate />} />
        <Route path="/logout" element={<LogoutConfirmation />} />
        <Route path="/auth-success" element={<AuthSuccess />} />
        <Route path="/child-signup" element={<ChildSignup />} />
        <Route path="/auth-debug" element={<AuthDebug />} />
        <Route 
          path="/child-dashboard" 
          element={
            user ? (
              isChild ? (
                <div className="child-dashboard">
                  <ChildDashboard />
                </div>
              ) : (
                <Navigate to="/app" />
              )
            ) : (
              <Navigate to="/login" />
            )
          } 
        />
        <Route 
          path="/app/*" 
          element={
            user ? (
              requiresProfile ? (
                <Navigate to="/profile" replace state={{ requiresProfile: true }} />
              ) : (
                isChild ? (
                  <Navigate to="/child-dashboard" />
                ) : (
                  <div className="main-app">
                    <MainApp />
                  </div>
                )
              )
            ) : (
              <Navigate to="/login" />
            )
          } 
        />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </div>
  );
}

export default App;