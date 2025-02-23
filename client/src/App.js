import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './components/Login';
import LinkPartner from './components/LinkPartner';
import MainApp from './components/MainApp';
import Register from './components/Register';
import './styles.css';

function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={!user ? <Login setUser={setUser} /> : <Navigate to="/app" />} 
        />
        <Route 
          path="/link-partner" 
          element={user ? (
            <LinkPartner user={user} />
          ) : (
            <Navigate to="/login" />
          )} 
        />
        <Route 
          path="/app/*" 
          element={user ? <MainApp /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/register" 
          element={!user ? <Register /> : <Navigate to="/app" />} 
        />
        <Route 
          path="*" 
          element={<Navigate to={user ? "/app" : "/login"} />} 
        />
      </Routes>
    </Router>
  );
}

export default App; 