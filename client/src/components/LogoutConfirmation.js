import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LogoutConfirmation() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    const performLogout = async () => {
      try {
        const result = await logout();
        navigate('/login', { 
          state: { message: 'Logged out successfully' } 
        });
      } catch (err) {
        navigate('/login');
      }
    };
    
    performLogout();
  }, [navigate, logout]);

  return <div className="logout-message">Logging out...</div>;
} 