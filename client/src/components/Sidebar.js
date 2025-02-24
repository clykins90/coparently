const handleLogout = async () => {
  try {
    await fetch('/api/logout', { method: 'POST' });
    localStorage.removeItem('user');
    window.location = '/login'; // Clean redirect
  } catch (err) {
    console.error('Logout error:', err);
  }
}; 