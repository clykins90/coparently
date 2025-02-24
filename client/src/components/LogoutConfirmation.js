import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LogoutConfirmation() {
  const navigate = useNavigate();

  useEffect(() => {
    const logout = async () => {
      try {
        await fetch('/api/logout', { method: 'POST' });
        localStorage.removeItem('user');
        navigate('/login');
      } catch (err) {
        navigate('/login');
      }
    };
    
    logout();
  }, [navigate]);

  return <div className="logout-message">Logging out...</div>;
} 