import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import Login from './components/Login';
import LinkPartner from './components/LinkPartner';
import MainApp from './components/MainApp';
import Register from './components/Register';
import ProfileUpdate from './components/ProfileUpdate';
import TestAI from './TestAI';
import LogoutConfirmation from './components/LogoutConfirmation';
import './styles.css';

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

function AppContent() {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [requiresProfile, setRequiresProfile] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    setLoading(true);
    
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      const isComplete = parsedUser?.email?.trim();
      setRequiresProfile(!isComplete);
      setLoading(false);
    } else {
      setLoading(false);
    }
    
    if (location.state?.requiresProfile === true) {
      setRequiresProfile(true);
    }
  }, [location]);

  if (loading) {
    return <div className="loading-screen">Loading...</div>;
  }

  return (
    <div className="App">
      <Routes>
        <Route path="/login" element={<Login setUser={setUser} />} />
        <Route path="/register" element={<Register setUser={setUser} />} />
        <Route path="/link-partner" element={<LinkPartner user={user} />} />
        <Route path="/profile" element={<ProfileUpdate user={user} />} />
        <Route path="/logout" element={<LogoutConfirmation />} />
        <Route path="/test-ai" element={<TestAI />} />
        <Route 
          path="/app/*" 
          element={
            user ? (
              requiresProfile ? (
                <Navigate to="/profile" replace state={{ requiresProfile: true }} />
              ) : (
                <div className="main-app">
                  <MainApp user={user} />
                </div>
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