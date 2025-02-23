import React, { useState, useEffect } from 'react';
import { Link, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Communication from './Communication';
// Stub components for demonstration
const Finances = () => <div><h3>Finances</h3></div>;
const Calendar = () => <div><h3>Calendar</h3></div>;
const Settings = ({ user }) => {
  const [partnerEmail, setPartnerEmail] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPartner = async () => {
      const response = await fetch(`/api/partner?userId=${user.id}`);
      const data = await response.json();
      if (data.success) {
        setPartnerEmail(data.partnerEmail);
      }
    };
    fetchPartner();
  }, [user.id]);

  const handleUnlink = async () => {
    if (window.confirm('Are you sure you want to unlink your partner?')) {
      const response = await fetch(`/api/partner/${user.id}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        setMessage('Partner unlinked successfully');
        setPartnerEmail('');
        localStorage.removeItem('partnerLinked');
      }
    }
  };

  return (
    <div>
      <h3>Account Settings</h3>
      <div className="settings-section">
        <h4>Linked Partner</h4>
        {partnerEmail ? (
          <>
            <p>Linked Partner: {partnerData.firstName} {partnerData.lastName}</p>
            <p>Contact: {partnerData.phone}</p>
            <button onClick={handleUnlink} className="danger-button">
              Unlink Partner
            </button>
          </>
        ) : (
          <p>No partner linked. <Link to="/link-partner">Link a partner</Link></p>
        )}
        {message && <p className="success-message">{message}</p>}
      </div>
    </div>
  );
};

function MainApp() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  const handleLogout = async () => {
    await fetch('/api/logout');
    localStorage.removeItem('user');
    localStorage.removeItem('partnerId');
    localStorage.removeItem('partnerLinked');
    navigate('/login', { state: { message: 'Logged out successfully' } });
  };

  return (
    <div className="main-app-container">
      <nav className="sidebar">
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li><Link to="communication">Communication</Link></li>
          <li><Link to="finances">Finances</Link></li>
          <li><Link to="calendar">Calendar</Link></li>
          <li><Link to="settings">Settings</Link></li>
          <li>
            <button onClick={handleLogout} className="logout-button">
              Sign Out
            </button>
          </li>
        </ul>
      </nav>
      <main className="main-content">
        <Routes>
          <Route path="communication" element={<Communication />} />
          <Route path="finances" element={<Finances />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="settings" element={<Settings user={user} />} />
          <Route path="*" element={<Navigate to="communication" />} />
        </Routes>
      </main>
    </div>
  );
}

export default MainApp; 